import { useEffect, useState } from 'react';
import { IndianRupee, CheckCircle, Clock, Receipt } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { Payment } from '../../lib/types';
import PageHeader from '../../components/ui/PageHeader';
import StatCard from '../../components/ui/StatCard';
import TableToolbar from '../../components/ui/TableToolbar';
import StatusBadge from '../../components/ui/StatusBadge';
import EmptyState from '../../components/ui/EmptyState';
import Pagination from '../../components/ui/Pagination';

const PAGE_SIZE = 10;

export default function AdminPayments() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'paid' | 'pending' | 'failed'>('all');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => { load(); }, []);
  useEffect(() => { setPage(1); }, [search, filter]);

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
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const totalRevenue = payments.filter(p => p.payment_status === 'paid').reduce((sum, p) => sum + p.amount, 0);
  const pendingCount = payments.filter(p => p.payment_status === 'pending').length;
  const paidCount = payments.filter(p => p.payment_status === 'paid').length;

  return (
    <div className="space-y-6">
      <PageHeader title="Payments & Billing" subtitle="Track all payment transactions" />

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard label="Total Revenue" value={`₹${totalRevenue.toLocaleString()}`} icon={IndianRupee} iconBg="bg-emerald-50" iconColor="text-emerald-600" />
        <StatCard label="Paid" value={paidCount} icon={CheckCircle} iconBg="bg-green-50" iconColor="text-green-600" />
        <StatCard label="Pending" value={pendingCount} icon={Clock} iconBg="bg-orange-50" iconColor="text-orange-600" />
      </div>

      <TableToolbar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search by student name or code..."
        filters={[
          { value: 'all', label: 'All' },
          { value: 'paid', label: 'Paid' },
          { value: 'pending', label: 'Pending' },
          { value: 'failed', label: 'Failed' },
        ]}
        activeFilter={filter}
        onFilterChange={setFilter}
      />

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
                    <td className="px-6 py-4"><div className="skeleton h-10" /></td>
                    <td colSpan={5} className="px-4 py-4"><div className="skeleton h-4" /></td>
                  </tr>
                ))
              ) : paged.length === 0 ? (
                <tr>
                  <td colSpan={6}>
                    <EmptyState icon={Receipt} title="No payments found" />
                  </td>
                </tr>
              ) : paged.map(payment => {
                const student = payment.student as any;
                const sub = payment.subscription as any;
                return (
                  <tr key={payment.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors duration-150">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 avatar-gradient rounded-full flex items-center justify-center flex-shrink-0">
                          <span className="text-white font-bold text-xs">{student?.full_name?.charAt(0)}</span>
                        </div>
                        <div>
                          <p className="font-semibold text-slate-900 text-sm">{student?.full_name}</p>
                          <p className="text-xs text-gray-500">Room {student?.room_number}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4 hidden sm:table-cell text-sm text-gray-700">{sub?.plan?.plan_name || '—'}</td>
                    <td className="px-4 py-4 text-sm font-bold text-red-600">₹{payment.amount.toLocaleString()}</td>
                    <td className="px-4 py-4 hidden md:table-cell text-sm text-gray-600 capitalize">{payment.payment_gateway}</td>
                    <td className="px-4 py-4 hidden lg:table-cell text-xs text-gray-500">{new Date(payment.paid_at).toLocaleDateString('en-IN')}</td>
                    <td className="px-4 py-4">
                      <StatusBadge status={payment.payment_status} className="capitalize" />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {!loading && <Pagination page={page} totalPages={totalPages} onPageChange={setPage} totalItems={filtered.length} pageSize={PAGE_SIZE} />}
      </div>
    </div>
  );
}
