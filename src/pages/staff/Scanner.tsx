import { useState, useEffect, useRef } from 'react';
import { QrCode, CheckCircle, XCircle, AlertCircle, Clock, User, Home } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { ScanResult, MealLog } from '../../lib/types';
import { toast } from 'sonner';

type MealType = 'breakfast' | 'lunch' | 'dinner';

function getMealSession(): MealType {
  const hour = new Date().getHours();
  if (hour >= 6 && hour < 12) return 'breakfast';
  if (hour >= 12 && hour < 18) return 'lunch';
  return 'dinner';
}

export default function StaffScanner() {
  const { profile } = useAuth();
  const [mealType, setMealType] = useState<MealType>(getMealSession());
  const [scanInput, setScanInput] = useState('');
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState<ScanResult | null>(null);
  const [history, setHistory] = useState<MealLog[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadHistory();
  }, [mealType]);

  async function loadHistory() {
    setLoadingHistory(true);
    const today = new Date().toISOString().split('T')[0];
    const { data } = await supabase
      .from('meal_logs')
      .select('*, student:students(full_name, room_number, student_code)')
      .eq('meal_session', mealType)
      .eq('meal_date', today)
      .order('served_at', { ascending: false })
      .limit(20);
    setHistory(data ?? []);
    setLoadingHistory(false);
  }

  async function processQR(qrData: string) {
    setScanning(true);
    setResult(null);

    try {
      const payload = JSON.parse(qrData);
      const { studentId, mealType: qrMealType } = payload;

      if (!studentId) throw new Error('Invalid QR code');

      // Fetch student
      const { data: student, error: sErr } = await supabase
        .from('students')
        .select('*')
        .eq('id', studentId)
        .maybeSingle();

      if (sErr || !student) {
        setResult({ success: false, message: 'Student not found' });
        setScanning(false);
        return;
      }

      // Fetch active subscription
      const today = new Date().toISOString().split('T')[0];
      const { data: sub } = await supabase
        .from('subscriptions')
        .select('*, plan:meal_plans(*)')
        .eq('student_id', studentId)
        .eq('status', 'active')
        .lte('start_date', today)
        .gte('end_date', today)
        .maybeSingle();

      if (!sub) {
        setResult({ success: false, message: 'Subscription Expired or Not Found' });
        setScanning(false);
        return;
      }

      // Check if meal already taken
      const { data: existing } = await supabase
        .from('meal_logs')
        .select('id')
        .eq('student_id', studentId)
        .eq('meal_session', mealType)
        .eq('meal_date', today)
        .maybeSingle();

      if (existing) {
        setResult({ success: false, message: 'Meal Already Taken', student, subscription: sub, mealType });
        setScanning(false);
        return;
      }

      // Get staff id
      const staffRecord = profile as any;

      // Insert meal log
      const { error: logErr } = await supabase.from('meal_logs').insert({
        student_id: studentId,
        subscription_id: sub.id,
        staff_id: null,
        meal_session: mealType,
        meal_date: today,
        served_at: new Date().toISOString(),
      });

      if (logErr) throw logErr;

      setResult({ success: true, message: 'Meal Granted Successfully', student, subscription: sub, mealType });
      toast.success(`Meal granted to ${student.full_name}`);
      loadHistory();
    } catch {
      setResult({ success: false, message: 'Invalid QR Code' });
    }
    setScanning(false);
  }

  function handleManualSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (scanInput.trim()) {
      processQR(scanInput.trim());
      setScanInput('');
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Meal Scanner</h1>
        <p className="text-gray-500 text-sm mt-1">Scan student QR codes to grant meals</p>
      </div>

      {/* Meal Type Selector */}
      <div className="card">
        <h2 className="font-semibold text-gray-900 mb-3">Select Meal Session</h2>
        <div className="grid grid-cols-3 gap-3">
          {(['breakfast', 'lunch', 'dinner'] as MealType[]).map(type => (
            <button
              key={type}
              onClick={() => { setMealType(type); setResult(null); }}
              className={`py-3 rounded-xl capitalize font-semibold text-sm transition-all ${mealType === type ? 'bg-red-600 text-white shadow-md shadow-red-200' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
            >
              {type === 'breakfast' ? '☀️' : type === 'lunch' ? '🌤️' : '🌙'} {type}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Scanner Panel */}
        <div className="card">
          <div className="flex items-center gap-2 mb-5">
            <QrCode className="w-5 h-5 text-red-600" />
            <h2 className="font-bold text-gray-900">QR Scanner</h2>
          </div>

          {/* Scanner area - simulated */}
          <div className="bg-gray-900 rounded-2xl aspect-square flex flex-col items-center justify-center relative overflow-hidden mb-4">
            <div className="absolute inset-0 opacity-10">
              <div className="w-full h-full" style={{ backgroundImage: 'repeating-linear-gradient(0deg, #fff 0, #fff 1px, transparent 1px, transparent 20px), repeating-linear-gradient(90deg, #fff 0, #fff 1px, transparent 1px, transparent 20px)' }} />
            </div>
            <QrCode className="w-16 h-16 text-white/40 mb-3" />
            <p className="text-white/60 text-sm text-center px-6">
              Enter QR data below or use a physical QR scanner
            </p>
            {/* Scan line animation */}
            <div className="absolute left-6 right-6 h-0.5 bg-red-500/70 animate-bounce" style={{ top: '50%' }} />
          </div>

          {/* Manual input */}
          <form onSubmit={handleManualSubmit}>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Paste QR Data / Scan Input</label>
            <div className="flex gap-2">
              <input
                ref={inputRef}
                type="text"
                value={scanInput}
                onChange={e => setScanInput(e.target.value)}
                placeholder='{"studentId":"...","mealType":"..."}'
                className="input-field flex-1 text-xs"
                autoFocus
              />
              <button type="submit" disabled={scanning || !scanInput} className="btn-primary px-4 whitespace-nowrap">
                {scanning ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'Scan'}
              </button>
            </div>
          </form>
        </div>

        {/* Result Panel */}
        <div className="space-y-4">
          {result ? (
            <div className={`card border-2 ${result.success ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}>
              <div className="flex items-center gap-3 mb-4">
                {result.success ? (
                  <CheckCircle className="w-8 h-8 text-green-600" />
                ) : result.message === 'Meal Already Taken' ? (
                  <AlertCircle className="w-8 h-8 text-yellow-600" />
                ) : (
                  <XCircle className="w-8 h-8 text-red-600" />
                )}
                <div>
                  <h3 className={`font-bold text-lg ${result.success ? 'text-green-800' : result.message === 'Meal Already Taken' ? 'text-yellow-800' : 'text-red-800'}`}>
                    {result.message}
                  </h3>
                  <p className="text-sm text-gray-500 capitalize">{mealType} Session</p>
                </div>
              </div>

              {result.student && (
                <div className="space-y-3 pt-4 border-t border-gray-200">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-red-600 rounded-xl flex items-center justify-center">
                      <span className="text-white font-bold">{result.student.full_name.charAt(0)}</span>
                    </div>
                    <div>
                      <p className="font-bold text-gray-900">{result.student.full_name}</p>
                      <p className="text-sm text-gray-500">{result.student.student_code}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex items-center gap-2 p-3 bg-white rounded-lg">
                      <Home className="w-4 h-4 text-gray-400" />
                      <div>
                        <p className="text-xs text-gray-500">Room</p>
                        <p className="text-sm font-semibold">{result.student.room_number || '—'}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 p-3 bg-white rounded-lg">
                      <User className="w-4 h-4 text-gray-400" />
                      <div>
                        <p className="text-xs text-gray-500">Plan</p>
                        <p className="text-sm font-semibold">{(result.subscription?.plan as any)?.plan_name || '—'}</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="card text-center py-10">
              <QrCode className="w-12 h-12 text-gray-200 mx-auto mb-3" />
              <p className="text-gray-500 text-sm">Scan result will appear here</p>
            </div>
          )}

          {/* Quick Stats */}
          <div className="card">
            <div className="flex items-center gap-2 mb-3">
              <Clock className="w-4 h-4 text-gray-500" />
              <h3 className="font-semibold text-gray-900 text-sm">Today's Count — {mealType}</h3>
            </div>
            <div className="text-3xl font-bold text-red-600">{history.length}</div>
            <p className="text-xs text-gray-500 mt-1">meals served today</p>
          </div>
        </div>
      </div>

      {/* Scan History */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-gray-900">Recent Scans — {mealType}</h2>
          <span className="text-sm text-gray-500">{history.length} scans today</span>
        </div>
        {loadingHistory ? (
          <div className="space-y-2 animate-pulse">
            {[1, 2, 3].map(i => <div key={i} className="h-12 bg-gray-100 rounded-lg" />)}
          </div>
        ) : history.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <p className="text-sm">No scans yet for {mealType}</p>
          </div>
        ) : (
          <div className="space-y-2">
            {history.map(log => (
              <div key={log.id} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 text-sm truncate">{(log.student as any)?.full_name}</p>
                  <p className="text-xs text-gray-500">Room {(log.student as any)?.room_number} • {(log.student as any)?.student_code}</p>
                </div>
                <p className="text-xs text-gray-400 flex-shrink-0">
                  {new Date(log.served_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
