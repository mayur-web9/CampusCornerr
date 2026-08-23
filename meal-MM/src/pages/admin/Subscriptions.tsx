import { useEffect, useState } from 'react';
import { Plus, RefreshCw, Calendar, Trash2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { Subscription, Student, MealPlan } from '../../lib/types';
import { toast } from 'sonner';
import PageHeader from '../../components/ui/PageHeader';
import TableToolbar from '../../components/ui/TableToolbar';
import StatusBadge from '../../components/ui/StatusBadge';
import ActionButton from '../../components/ui/ActionButton';
import EmptyState from '../../components/ui/EmptyState';
import Modal from '../../components/ui/Modal';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import Pagination from '../../components/ui/Pagination';

const PAGE_SIZE = 10;

export default function AdminSubscriptions() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [plans, setPlans] = useState<MealPlan[]>([]);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'active' | 'expired'>('all');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ student_id: '', plan_id: '', start_date: new Date().toISOString().split('T')[0] });
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Subscription | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => { loadData(); }, []);
  useEffect(() => { setPage(1); }, [search, filter]);

  async function loadData() {
    const [subRes, stuRes, planRes] = await Promise.all([
      supabase.from('subscriptions').select('*, student:students(full_name, room_number, student_code), plan:meal_plans(plan_name, duration_days, price)').order('created_at', { ascending: false }),
      supabase.from('students').select('*').eq('role', 'student').order('full_name'),
      supabase.from('meal_plans').select('*').eq('active', true),
    ]);
    setSubscriptions(subRes.data ?? []);
    setStudents(stuRes.data ?? []);
    setPlans(planRes.data ?? []);
    setLoading(false);
  }

  function isSubActive(sub: Subscription) {
    const today = new Date().toISOString().split('T')[0];
    return sub.status === 'active' && sub.end_date >= today;
  }

  const filtered = subscriptions.filter(s => {
    const student = s.student as any;
    const matchesSearch = !search ||
      student?.full_name?.toLowerCase().includes(search.toLowerCase()) ||
      student?.student_code?.toLowerCase().includes(search.toLowerCase()) ||
      student?.room_number?.toLowerCase().includes(search.toLowerCase());
    const isActive = isSubActive(s);
    const matchesFilter = filter === 'all' || (filter === 'active' ? isActive : !isActive);
    return matchesSearch && matchesFilter;
  });
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  async function handleCreate() {
    if (!form.student_id || !form.plan_id) { toast.error('Select student and plan'); return; }
    const plan = plans.find(p => p.id === form.plan_id);
    if (!plan) return;

    setSaving(true);
    const startDate = new Date(form.start_date);
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + plan.duration_days - 1);
    const graceEndDate = new Date(endDate);
    graceEndDate.setDate(graceEndDate.getDate() + (plan.grace_days ?? 0));

    const { data: newSub, error } = await supabase.from('subscriptions').insert({
      student_id: form.student_id,
      plan_id: plan.id,
      amount_paid: plan.price,
      start_date: form.start_date,
      end_date: endDate.toISOString().split('T')[0],
      status: 'active',
      payment_status: 'paid',
      allocated_breakfast: plan.breakfast_limit,
      allocated_lunch: plan.lunch_limit,
      allocated_dinner: plan.dinner_limit,
      remaining_breakfast: plan.breakfast_limit,
      remaining_lunch: plan.lunch_limit,
      remaining_dinner: plan.dinner_limit,
      grace_end_date: graceEndDate.toISOString().split('T')[0],
    }).select().single();

    if (error) { toast.error(error.message); setSaving(false); return; }

    if (newSub) {
      await supabase.from('payments').insert({
        student_id: form.student_id,
        subscription_id: newSub.id,
        amount: plan.price,
        payment_gateway: 'manual',
        payment_status: 'paid',
      });
    }

    toast.success('Subscription created');
    setSaving(false);
    setModal(false);
    loadData();
  }

  async function toggleStatus(sub: Subscription) {
    const newStatus = sub.status === 'active' ? 'expired' : 'active';
    const { error } = await supabase.from('subscriptions').update({ status: newStatus }).eq('id', sub.id);
    if (error) { toast.error('Update failed'); return; }
    toast.success(`Status updated to ${newStatus}`);
    loadData();
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    // Delete linked payments first to avoid FK constraint errors
    await supabase.from('payments').delete().eq('subscription_id', deleteTarget.id);
    const { error } = await supabase.from('subscriptions').delete().eq('id', deleteTarget.id);
    if (error) { toast.error('Failed to delete subscription'); setDeleting(false); return; }
    toast.success('Subscription deleted successfully');
    setDeleting(false);
    setDeleteTarget(null);
    loadData();
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Subscriptions"
        subtitle={`${subscriptions.length} total subscriptions`}
        actions={
          <button onClick={() => setModal(true)} className="btn-primary flex items-center gap-2">
            <Plus className="w-4 h-4" />
            New Subscription
          </button>
        }
      />

      <TableToolbar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search students..."
        filters={[
          { value: 'all', label: 'All' },
          { value: 'active', label: 'Active' },
          { value: 'expired', label: 'Expired' },
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
                <th className="text-left text-xs font-semibold text-gray-500 px-4 py-4 hidden md:table-cell">Period</th>
                <th className="text-left text-xs font-semibold text-gray-500 px-4 py-4 hidden lg:table-cell">Amount</th>
                <th className="text-left text-xs font-semibold text-gray-500 px-4 py-4 hidden xl:table-cell">Meals Remaining</th>
                <th className="text-left text-xs font-semibold text-gray-500 px-4 py-4 hidden xl:table-cell">Grace Ends</th>
                <th className="text-left text-xs font-semibold text-gray-500 px-4 py-4">Status</th>
                <th className="text-right text-xs font-semibold text-gray-500 px-6 py-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i} className="border-b border-gray-50">
                    <td className="px-6 py-4"><div className="skeleton h-10" /></td>
                    <td colSpan={7} className="px-4 py-4"><div className="skeleton h-4" /></td>
                  </tr>
                ))
              ) : paged.length === 0 ? (
                <tr>
                  <td colSpan={8}>
                    <EmptyState icon={RefreshCw} title="No subscriptions found" />
                  </td>
                </tr>
              ) : paged.map(sub => {
                const student = sub.student as any;
                const plan = sub.plan as any;
                const active = isSubActive(sub);
                return (
                  <tr key={sub.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors duration-150">
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
                    <td className="px-4 py-4 hidden sm:table-cell text-sm text-gray-700">{plan?.plan_name}</td>
                    <td className="px-4 py-4 hidden md:table-cell text-xs text-gray-500">
                      {new Date(sub.start_date).toLocaleDateString('en-IN')} – {new Date(sub.end_date).toLocaleDateString('en-IN')}
                    </td>
                    <td className="px-4 py-4 hidden lg:table-cell text-sm font-semibold text-slate-900">₹{sub.amount_paid.toLocaleString()}</td>
                    <td className="px-4 py-4 hidden xl:table-cell text-xs text-gray-600">
                      {typeof sub.remaining_breakfast === 'number' ? (
                        <>B {sub.remaining_breakfast}/{sub.allocated_breakfast} · L {sub.remaining_lunch}/{sub.allocated_lunch} · D {sub.remaining_dinner}/{sub.allocated_dinner}</>
                      ) : '—'}
                    </td>
                    <td className="px-4 py-4 hidden xl:table-cell text-xs text-gray-500">
                      {sub.grace_end_date ? new Date(sub.grace_end_date).toLocaleDateString('en-IN') : '—'}
                    </td>
                    <td className="px-4 py-4">
                      <StatusBadge status={active ? 'Active' : 'Expired'} />
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-1">
                        <ActionButton icon={RefreshCw} label="Toggle Status" onClick={() => toggleStatus(sub)} />
                        <ActionButton icon={Trash2} label="Delete Subscription" tone="danger" onClick={() => setDeleteTarget(sub)} />
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {!loading && <Pagination page={page} totalPages={totalPages} onPageChange={setPage} totalItems={filtered.length} pageSize={PAGE_SIZE} />}
      </div>

      {/* Create Modal */}
      <Modal open={modal} onClose={() => setModal(false)} title="New Subscription" maxWidth="max-w-md">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Student *</label>
            <select value={form.student_id} onChange={e => setForm({ ...form, student_id: e.target.value })} className="input-field">
              <option value="">Select student</option>
              {students.map(s => <option key={s.id} value={s.id}>{s.full_name} ({s.student_code})</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Meal Plan *</label>
            <select value={form.plan_id} onChange={e => setForm({ ...form, plan_id: e.target.value })} className="input-field">
              <option value="">Select plan</option>
              {plans.map(p => <option key={p.id} value={p.id}>{p.plan_name} — ₹{p.price} / {p.duration_days} days</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Start Date *</label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input type="date" value={form.start_date} onChange={e => setForm({ ...form, start_date: e.target.value })} className="input-field pl-10" />
            </div>
          </div>
          {form.plan_id && (
            <div className="p-3 bg-gray-50 rounded-xl text-sm text-gray-600">
              End Date: <span className="font-semibold text-slate-900">
                {(() => {
                  const plan = plans.find(p => p.id === form.plan_id);
                  if (!plan) return '—';
                  const d = new Date(form.start_date);
                  d.setDate(d.getDate() + plan.duration_days - 1);
                  return d.toLocaleDateString('en-IN');
                })()}
              </span>
              {' '} | Amount: <span className="font-semibold text-red-600">₹{plans.find(p => p.id === form.plan_id)?.price.toLocaleString()}</span>
            </div>
          )}
        </div>
        <div className="flex gap-3 mt-6">
          <button onClick={() => setModal(false)} className="btn-secondary flex-1">Cancel</button>
          <button onClick={handleCreate} disabled={saving} className="btn-primary flex-1 flex items-center justify-center gap-2">
            {saving && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
            Create
          </button>
        </div>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={deleteTarget !== null}
        title="Delete Subscription"
        description={
          deleteTarget && (
            <div className="space-y-2">
              <div className="bg-gray-50 rounded-xl p-4 space-y-1">
                <p className="text-sm font-semibold text-slate-900">{(deleteTarget.student as any)?.full_name}</p>
                <p className="text-xs text-gray-500">{(deleteTarget.plan as any)?.plan_name}</p>
                <p className="text-xs text-gray-500">
                  {new Date(deleteTarget.start_date).toLocaleDateString('en-IN')} – {new Date(deleteTarget.end_date).toLocaleDateString('en-IN')}
                </p>
                <p className="text-xs font-semibold text-red-600">₹{deleteTarget.amount_paid.toLocaleString()}</p>
              </div>
              <p>This will permanently delete the subscription and its linked payment record. <span className="font-semibold text-red-600">This action cannot be undone.</span></p>
            </div>
          )
        }
        confirmLabel="Delete"
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
