import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  Eye,
  EyeOff,
  Mail,
  Lock,
  ArrowRight,
  QrCode,
  CreditCard,
  Bell,
  ShieldCheck,
  UtensilsCrossed,
  Users,
  BarChart3,
} from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { toast } from "sonner";
import Logo from "../../components/ui/Logo";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const { signIn, role } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!email || !password) {
      toast.error("Please fill in all fields");
      return;
    }

    setLoading(true);

    const { error } = await signIn(email, password);

    setLoading(false);

    if (error) {
      toast.error(error.message || "Invalid credentials");
      return;
    }

    toast.success("Welcome back!");
  }

  useEffect(() => {
    if (role === "admin") {
      navigate("/admin/dashboard", { replace: true });
    } else if (role === "staff") {
      navigate("/staff/scanner", { replace: true });
    } else if (role === "student") {
      navigate("/student/dashboard", { replace: true });
    }
  }, [role, navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-red-50">

      <div className="grid min-h-screen lg:grid-cols-2">

        {/* ==========================
            LEFT INFORMATION PANEL
        ========================== */}

        <div className="hidden lg:flex flex-col justify-between px-16 py-14">

          <div>

            <Logo wordmark size={72} />

            <div className="mt-14 max-w-xl">

              <h1 className="text-5xl font-extrabold text-slate-900 leading-tight">
                Smart Hostel
                <span className="block text-red-600">
                  Meal Management
                </span>
              </h1>

              <p className="mt-6 text-lg leading-8 text-slate-600">
                Campus Corner is an all-in-one hostel dining platform
                helping students, staff and administrators manage meal
                subscriptions, QR access, payments, announcements,
                support tickets and daily hostel operations effortlessly.
              </p>

            </div>

            <div className="grid grid-cols-2 gap-5 mt-12">

              <div className="rounded-2xl bg-white border border-slate-200 p-5 shadow-sm hover:shadow-lg transition">

                <QrCode className="w-8 h-8 text-red-600 mb-3" />

                <h3 className="font-semibold text-slate-900">
                  QR Meal Access
                </h3>

                <p className="text-sm text-slate-500 mt-2">
                  Fast and secure QR-based meal verification.
                </p>

              </div>

              <div className="rounded-2xl bg-white border border-slate-200 p-5 shadow-sm hover:shadow-lg transition">

                <CreditCard className="w-8 h-8 text-red-600 mb-3" />

                <h3 className="font-semibold text-slate-900">
                  Secure Payments
                </h3>

                <p className="text-sm text-slate-500 mt-2">
                  Subscription payments powered by Razorpay.
                </p>

              </div>

              <div className="rounded-2xl bg-white border border-slate-200 p-5 shadow-sm hover:shadow-lg transition">

                <Bell className="w-8 h-8 text-red-600 mb-3" />

                <h3 className="font-semibold text-slate-900">
                  Announcements
                </h3>

                <p className="text-sm text-slate-500 mt-2">
                  Stay updated with important hostel notifications.
                </p>

              </div>

              <div className="rounded-2xl bg-white border border-slate-200 p-5 shadow-sm hover:shadow-lg transition">

                <UtensilsCrossed className="w-8 h-8 text-red-600 mb-3" />

                <h3 className="font-semibold text-slate-900">
                  Meal Scheduling
                </h3>

                <p className="text-sm text-slate-500 mt-2">
                  Manage breakfast, lunch and dinner efficiently.
                </p>

              </div>

            </div>

          </div>

          <div>

            <div className="grid grid-cols-4 gap-6">

              <div>

                <Users className="w-6 h-6 text-red-600 mb-2" />

                <h2 className="text-3xl font-bold text-slate-900">
                  500+
                </h2>

                <p className="text-sm text-slate-500">
                  Students
                </p>

              </div>

              <div>

                <UtensilsCrossed className="w-6 h-6 text-red-600 mb-2" />

                <h2 className="text-3xl font-bold text-slate-900">
                  1000+
                </h2>

                <p className="text-sm text-slate-500">
                  Meals Served
                </p>

              </div>

              <div>

                <BarChart3 className="w-6 h-6 text-red-600 mb-2" />

                <h2 className="text-3xl font-bold text-slate-900">
                  99.9%
                </h2>

                <p className="text-sm text-slate-500">
                  Uptime
                </p>

              </div>

              <div>

                <ShieldCheck className="w-6 h-6 text-green-600 mb-2" />

                <h2 className="text-3xl font-bold text-slate-900">
                  Secure
                </h2>

                <p className="text-sm text-slate-500">
                  Authentication
                </p>

              </div>

            </div>

            <div className="mt-10 flex items-center gap-3 text-slate-500">

              <ShieldCheck className="w-5 h-5 text-green-600" />

              Role-based access • Encrypted authentication • Modern SaaS Platform

            </div>

          </div>

        </div>

        {/* ==========================
            RIGHT LOGIN PANEL
        ========================== */}

        <div className="flex items-center justify-center px-6 py-12">

          <div className="w-full max-w-md">

            <div className="rounded-3xl bg-white border border-slate-200 shadow-2xl p-8">

              <div className="text-center mb-8">

                <div className="flex justify-center mb-4">
                  <Logo wordmark={false} size={70} />
                </div>

                <h2 className="text-3xl font-bold text-slate-900">
                  Welcome Back
                </h2>

                <p className="mt-2 text-slate-500">
                  Sign in to access your Campus Corner dashboard
                </p>

              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                                <div>

                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Email Address
                  </label>

                  <div className="relative">

                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />

                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Enter your email"
                      required
                      className="input-field pl-11"
                    />

                  </div>

                </div>

                <div>

                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Password
                  </label>

                  <div className="relative">

                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />

                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter your password"
                      required
                      className="input-field pl-11 pr-11"
                    />

                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-red-600 transition"
                    >
                      {showPassword ? (
                        <EyeOff className="w-5 h-5" />
                      ) : (
                        <Eye className="w-5 h-5" />
                      )}
                    </button>

                  </div>

                </div>

                <div className="flex items-center justify-between text-sm">

                  <label className="flex items-center gap-2 text-slate-600">

                    <input
                      type="checkbox"
                      className="rounded border-slate-300 text-red-600 focus:ring-red-500"
                    />

                    Remember me

                  </label>

                  {/* Forgot Password? — temporarily hidden from UI, not wired to any logic.
                  <button
                    type="button"
                    className="font-semibold text-red-600 hover:text-red-700"
                  >
                    Forgot Password?
                  </button>
                  */}

                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="btn-primary w-full py-3 flex items-center justify-center gap-2 group"
                >
                  {loading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Signing In...
                    </>
                  ) : (
                    <>
                      Sign In
                      <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                    </>
                  )}
                </button>

              </form>

              <div className="mt-8 text-center">

                <p className="text-slate-600">

                  New Student?{" "}

                  <Link
                    to="/register"
                    className="font-semibold text-red-600 hover:text-red-700"
                  >
                    Create an account
                  </Link>

                </p>

                <p className="text-xs text-slate-400 mt-3">
                  Staff & Admin accounts are provided by your hostel management.
                </p>

              </div>

            </div>

            {/* Mobile Features */}

            <div className="lg:hidden mt-10 space-y-4">

              <div className="rounded-2xl bg-white border border-slate-200 p-5 shadow-sm flex items-start gap-4">

                <QrCode className="w-7 h-7 text-red-600 mt-1" />

                <div>

                  <h3 className="font-semibold text-slate-900">
                    QR Meal Access
                  </h3>

                  <p className="text-sm text-slate-500 mt-1">
                    Fast meal verification using secure QR codes.
                  </p>

                </div>

              </div>

              <div className="rounded-2xl bg-white border border-slate-200 p-5 shadow-sm flex items-start gap-4">

                <CreditCard className="w-7 h-7 text-red-600 mt-1" />

                <div>

                  <h3 className="font-semibold text-slate-900">
                    Online Payments
                  </h3>

                  <p className="text-sm text-slate-500 mt-1">
                    Secure subscription payments powered by Razorpay.
                  </p>

                </div>

              </div>

              <div className="rounded-2xl bg-white border border-slate-200 p-5 shadow-sm flex items-start gap-4">

                <Bell className="w-7 h-7 text-red-600 mt-1" />

                <div>

                  <h3 className="font-semibold text-slate-900">
                    Announcements
                  </h3>

                  <p className="text-sm text-slate-500 mt-1">
                    Stay updated with important hostel notices.
                  </p>

                </div>

              </div>

            </div>

            <p className="text-center text-xs text-slate-400 mt-8">
              © 2026 Campus Corner — Hostel Meal Management Platform
            </p>

          </div>

        </div>

      </div>

    </div>
  );
}