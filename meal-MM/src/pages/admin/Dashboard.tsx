import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  CreditCard,
  TrendingUp,
  UtensilsCrossed,
  UserCheck,
  IndianRupee,
  TicketPercent,
  UserPlus,
  Megaphone,
  Receipt,
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import PageHeader from '../../components/ui/PageHeader';
import StatCard from '../../components/ui/StatCard';
import ChartCard from '../../components/ui/ChartCard';
import SectionCard from '../../components/ui/SectionCard';
import EmptyState from '../../components/ui/EmptyState';

interface Stats {
  totalStudents: number;
  activeSubscriptions: number;
  expiredSubscriptions: number;
  todayMeals: number;
  totalRevenue: number;
  totalStaff: number;
  activeCoupons: number;
}

interface MealChartData {
  name: string;
  count: number;
}

interface RecentPayment {
  id: string;
  amount: number;
  paid_at: string;
  studentName: string;
}

interface RecentStudent {
  id: string;
  full_name: string;
  student_code: string;
  created_at: string;
}

const COLORS = ['#DC2626', '#F97316', '#EAB308'];

export default function AdminDashboard() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState<Stats>({
    totalStudents: 0,
    activeSubscriptions: 0,
    expiredSubscriptions: 0,
    todayMeals: 0,
    totalRevenue: 0,
    totalStaff: 0,
    activeCoupons: 0,
  });
  const [mealData, setMealData] = useState<MealChartData[]>([]);
  const [revenueData, setRevenueData] = useState<{ month: string; revenue: number }[]>([]);
  const [recentPayments, setRecentPayments] = useState<RecentPayment[]>([]);
  const [recentStudents, setRecentStudents] = useState<RecentStudent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    const today = new Date().toISOString().split('T')[0];
    const thisYear = new Date().getFullYear();

    const [studRes, subRes, mealRes, staffRes, payRes, couponRes, recentPayRes, recentStudRes] = await Promise.all([
      supabase.from('students').select('id', { count: 'exact', head: true }).eq('role', 'student'),
      supabase.from('subscriptions').select('status'),
      supabase.from('meal_logs').select('meal_session').eq('meal_date', today),
      supabase.from('staff').select('id', { count: 'exact', head: true }),
      supabase.from('payments').select('amount, paid_at').eq('payment_status', 'paid'),
      supabase.from('coupons').select('active, valid_until'),
      supabase.from('payments').select('id, amount, paid_at, student:students(full_name)').order('paid_at', { ascending: false }).limit(5),
      supabase.from('students').select('id, full_name, student_code, created_at').eq('role', 'student').order('created_at', { ascending: false }).limit(5),
    ]);

    const subs = subRes.data ?? [];
    const meals = mealRes.data ?? [];
    const payments = payRes.data ?? [];
    const coupons = couponRes.data ?? [];

    const activeCount = subs.filter(s => s.status === 'active').length;
    const expiredCount = subs.filter(s => s.status !== 'active').length;
    const totalRevenue = payments.reduce((sum, p) => sum + (p.amount || 0), 0);
    const activeCoupons = coupons.filter(c => c.active && new Date(c.valid_until) >= new Date(today)).length;

    setStats({
      totalStudents: studRes.count ?? 0,
      activeSubscriptions: activeCount,
      expiredSubscriptions: expiredCount,
      todayMeals: meals.length,
      totalRevenue,
      totalStaff: staffRes.count ?? 0,
      activeCoupons,
    });

    // Meal analytics
    const breakfastCount = meals.filter(m => m.meal_session === 'breakfast').length;
    const lunchCount = meals.filter(m => m.meal_session === 'lunch').length;
    const dinnerCount = meals.filter(m => m.meal_session === 'dinner').length;
    setMealData([
      { name: 'Breakfast', count: breakfastCount },
      { name: 'Lunch', count: lunchCount },
      { name: 'Dinner', count: dinnerCount },
    ]);

    // Monthly revenue for current year
    const monthlyRevenue: Record<string, number> = {};
    for (let m = 0; m < 12; m++) {
      const key = new Date(thisYear, m, 1).toLocaleString('default', { month: 'short' });
      monthlyRevenue[key] = 0;
    }
    payments.forEach(p => {
      const d = new Date(p.paid_at);
      if (d.getFullYear() === thisYear) {
        const key = d.toLocaleString('default', { month: 'short' });
        monthlyRevenue[key] = (monthlyRevenue[key] || 0) + p.amount;
      }
    });
    setRevenueData(Object.entries(monthlyRevenue).map(([month, revenue]) => ({ month, revenue })));

    setRecentPayments(
      (recentPayRes.data ?? []).map((p: any) => ({
        id: p.id,
        amount: p.amount,
        paid_at: p.paid_at,
        studentName: p.student?.full_name ?? 'Unknown',
      }))
    );
    setRecentStudents((recentStudRes.data ?? []) as RecentStudent[]);

    setLoading(false);
  }

  const kpiCards = [
    { label: 'Total Students', value: stats.totalStudents, icon: Users, iconBg: 'bg-blue-50', iconColor: 'text-blue-600' },
    { label: 'Active Subscriptions', value: stats.activeSubscriptions, icon: CreditCard, iconBg: 'bg-green-50', iconColor: 'text-green-600' },
    { label: 'Expired Subscriptions', value: stats.expiredSubscriptions, icon: TrendingUp, iconBg: 'bg-red-50', iconColor: 'text-red-600' },
    { label: "Today's Meals", value: stats.todayMeals, icon: UtensilsCrossed, iconBg: 'bg-orange-50', iconColor: 'text-orange-600' },
    { label: 'Total Revenue', value: `₹${stats.totalRevenue.toLocaleString()}`, icon: IndianRupee, iconBg: 'bg-emerald-50', iconColor: 'text-emerald-600' },
    { label: 'Total Staff', value: stats.totalStaff, icon: UserCheck, iconBg: 'bg-purple-50', iconColor: 'text-purple-600' },
    { label: 'Active Coupons', value: stats.activeCoupons, icon: TicketPercent, iconBg: 'bg-pink-50', iconColor: 'text-pink-600' },
  ];

  const quickActions = [
    { label: 'Add Student', icon: UserPlus, to: '/admin/students' },
    { label: 'Create Coupon', icon: TicketPercent, to: '/admin/coupons' },
    { label: 'New Announcement', icon: Megaphone, to: '/admin/announcements' },
    { label: 'View Payments', icon: Receipt, to: '/admin/payments' },
  ];

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {[...Array(7)].map((_, i) => (
            <div key={i} className="h-28 bg-gray-200 rounded-2xl" />
          ))}
        </div>
        <div className="h-64 bg-gray-200 rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Dashboard" subtitle={`Hello, ${profile?.full_name ?? 'Admin'} — here's what's happening today.`} />

      {/* Statistics */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {kpiCards.map(card => (
          <StatCard key={card.label} label={card.label} value={card.value} icon={card.icon} iconBg={card.iconBg} iconColor={card.iconColor} />
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard title="Monthly Revenue" subtitle="Revenue collected this year">
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={revenueData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `₹${(v / 1000).toFixed(0)}k`} />
              <Tooltip formatter={(v: any) => [`₹${v?.toLocaleString()}`, 'Revenue']} />
              <Bar dataKey="revenue" fill="#DC2626" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Today's Meal Summary" subtitle={`${stats.todayMeals} meals served today`}>
          {stats.todayMeals === 0 ? (
            <EmptyState icon={UtensilsCrossed} title="No meals served today" className="py-10" />
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={mealData} dataKey="count" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, value }) => `${name}: ${value}`}>
                  {mealData.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Legend />
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        <ChartCard title="Subscription Status">
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie
                data={[
                  { name: 'Active', value: stats.activeSubscriptions },
                  { name: 'Expired', value: stats.expiredSubscriptions },
                ]}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={80}
                label={({ name, value }) => `${name}: ${value}`}
              >
                <Cell fill="#22C55E" />
                <Cell fill="#DC2626" />
              </Pie>
              <Legend />
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        <SectionCard title="Quick Actions" subtitle="Jump straight into common tasks">
          <div className="grid grid-cols-2 gap-3">
            {quickActions.map(action => (
              <button
                key={action.label}
                onClick={() => navigate(action.to)}
                className="flex items-center gap-3 p-4 rounded-xl border border-gray-100 hover:border-red-200 hover:bg-red-50/50 transition-all duration-200 text-left"
              >
                <div className="w-9 h-9 bg-red-50 rounded-xl flex items-center justify-center flex-shrink-0">
                  <action.icon className="w-4 h-4 text-red-600" aria-hidden="true" />
                </div>
                <span className="text-sm font-medium text-slate-700">{action.label}</span>
              </button>
            ))}
          </div>
        </SectionCard>
      </div>

      {/* Recent activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SectionCard title="Recent Payments" subtitle="Latest successful transactions" padded={false}>
          {recentPayments.length === 0 ? (
            <EmptyState icon={Receipt} title="No payments yet" className="py-10" />
          ) : (
            <div className="divide-y divide-gray-50">
              {recentPayments.map(p => (
                <div key={p.id} className="flex items-center justify-between px-6 py-3.5">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 avatar-gradient rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-white font-bold text-xs">{p.studentName.charAt(0)}</span>
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-slate-900 truncate">{p.studentName}</p>
                      <p className="text-xs text-gray-400">{new Date(p.paid_at).toLocaleDateString('en-IN')}</p>
                    </div>
                  </div>
                  <span className="text-sm font-bold text-green-600 flex-shrink-0">₹{p.amount.toLocaleString()}</span>
                </div>
              ))}
            </div>
          )}
        </SectionCard>

        <SectionCard title="Recent Registrations" subtitle="Newest students to join" padded={false}>
          {recentStudents.length === 0 ? (
            <EmptyState icon={UserPlus} title="No students yet" className="py-10" />
          ) : (
            <div className="divide-y divide-gray-50">
              {recentStudents.map(s => (
                <div key={s.id} className="flex items-center justify-between px-6 py-3.5">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 bg-blue-50 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-blue-600 font-bold text-xs">{s.full_name.charAt(0)}</span>
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-slate-900 truncate">{s.full_name}</p>
                      <p className="text-xs text-gray-400 font-mono">{s.student_code}</p>
                    </div>
                  </div>
                  <span className="text-xs text-gray-400 flex-shrink-0">{new Date(s.created_at).toLocaleDateString('en-IN')}</span>
                </div>
              ))}
            </div>
          )}
        </SectionCard>
      </div>
    </div>
  );
}
