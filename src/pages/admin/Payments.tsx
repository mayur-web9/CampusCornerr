import { useEffect, useState } from 'react';
import { Search, IndianRupee, TrendingUp, CheckCircle, Clock } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { Payment } from '../../lib/types';

export default function AdminPayments() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'paid' | 'pending' | 'failed'>('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => { load(); }, []);

  async function load() {
    const { data } = await supabase
      .from('payments')
      .select('*, student:students(full_name, room_number, student_code), subscription:subscriptions(start_date, end_date, plan:meal_plans(plan_name))')
      .order('paid_at', { ascending: false });
    setPayments(data ?? []);
    setLoading(false);
  }

  const filtered = payments.filter(p => {
    const student = p.student as any;
    const matchesSearch = !search ||
      student?.full_name?.toLowerCase().includes(search.toLowerCase()) ||
      student?.student_code?.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = filter === 'all' || p.payment_status === filter;
    return matchesSearch && matchesFilter;
  });

  const totalRevenue = payments.filter(p => p.payment_status === 'paid').reduce((sum, p) => sum + p.amount, 0);
  const pendingCount = payments.filter(p => p.payment_status === 'pending').length;
  const paidCount = payments.filter(p => p.payment_status === 'paid').length;

  const statusColors: Record<string, string> = {
    paid: 'bg-green-100 text-green-700',
    pending: 'bg-yellow-100 text-yellow-700',
    failed: 'bg-red-100 text-red-700',
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Payments & Billing</h1>
        <p className="text-gray-500 text-sm mt-1">Track all payment transactions</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center">
              <IndianRupee className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-gray-500 text-xs">Total Revenue</p>
              <p className="text-xl font-bold text-gray-900">₹{totalRevenue.toLocaleString()}</p>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-gray-500 text-xs">Paid</p>
              <p className="text-xl font-bold text-gray-900">{paidCount}</p>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-yellow-50 rounded-xl flex items-center justify-center">
              <Clock className="w-5 h-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-gray-500 text-xs">Pending</p>
              <p className="text-xl font-bold text-gray-900">{pendingCount}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="card flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by student name or code..." className="input-field pl-10" />
        </div>
        <div className="flex gap-2">
          {(['all', 'paid', 'pending', 'failed'] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)} className={`px-3 py-2 rounded-lg text-sm font-medium capitalize transition-colors ${filter === f ? 'bg-red-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="card p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-left text-xs font-semibold text-gray-500 px-6 py-4">Student</th>
                <th className="text-left text-xs font-semibold text-gray-500 px-4 py-4 hidden sm:table-cell">Plan</th>
                <th className="text-left text-xs font-semibold text-gray-500 px-4 py-4">Amount</th>
                <th className="text-left text-xs font-semibold text-gray-500 px-4 py-4 hidden md:table-cell">Gateway</th>
                <th className="text-left text-xs font-semibold text-gray-500 px-4 py-4 hidden lg:table-cell">Date</th>
                <th className="text-left text-xs font-semibold text-gray-500 px-4 py-4">Status</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                [...Array(6)].map((_, i) => (
                  <tr key={i} className="border-b border-gray-50">
                    <td className="px-6 py-4"><div className="h-10 bg-gray-100 rounded animate-pulse" /></td>
                    <td colSpan={5} className="px-4 py-4"><div className="h-4 bg-gray-100 rounded animate-pulse" /></td>
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr><td colSpan={6} className="px-6 py-12 text-center text-gray-400 text-sm">No payments found</td></tr>
              ) : filtered.map(payment => {
                const student = payment.student as any;
                const sub = payment.subscription as any;
                return (
                  <tr key={payment.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                          <span className="text-red-600 font-bold text-xs">{student?.full_name?.charAt(0)}</span>
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900 text-sm">{student?.full_name}</p>
                          <p className="text-xs text-gray-500">Room {student?.room_number}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4 hidden sm:table-cell text-sm text-gray-700">{sub?.plan?.plan_name || '—'}</td>
                    <td className="px-4 py-4 text-sm font-bold text-red-600">₹{payment.amount.toLocaleString()}</td>
                    <td className="px-4 py-4 hidden md:table-cell text-sm text-gray-600 capitalize">{payment.payment_gateway}</td>
                    <td className="px-4 py-4 hidden lg:table-cell text-xs text-gray-500">{new Date(payment.paid_at).toLocaleDateString('en-IN')}</td>
                    <td className="px-4 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${statusColors[payment.payment_status]}`}>
                        {payment.payment_status}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
