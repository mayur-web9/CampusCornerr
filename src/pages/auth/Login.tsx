import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Eye, EyeOff, ChefHat, Mail, Lock } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'sonner';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { signIn, role } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email || !password) {
      toast.error('Please fill in all fields');
      return;
    }
    setLoading(true);
    const { error } = await signIn(email, password);
    setLoading(false);

    if (error) {
      toast.error(error.message || 'Invalid credentials');
      return;
    }

    toast.success('Welcome back!');
  }

  useEffect(() => {
    if (role === 'admin') {
      navigate('/admin/dashboard', { replace: true });
    } else if (role === 'staff') {
      navigate('/staff/scanner', { replace: true });
    } else if (role === 'student') {
      navigate('/student/dashboard', { replace: true });
    }
  }, [role, navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-orange-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Card */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
          {/* Logo */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-red-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-red-200">
              <ChefHat className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">HostelPro</h1>
            <p className="text-red-600 font-medium text-sm mt-1">Mess Management System</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  className="input-field pl-10"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="input-field pl-10 pr-12"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary py-3 text-base font-semibold flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Signing in...
                </>
              ) : 'Sign In'}
            </button>
          </form>

          <div className="mt-6 text-center space-y-2">
            <p className="text-sm text-gray-500">
              New student?{' '}
              <Link to="/register" className="text-red-600 font-semibold hover:underline">
                Create an account
              </Link>
            </p>
            <p className="text-xs text-gray-400">
              Staff & Admin — contact hostel management for access
            </p>
          </div>
        </div>

        <p className="text-center text-xs text-gray-400 mt-4">
          HostelPro v1.0 &mdash; Hostel Meal Management System
        </p>
      </div>
    </div>
  );
}
