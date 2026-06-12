import { useEffect, useState } from 'react';
import { Users, CreditCard, TrendingUp, UtensilsCrossed, UserCheck, IndianRupee } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

interface Stats {
  totalStudents: number;
  activeSubscriptions: number;
  expiredSubscriptions: number;
  todayMeals: number;
  totalRevenue: number;
  totalStaff: number;
}

interface MealChartData {
  name: string;
  count: number;
  color: string;
}

const COLORS = ['#EF4444', '#F97316', '#EAB308'];

export default function AdminDashboard() {
  const { profile } = useAuth();
  const [stats, setStats] = useState<Stats>({ totalStudents: 0, activeSubscriptions: 0, expiredSubscriptions: 0, todayMeals: 0, totalRevenue: 0, totalStaff: 0 });
  const [mealData, setMealData] = useState<MealChartData[]>([]);
  const [revenueData, setRevenueData] = useState<{ month: string; revenue: number }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    const today = new Date().toISOString().split('T')[0];
    const thisYear = new Date().getFullYear();

    const [studRes, subRes, mealRes, staffRes, payRes] = await Promise.all([
      supabase.from('students').select('id', { count: 'exact', head: true }).eq('role', 'student'),
      supabase.from('subscriptions').select('status'),
      supabase.from('meal_logs').select('meal_session').eq('meal_date', today),
      supabase.from('staff').select('id', { count: 'exact', head: true }),
      supabase.from('payments').select('amount, paid_at').eq('payment_status', 'paid'),
    ]);

    const subs = subRes.data ?? [];
    const meals = mealRes.data ?? [];
    const payments = payRes.data ?? [];

    const activeCount = subs.filter(s => s.status === 'active').length;
    const expiredCount = subs.filter(s => s.status !== 'active').length;
    const totalRevenue = payments.reduce((sum, p) => sum + (p.amount || 0), 0);

    setStats({
      totalStudents: studRes.count ?? 0,
      activeSubscriptions: activeCount,
      expiredSubscriptions: expiredCount,
      todayMeals: meals.length,
      totalRevenue,
      totalStaff: staffRes.count ?? 0,
    });

    // Meal analytics
    const breakfastCount = meals.filter(m => m.meal_session === 'breakfast').length;
    const lunchCount = meals.filter(m => m.meal_session === 'lunch').length;
    const dinnerCount = meals.filter(m => m.meal_session === 'dinner').length;
    setMealData([
      { name: 'Breakfast', count: breakfastCount, color: '#EF4444' },
      { name: 'Lunch', count: lunchCount, color: '#F97316' },
      { name: 'Dinner', count: dinnerCount, color: '#EAB308' },
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

    setLoading(false);
  }

  const kpiCards = [
    { label: 'Total Students', value: stats.totalStudents, icon: Users, color: 'bg-blue-500', bgLight: 'bg-blue-50', textColor: 'text-blue-600' },
    { label: 'Active Subscriptions', value: stats.activeSubscriptions, icon: CreditCard, color: 'bg-green-500', bgLight: 'bg-green-50', textColor: 'text-green-600' },
    { label: 'Expired Subscriptions', value: stats.expiredSubscriptions, icon: TrendingUp, color: 'bg-red-500', bgLight: 'bg-red-50', textColor: 'text-red-600' },
    { label: "Today's Meals", value: stats.todayMeals, icon: UtensilsCrossed, color: 'bg-orange-500', bgLight: 'bg-orange-50', textColor: 'text-orange-600' },
    { label: 'Total Revenue', value: `₹${stats.totalRevenue.toLocaleString()}`, icon: IndianRupee, color: 'bg-emerald-500', bgLight: 'bg-emerald-50', textColor: 'text-emerald-600' },
    { label: 'Total Staff', value: stats.totalStaff, icon: UserCheck, color: 'bg-purple-500', bgLight: 'bg-purple-50', textColor: 'text-purple-600' },
  ];

  if (loading) return (
    <div className="space-y-6 animate-pulse">
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {[...Array(6)].map((_, i) => <div key={i} className="h-28 bg-gray-200 rounded-xl" />)}
      </div>
      <div className="h-64 bg-gray-200 rounded-xl" />
    </div>
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 text-sm mt-1">Hello, {profile?.full_name} — here's what's happening today.</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {kpiCards.map(card => (
          <div key={card.label} className="card hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-gray-500 text-xs font-medium">{card.label}</p>
                <p className="text-2xl font-bold text-gray-900 mt-2">{card.value}</p>
              </div>
              <div className={`w-10 h-10 ${card.bgLight} rounded-xl flex items-center justify-center`}>
                <card.icon className={`w-5 h-5 ${card.textColor}`} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Chart */}
        <div className="card">
          <h2 className="font-bold text-gray-900 mb-4">Monthly Revenue</h2>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={revenueData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `₹${(v/1000).toFixed(0)}k`} />
              <Tooltip formatter={(v: any) => [`₹${v?.toLocaleString()}`, 'Revenue']} />
              <Bar dataKey="revenue" fill="#EF4444" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Meal Analytics */}
        <div className="card">
          <h2 className="font-bold text-gray-900 mb-4">Today's Meal Distribution</h2>
          {stats.todayMeals === 0 ? (
            <div className="flex items-center justify-center h-48 text-gray-400">
              <div className="text-center">
                <UtensilsCrossed className="w-10 h-10 mx-auto mb-2 opacity-30" />
                <p className="text-sm">No meals served today</p>
              </div>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={mealData} dataKey="count" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, value }) => `${name}: ${value}`}>
                  {mealData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Legend />
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Subscription Analytics */}
        <div className="card">
          <h2 className="font-bold text-gray-900 mb-4">Subscription Status</h2>
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
                <Cell fill="#22c55e" />
                <Cell fill="#EF4444" />
              </Pie>
              <Legend />
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Quick Actions */}
        <div className="card">
          <h2 className="font-bold text-gray-900 mb-4">Quick Stats</h2>
          <div className="space-y-3">
            {[
              { label: 'Active Subscriptions', value: stats.activeSubscriptions, total: stats.activeSubscriptions + stats.expiredSubscriptions, color: 'bg-green-500' },
              { label: "Today's Breakfast", value: mealData.find(m => m.name === 'Breakfast')?.count ?? 0, total: stats.todayMeals || 1, color: 'bg-red-500' },
              { label: "Today's Lunch", value: mealData.find(m => m.name === 'Lunch')?.count ?? 0, total: stats.todayMeals || 1, color: 'bg-orange-500' },
              { label: "Today's Dinner", value: mealData.find(m => m.name === 'Dinner')?.count ?? 0, total: stats.todayMeals || 1, color: 'bg-yellow-500' },
            ].map(item => (
              <div key={item.label}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-600">{item.label}</span>
                  <span className="font-semibold text-gray-900">{item.value}</span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${item.color} rounded-full transition-all`}
                    style={{ width: `${item.total > 0 ? Math.round((item.value / item.total) * 100) : 0}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
