import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, ChefHat, Mail, Lock, User, Phone, Hash, Home, BookOpen, CheckCircle2, XCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'sonner';

interface FormData {
  full_name: string;
  email: string;
  password: string;
  confirm_password: string;
  phone: string;
  student_code: string;
  college_id: string;
  room_number: string;
  hostel_block: string;
}

const INITIAL: FormData = {
  full_name: '',
  email: '',
  password: '',
  confirm_password: '',
  phone: '',
  student_code: '',
  college_id: '',
  room_number: '',
  hostel_block: '',
};

export default function Register() {
  const [form, setForm] = useState<FormData>(INITIAL);
  const [showPw, setShowPw] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<1 | 2>(1);
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

  function validateStep1() {
    if (!form.full_name.trim()) { toast.error('Full name is required'); return false; }
    if (!form.email.trim() || !/\S+@\S+\.\S+/.test(form.email)) { toast.error('Valid email is required'); return false; }
    if (form.password.length < 8) { toast.error('Password must be at least 8 characters'); return false; }
    if (form.password !== form.confirm_password) { toast.error('Passwords do not match'); return false; }
    return true;
  }

  function validateStep2() {
    if (!form.student_code.trim()) { toast.error('Student code is required'); return false; }
    return true;
  }

  function handleNext() {
    if (validateStep1()) setStep(2);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validateStep2()) return;

    setLoading(true);

    // Check if student code already exists
    const { data: existingCode } = await supabase
      .from('students')
      .select('id')
      .eq('student_code', form.student_code.toUpperCase())
      .maybeSingle();

    if (existingCode) {
      toast.error('Student code already registered');
      setLoading(false);
      return;
    }

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

    // Create student record
    const { error: stuErr } = await supabase.from('students').insert({
      user_id: userId,
      student_code: form.student_code.trim().toUpperCase(),
      full_name: form.full_name.trim(),
      email: form.email.trim().toLowerCase(),
      phone: form.phone.trim() || null,
      college_id: form.college_id.trim() || null,
      room_number: form.room_number.trim() || null,
      hostel_block: form.hostel_block.trim() || null,
      role: 'student',
      profile_completed: true,
    });

    if (stuErr) {
      setLoading(false);
      // Clean up auth user if student insert fails
      toast.error('Failed to create student profile: ' + stuErr.message);
      return;
    }

    await refreshProfile(userId);
    
    setLoading(false);
    toast.success('Registration successful! Welcome to HostelPro.');
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-orange-50 flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        {/* Card */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
          {/* Logo */}
          <div className="text-center mb-6">
            <div className="w-14 h-14 bg-red-600 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-lg shadow-red-200">
              <ChefHat className="w-7 h-7 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Create Account</h1>
            <p className="text-gray-500 text-sm mt-1">Register as a hostel student</p>
          </div>

          {/* Step Indicator */}
          <div className="flex items-center gap-3 mb-6">
            <div className={`flex items-center gap-2 flex-1 ${step === 1 ? 'text-red-600' : 'text-green-600'}`}>
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${step === 1 ? 'bg-red-600 text-white' : 'bg-green-600 text-white'}`}>
                {step > 1 ? <CheckCircle2 className="w-4 h-4" /> : '1'}
              </div>
              <span className="text-sm font-medium hidden sm:inline">Account</span>
            </div>
            <div className={`h-px flex-1 ${step >= 2 ? 'bg-red-400' : 'bg-gray-200'}`} />
            <div className={`flex items-center gap-2 flex-1 justify-end ${step === 2 ? 'text-red-600' : 'text-gray-400'}`}>
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${step === 2 ? 'bg-red-600 text-white' : 'bg-gray-200 text-gray-500'}`}>
                2
              </div>
              <span className="text-sm font-medium hidden sm:inline">Student Info</span>
            </div>
          </div>

          {/* Step 1: Account Details */}
          {step === 1 && (
            <div className="space-y-4">
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
                type="button"
                onClick={handleNext}
                className="w-full btn-primary py-3 text-base font-semibold mt-2"
              >
                Continue &rarr;
              </button>
            </div>
          )}

          {/* Step 2: Student Info */}
          {step === 2 && (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Student Code */}
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Student Code <span className="text-red-500">*</span></label>
                  <div className="relative">
                    <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      value={form.student_code}
                      onChange={e => update('student_code', e.target.value)}
                      placeholder="e.g., STU2024001"
                      className="input-field pl-10 uppercase"
                    />
                  </div>
                  <p className="text-xs text-gray-400 mt-1">Your unique student/roll number provided by hostel admin</p>
                </div>

                {/* Phone */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Phone Number</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="tel"
                      value={form.phone}
                      onChange={e => update('phone', e.target.value)}
                      placeholder="+91 98765 43210"
                      className="input-field pl-10"
                    />
                  </div>
                </div>

                {/* College ID */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">College ID</label>
                  <div className="relative">
                    <BookOpen className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      value={form.college_id}
                      onChange={e => update('college_id', e.target.value)}
                      placeholder="e.g., CS2024001"
                      className="input-field pl-10"
                    />
                  </div>
                </div>

                {/* Room Number */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Room Number</label>
                  <div className="relative">
                    <Home className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      value={form.room_number}
                      onChange={e => update('room_number', e.target.value)}
                      placeholder="e.g., 101"
                      className="input-field pl-10"
                    />
                  </div>
                </div>

                {/* Hostel Block */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Hostel Block</label>
                  <div className="relative">
                    <Home className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      value={form.hostel_block}
                      onChange={e => update('hostel_block', e.target.value)}
                      placeholder="e.g., Block A"
                      className="input-field pl-10"
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-3 mt-2">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="btn-secondary flex-1 py-3"
                >
                  &larr; Back
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="btn-primary flex-1 py-3 font-semibold flex items-center justify-center gap-2"
                >
                  {loading
                    ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Registering...</>
                    : 'Create Account'}
                </button>
              </div>
            </form>
          )}

          {/* Login link */}
          <p className="text-center text-sm text-gray-500 mt-5">
            Already have an account?{' '}
            <Link to="/login" className="text-red-600 font-semibold hover:underline">Sign In</Link>
          </p>
        </div>

        <p className="text-center text-xs text-gray-400 mt-4">
          HostelPro v1.0 — Hostel Meal Management System
        </p>
      </div>
    </div>
  );
}
