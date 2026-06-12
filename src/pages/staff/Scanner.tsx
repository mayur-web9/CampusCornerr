import { useState, useEffect, useRef, useCallback } from 'react';
import { QrCode, CheckCircle, XCircle, AlertCircle, Clock, User, Home, Camera, CameraOff } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { ScanResult, MealLog } from '../../lib/types';
import { toast } from 'sonner';
import jsQR from 'jsqr';

type MealType = 'breakfast' | 'lunch' | 'dinner';

function getMealSession(): MealType {
  const hour = new Date().getHours();
  if (hour >= 8 && hour < 22) return 'breakfast';
  if (hour >= 12 && hour < 18) return 'lunch';
  return 'dinner';
}

export default function StaffScanner() {
  useAuth();
  const [mealType, setMealType] = useState<MealType>(getMealSession());
  const [scanInput, setScanInput] = useState('');
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState<ScanResult | null>(null);
  const [history, setHistory] = useState<MealLog[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);

  // Camera state
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const scanLoopRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastScannedRef = useRef<string | null>(null);

  useEffect(() => {
    loadHistory();
  }, [mealType]);

  // Stop camera on unmount
  useEffect(() => {
    return () => stopCamera();
  }, []);

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

  // ── Camera helpers ──────────────────────────────────────────────
  async function startCamera() {
    setCameraError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 640 }, height: { ideal: 480 } },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setCameraActive(true);
      lastScannedRef.current = null;
      // Start frame scan loop every 150ms
      scanLoopRef.current = setInterval(scanFrame, 150);
    } catch (err: any) {
      setCameraError('Camera access denied. Please allow camera permission and try again.');
    }
  }

  function stopCamera() {
    if (scanLoopRef.current) clearInterval(scanLoopRef.current);
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  }

  function toggleCamera() {
    if (cameraActive) stopCamera();
    else startCamera();
  }

  const scanFrame = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || video.readyState < 2) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const code = jsQR(imageData.data, imageData.width, imageData.height, {
      inversionAttempts: 'dontInvert',
    });

    if (code && code.data && code.data !== lastScannedRef.current) {
      lastScannedRef.current = code.data;
      // Pause scanning briefly to avoid double-trigger
      if (scanLoopRef.current) clearInterval(scanLoopRef.current);
      processQR(code.data).then(() => {
        // Resume scanning after 3s
        lastScannedRef.current = null;
        if (cameraActive) {
          scanLoopRef.current = setInterval(scanFrame, 150);
        }
      });
    }
  }, [cameraActive]);

  // ── QR Processing ────────────────────────────────────────────────
  async function processQR(qrData: string) {
    if (scanning) return;
    setScanning(true);
    setResult(null);

    try {
      let studentIdToFind = null;
      let codeToFind = null;

      // Try parsing as JSON (from QR code)
      try {
        const payload = JSON.parse(qrData);
        // Only treat as a QR payload if it's an object with a studentId field
        if (!payload || typeof payload !== 'object' || !payload.studentId) {
          throw new Error('Not a QR payload');
        }
        studentIdToFind = payload.studentId;

        // ── Meal-type mismatch check ──────────────────────────────
        if (payload.mealType && payload.mealType !== mealType) {
          const scanned = (payload.mealType as string).charAt(0).toUpperCase() + payload.mealType.slice(1);
          const current = mealType.charAt(0).toUpperCase() + mealType.slice(1);
          setResult({
            success: false,
            message: `Wrong Meal Scanner — This QR is for ${scanned}, not ${current}`,
          });
          setScanning(false);
          return;
        }
      } catch {
        // If not JSON, treat it as a manually typed 12-digit fallback code
        codeToFind = qrData.trim();
      }

      if (!studentIdToFind && !codeToFind) throw new Error('Invalid input');

      let student = null;

      if (studentIdToFind) {
        // ── QR scan path ──────────────────────────────────────────
        const { data } = await supabase.from('students').select('*').eq('id', studentIdToFind).maybeSingle();
        if (!data) {
          setResult({ success: false, message: 'QR Code Unrecognised — Student account not found. Contact admin.' });
          setScanning(false);
          return;
        }
        student = data;

      } else {
        // ── Manual / fallback code path ───────────────────────────

        // 1. New format with correct meal prefix  e.g. "breakfast:454302190366"
        const { data: byNewQr } = await supabase
          .from('students').select('*')
          .eq('qr_code', `${mealType}:${codeToFind!}`)
          .maybeSingle();

        if (byNewQr) {
          student = byNewQr;
        } else {
          // 2. Check for new-format code under a DIFFERENT meal prefix → wrong meal
          const otherMeals = (['breakfast', 'lunch', 'dinner'] as const).filter(m => m !== mealType);
          let wrongMeal: string | null = null;
          for (const mt of otherMeals) {
            const { data: hit } = await supabase
              .from('students').select('id')
              .eq('qr_code', `${mt}:${codeToFind!}`)
              .maybeSingle();
            if (hit) { wrongMeal = mt; break; }
          }
          if (wrongMeal) {
            const forMeal = wrongMeal.charAt(0).toUpperCase() + wrongMeal.slice(1);
            const curMeal = mealType.charAt(0).toUpperCase() + mealType.slice(1);
            setResult({ success: false, message: `Wrong Meal Type — This code is for ${forMeal}, not ${curMeal}` });
            setScanning(false);
            return;
          }

          // 3. Old format (plain code, no prefix) — backward compatibility
          const { data: byOldQr } = await supabase
            .from('students').select('*')
            .eq('qr_code', codeToFind!)
            .maybeSingle();

          if (byOldQr) {
            student = byOldQr;
          } else {
            // 4. Permanent student_code — admin override, no meal restriction
            const { data: byCode } = await supabase
              .from('students').select('*')
              .eq('student_code', codeToFind!)
              .maybeSingle();

            if (byCode) {
              student = byCode;
            } else {
              // Nothing matched anywhere
              setResult({
                success: false,
                message: 'Invalid Code — Code not recognised. Ask student to regenerate their QR pass.',
              });
              setScanning(false);
              return;
            }
          }
        }
      }


      const today = new Date().toISOString().split('T')[0];

      // Fetch the most recent subscription for this student (any status)
      const { data: sub } = await supabase
        .from('subscriptions')
        .select('*, plan:meal_plans(*)')
        .eq('student_id', student.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!sub) {
        setResult({ success: false, message: `No Subscription — ${student.full_name} has no meal plan. Ask them to subscribe first.`, student });
        setScanning(false);
        return;
      }

      if (sub.end_date < today || sub.status === 'expired') {
        setResult({ success: false, message: 'Subscription Expired — Plan ended on ' + new Date(sub.end_date).toLocaleDateString('en-IN') + '. Student must renew.', student, subscription: sub, mealType });
        setScanning(false);
        return;
      }

      if (sub.status === 'cancelled') {
        setResult({ success: false, message: 'Subscription Cancelled — This plan has been cancelled. Contact admin.', student, subscription: sub, mealType });
        setScanning(false);
        return;
      }

      if (sub.status !== 'active') {
        setResult({ success: false, message: `Subscription Inactive — Status: ${sub.status}. Contact admin.`, student, subscription: sub, mealType });
        setScanning(false);
        return;
      }

      const { data: existing } = await supabase
        .from('meal_logs')
        .select('id')
        .eq('student_id', student.id)
        .eq('meal_session', mealType)
        .eq('meal_date', today)
        .maybeSingle();

      if (existing) {
        setResult({ success: false, message: 'Meal Already Taken', student, subscription: sub, mealType });
        setScanning(false);
        return;
      }

      const { error: logErr } = await supabase.from('meal_logs').insert({
        student_id: student.id,
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
    } catch (err) {
      console.error('Scanner error:', err);
      setResult({ success: false, message: 'System Error — Something went wrong. Please try again or contact support.' });
    }
    setScanning(false);
  }

  async function handleManualSubmit(e: React.FormEvent) {
    e.preventDefault();
    const code = scanInput.trim();
    if (code) {
      setScanInput('');
      await processQR(code);
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
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <QrCode className="w-5 h-5 text-red-600" />
              <h2 className="font-bold text-gray-900">QR Scanner</h2>
            </div>
            <button
              onClick={toggleCamera}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-semibold transition-all ${
                cameraActive
                  ? 'bg-red-100 text-red-700 hover:bg-red-200'
                  : 'bg-red-600 text-white hover:bg-red-700'
              }`}
            >
              {cameraActive ? <CameraOff className="w-4 h-4" /> : <Camera className="w-4 h-4" />}
              {cameraActive ? 'Stop Camera' : 'Start Camera'}
            </button>
          </div>

          {/* Camera / Placeholder area */}
          <div className="relative bg-gray-900 rounded-2xl overflow-hidden mb-4" style={{ aspectRatio: '4/3' }}>
            {/* Live video */}
            <video
              ref={videoRef}
              className={`w-full h-full object-cover ${cameraActive ? 'block' : 'hidden'}`}
              muted
              playsInline
            />
            {/* Hidden canvas for frame decoding */}
            <canvas ref={canvasRef} className="hidden" />

            {/* Scanning overlay */}
            {cameraActive && (
              <>
                {/* Corner guides */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="relative w-48 h-48">
                    <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-red-500 rounded-tl-lg" />
                    <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-red-500 rounded-tr-lg" />
                    <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-red-500 rounded-bl-lg" />
                    <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-red-500 rounded-br-lg" />
                    {/* Scan line */}
                    <div className="absolute left-0 right-0 h-0.5 bg-red-500/80 animate-bounce" style={{ top: '50%' }} />
                  </div>
                </div>
                <p className="absolute bottom-3 left-0 right-0 text-center text-white/70 text-xs">
                  Point camera at student QR code
                </p>
                {scanning && (
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                    <div className="w-8 h-8 border-4 border-white/30 border-t-white rounded-full animate-spin" />
                  </div>
                )}
              </>
            )}

            {/* Placeholder (no camera) */}
            {!cameraActive && (
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <div className="absolute inset-0 opacity-10"
                  style={{ backgroundImage: 'repeating-linear-gradient(0deg,#fff 0,#fff 1px,transparent 1px,transparent 20px),repeating-linear-gradient(90deg,#fff 0,#fff 1px,transparent 1px,transparent 20px)' }}
                />
                <Camera className="w-12 h-12 text-white/30 mb-3" />
                <p className="text-white/50 text-sm text-center px-6">
                  {cameraError ?? 'Press "Start Camera" to scan QR codes'}
                </p>
              </div>
            )}
          </div>

          {cameraError && (
            <p className="text-xs text-red-600 bg-red-50 rounded-lg p-2 mb-3">{cameraError}</p>
          )}

          {/* Manual input fallback */}
          <form onSubmit={handleManualSubmit}>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Manual Input <span className="text-gray-400 font-normal">(fallback)</span>
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={scanInput}
                onChange={e => setScanInput(e.target.value)}
                placeholder='Enter fallback code or student code'
                className="input-field flex-1 text-xs"
              />
              <button type="submit" disabled={scanning || !scanInput} className="btn-primary px-4 whitespace-nowrap">
                {scanning ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'Process'}
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
