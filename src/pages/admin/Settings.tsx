import { useState } from 'react';
import { Lock, Eye, EyeOff, ChefHat } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'sonner';

export default function AdminSettings() {
  const { profile } = useAuth();
  const [pwForm, setPwForm] = useState({ current: '', newPw: '', confirm: '' });
  const [showPw, setShowPw] = useState({ current: false, new: false, confirm: false });
  const [saving, setSaving] = useState(false);

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    if (pwForm.newPw.length < 8) { toast.error('Password must be at least 8 characters'); return; }
    if (pwForm.newPw !== pwForm.confirm) { toast.error('Passwords do not match'); return; }
    setSaving(true);
    const { error } = await supabase.auth.updateUser({ password: pwForm.newPw });
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success('Password updated successfully');
    setPwForm({ current: '', newPw: '', confirm: '' });
  }

  const validations = [
    { label: 'At least 8 characters', ok: pwForm.newPw.length >= 8 },
    { label: 'Include number or symbol', ok: /[0-9!@#$%^&*]/.test(pwForm.newPw) },
    { label: 'Passwords match', ok: pwForm.newPw.length > 0 && pwForm.newPw === pwForm.confirm },
  ];

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-500 text-sm mt-1">Manage your account settings</p>
      </div>

      {/* Profile Info */}
      <div className="card">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-gradient-to-br from-red-500 to-red-600 rounded-2xl flex items-center justify-center shadow-lg shadow-red-200">
            <span className="text-white font-bold text-xl">{profile?.full_name?.charAt(0)}</span>
          </div>
          <div>
            <h2 className="font-bold text-gray-900">{profile?.full_name}</h2>
            <p className="text-gray-500 text-sm">{profile?.email}</p>
            <span className="inline-flex mt-1 items-center px-2 py-0.5 bg-red-100 text-red-700 text-xs font-semibold rounded-full capitalize">
              Administrator
            </span>
          </div>
        </div>
      </div>

      {/* Change Password */}
      <div className="card">
        <div className="flex items-center gap-2 mb-5">
          <Lock className="w-5 h-5 text-red-600" />
          <h3 className="font-bold text-gray-900">Change Password</h3>
        </div>
        <form onSubmit={handleChangePassword} className="space-y-4">
          {[
            { label: 'Current Password', key: 'current', showKey: 'current' as const },
            { label: 'New Password', key: 'newPw', showKey: 'new' as const },
            { label: 'Confirm New Password', key: 'confirm', showKey: 'confirm' as const },
          ].map(field => (
            <div key={field.key}>
              <label className="block text-sm font-medium text-gray-700 mb-1">{field.label}</label>
              <div className="relative">
                <input
                  type={(showPw as any)[field.showKey] ? 'text' : 'password'}
                  value={(pwForm as any)[field.key]}
                  onChange={e => setPwForm({ ...pwForm, [field.key]: e.target.value })}
                  placeholder={`Enter ${field.label.toLowerCase()}`}
                  className="input-field pr-10"
                />
                <button type="button" onClick={() => setShowPw({ ...showPw, [field.showKey]: !(showPw as any)[field.showKey] })} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                  {(showPw as any)[field.showKey] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          ))}

          {/* Validations */}
          {pwForm.newPw && (
            <div className="space-y-1.5">
              {validations.map(v => (
                <div key={v.label} className="flex items-center gap-2">
                  <div className={`w-4 h-4 rounded-full flex items-center justify-center ${v.ok ? 'bg-green-500' : 'bg-gray-200'}`}>
                    {v.ok && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
                  </div>
                  <span className={`text-xs ${v.ok ? 'text-green-600' : 'text-gray-400'}`}>{v.label}</span>
                </div>
              ))}
            </div>
          )}

          <button type="submit" disabled={saving || !validations.every(v => v.ok)} className="w-full btn-primary py-3 font-semibold flex items-center justify-center gap-2">
            {saving ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : null}
            Update Password
          </button>
        </form>
      </div>

      {/* About */}
      <div className="card">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 bg-red-600 rounded-xl flex items-center justify-center">
            <ChefHat className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="font-bold text-gray-900">HostelPro</h3>
            <p className="text-sm text-gray-500">Hostel Mess Management System</p>
          </div>
        </div>
        <p className="text-sm text-gray-500 mb-4">Version 1.0.0 — Production Ready</p>
        <div className="space-y-2">
          {['Terms & Conditions', 'Privacy Policy', 'Help & Support'].map(item => (
            <div key={item} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg cursor-pointer">
              <span className="text-sm text-gray-700">{item}</span>
              <span className="text-gray-400">›</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
