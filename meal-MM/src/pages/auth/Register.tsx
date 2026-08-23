import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Mail, Lock, User, Phone, Users, CheckCircle2, XCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'sonner';
import Logo from '../../components/ui/Logo';

interface FormData {
  full_name: string;
  email: string;
  phone: string;
  role: 'Student' | 'Faculty' | '';
  password: string;
  confirm_password: string;
}

const INITIAL: FormData = {
  full_name: '',
  email: '',
  phone: '',
  role: '',
  password: '',
  confirm_password: '',
};

export default function Register() {
  const [form, setForm] = useState<FormData>(INITIAL);
  const [showPw, setShowPw] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { user, role, loading: authLoading, refreshProfile } = useAuth();

  useEffect(() => {
    if (!authLoading && user && role) {
      if (role === 'admin') navigate('/admin/dashboard', { replace: true });
      else if (role === 'staff') navigate('/staff/scanner', { replace: true });
      else navigate('/student/dashboard', { replace: true });
    }
  }, [authLoading, user, role, navigate]);

  function update(key: keyof FormData, value: string) {
    setForm(prev => ({ ...prev, [key]: value }));
  }

  const pwChecks = [
    { label: 'At least 8 characters', ok: form.password.length >= 8 },
    { label: 'Contains a number', ok: /[0-9]/.test(form.password) },
    { label: 'Passwords match', ok: form.password.length > 0 && form.password === form.confirm_password },
  ];

  function validate() {
    if (!form.full_name.trim()) { toast.error('Full name is required'); return false; }
    if (!form.email.trim() || !/\S+@\S+\.\S+/.test(form.email)) { toast.error('Valid email is required'); return false; }
    if (!form.phone.trim()) { toast.error('Phone number is required'); return false; }
    if (!/^\d{10}$/.test(form.phone.trim())) { toast.error('Phone number must be exactly 10 digits'); return false; }
    if (!form.role) { toast.error('Please select a role'); return false; }
    if (form.password.length < 8) { toast.error('Password must be at least 8 characters'); return false; }
    if (!/[0-9]/.test(form.password)) { toast.error('Password must contain a number'); return false; }
    if (form.password !== form.confirm_password) { toast.error('Passwords do not match'); return false; }
    return true;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);

    // Create auth user
    const { data: authData, error: authErr } = await supabase.auth.signUp({
      email: form.email.trim().toLowerCase(),
      password: form.password,
    });

    if (authErr) {
      toast.error(authErr.message);
      setLoading(false);
      return;
    }

    const userId = authData.user?.id;
    if (!userId) {
      toast.error('Registration failed. Please try again.');
      setLoading(false);
      return;
    }

    // Every registered user (Student or Faculty) gets an identical account record.
    // `role` stays 'student' for everyone so access control/routing is unaffected;
    // the selected Student/Faculty label is kept in `account_type` for reporting only.
    const { error: stuErr } = await supabase.from('students').insert({
      user_id: userId,
      student_code: userId,
      full_name: form.full_name.trim(),
      email: form.email.trim().toLowerCase(),
      phone: form.phone.trim(),
      account_type: form.role,
      role: 'student',
    });

    if (stuErr) {
      setLoading(false);
      toast.error('Failed to create account: ' + stuErr.message);
      return;
    }

    await refreshProfile(userId);

    setLoading(false);
    toast.success('Registration successful! Welcome to Campus Corner.');
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        {/* Card */}
        <div className="card">
          {/* Logo */}
          <div className="text-center mb-6">
            <div className="flex justify-center mb-3">
              <Logo wordmark={false} size={56} />
            </div>
            <h1 className="text-2xl font-bold text-slate-900">Create Account</h1>
            <p className="text-gray-500 text-sm mt-1">Register for Campus Corner</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Full Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Full Name <span className="text-red-500">*</span></label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={form.full_name}
                  onChange={e => update('full_name', e.target.value)}
                  placeholder="Enter your full name"
                  className="input-field pl-10"
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Email Address <span className="text-red-500">*</span></label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="email"
                  value={form.email}
                  onChange={e => update('email', e.target.value)}
                  placeholder="your@email.com"
                  className="input-field pl-10"
                />
              </div>
            </div>

            {/* Phone */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Phone Number <span className="text-red-500">*</span></label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="tel"
                  value={form.phone}
                  onChange={e => update('phone', e.target.value.replace(/\D/g, '').slice(0, 10))}
                  placeholder="10-digit phone number"
                  className="input-field pl-10"
                />
              </div>
            </div>

            {/* Role */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Role <span className="text-red-500">*</span></label>
              <div className="relative">
                <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <select
                  value={form.role}
                  onChange={e => update('role', e.target.value)}
                  className="input-field pl-10 appearance-none"
                >
                  <option value="">Select your role</option>
                  <option value="Student">Student</option>
                  <option value="Faculty">Faculty</option>
                </select>
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Password <span className="text-red-500">*</span></label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type={showPw ? 'text' : 'password'}
                  value={form.password}
                  onChange={e => update('password', e.target.value)}
                  placeholder="Create a strong password"
                  className="input-field pl-10 pr-10"
                />
                <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {/* Password strength */}
              {form.password && (
                <div className="mt-2 space-y-1">
                  {pwChecks.slice(0, 2).map(c => (
                    <div key={c.label} className="flex items-center gap-1.5">
                      {c.ok
                        ? <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />
                        : <XCircle className="w-3.5 h-3.5 text-gray-300" />}
                      <span className={`text-xs ${c.ok ? 'text-green-600' : 'text-gray-400'}`}>{c.label}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Confirm Password <span className="text-red-500">*</span></label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type={showConfirm ? 'text' : 'password'}
                  value={form.confirm_password}
                  onChange={e => update('confirm_password', e.target.value)}
                  placeholder="Re-enter your password"
                  className="input-field pl-10 pr-10"
                />
                <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                  {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {form.confirm_password && (
                <div className="flex items-center gap-1.5 mt-1.5">
                  {pwChecks[2].ok
                    ? <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />
                    : <XCircle className="w-3.5 h-3.5 text-gray-300" />}
                  <span className={`text-xs ${pwChecks[2].ok ? 'text-green-600' : 'text-gray-400'}`}>{pwChecks[2].label}</span>
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary py-3 text-base font-semibold mt-2 flex items-center justify-center gap-2"
            >
              {loading
                ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Registering...</>
                : 'Create Account'}
            </button>
          </form>

          {/* Login link */}
          <p className="text-center text-sm text-gray-500 mt-5">
            Already have an account?{' '}
            <Link to="/login" className="text-red-600 font-semibold hover:underline">Sign In</Link>
          </p>
        </div>

        <p className="text-center text-xs text-gray-400 mt-4">
          Campus Corner v1.0 — Hostel Meal Management System
        </p>
      </div>
    </div>
  );
}
