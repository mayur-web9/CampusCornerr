import { useEffect, useState } from 'react';
import { Plus, Search, RefreshCw, X, Save, Calendar } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { Subscription, Student, MealPlan } from '../../lib/types';
import { toast } from 'sonner';

export default function AdminSubscriptions() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [plans, setPlans] = useState<MealPlan[]>([]);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'active' | 'expired'>('all');
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ student_id: '', plan_id: '', start_date: new Date().toISOString().split('T')[0] });
  const [saving, setSaving] = useState(false);

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    const [subRes, stuRes, planRes] = await Promise.all([
      supabase.from('subscriptions').select('*, student:students(full_name, room_number, student_code), plan:meal_plans(plan_name, duration_days, price)').order('created_at', { ascending: false }),
      supabase.from('students').select('id, full_name, student_code, room_number').eq('role', 'student').order('full_name'),
      supabase.from('meal_plans').select('*').eq('active', true),
    ]);
    setSubscriptions(subRes.data ?? []);
    setStudents(stuRes.data ?? []);
    setPlans(planRes.data ?? []);
    setLoading(false);
  }

  const filtered = subscriptions.filter(s => {
    const student = s.student as any;
    const matchesSearch = !search ||
      student?.full_name?.toLowerCase().includes(search.toLowerCase()) ||
      student?.student_code?.toLowerCase().includes(search.toLowerCase()) ||
      student?.room_number?.toLowerCase().includes(search.toLowerCase());
    const today = new Date().toISOString().split('T')[0];
    const isActive = s.status === 'active' && s.end_date >= today;
    const matchesFilter = filter === 'all' || (filter === 'active' ? isActive : !isActive);
    return matchesSearch && matchesFilter;
  });

  async function handleCreate() {
    if (!form.student_id || !form.plan_id) { toast.error('Select student and plan'); return; }
    const plan = plans.find(p => p.id === form.plan_id);
    if (!plan) return;

    setSaving(true);
    const startDate = new Date(form.start_date);
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + plan.duration_days - 1);

    const { data: newSub, error } = await supabase.from('subscriptions').insert({
      student_id: form.student_id,
      plan_id: plan.id,
      amount_paid: plan.price,
      start_date: form.start_date,
      end_date: endDate.toISOString().split('T')[0],
      status: 'active',
      payment_status: 'paid',
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

  function isSubActive(sub: Subscription) {
    const today = new Date().toISOString().split('T')[0];
    return sub.status === 'active' && sub.end_date >= today;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Subscriptions</h1>
          <p className="text-gray-500 text-sm mt-1">{subscriptions.length} total subscriptions</p>
        </div>
        <button onClick={() => setModal(true)} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" />
          New Subscription
        </button>
      </div>

      {/* Filters */}
      <div className="card flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search students..." className="input-field pl-10" />
        </div>
        <div className="flex gap-2">
          {(['all', 'active', 'expired'] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)} className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition-colors ${filter === f ? 'bg-red-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
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
                <th className="text-left text-xs font-semibold text-gray-500 px-4 py-4 hidden md:table-cell">Period</th>
                <th className="text-left text-xs font-semibold text-gray-500 px-4 py-4 hidden lg:table-cell">Amount</th>
                <th className="text-left text-xs font-semibold text-gray-500 px-4 py-4">Status</th>
                <th className="text-right text-xs font-semibold text-gray-500 px-6 py-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i} className="border-b border-gray-50">
                    <td className="px-6 py-4"><div className="h-10 bg-gray-100 rounded animate-pulse" /></td>
                    <td colSpan={5} className="px-4 py-4"><div className="h-4 bg-gray-100 rounded animate-pulse" /></td>
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr><td colSpan={6} className="px-6 py-12 text-center text-gray-400 text-sm">No subscriptions found</td></tr>
              ) : filtered.map(sub => {
                const student = sub.student as any;
                const plan = sub.plan as any;
                const active = isSubActive(sub);
                return (
                  <tr key={sub.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
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
                    <td className="px-4 py-4 hidden sm:table-cell text-sm text-gray-700">{plan?.plan_name}</td>
                    <td className="px-4 py-4 hidden md:table-cell text-xs text-gray-500">
                      {new Date(sub.start_date).toLocaleDateString('en-IN')} – {new Date(sub.end_date).toLocaleDateString('en-IN')}
                    </td>
                    <td className="px-4 py-4 hidden lg:table-cell text-sm font-semibold text-gray-900">₹{sub.amount_paid.toLocaleString()}</td>
                    <td className="px-4 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {active ? 'Active' : 'Expired'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <button onClick={() => toggleStatus(sub)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Toggle Status">
                        <RefreshCw className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Modal */}
      {modal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-gray-900">New Subscription</h2>
              <button onClick={() => setModal(false)}><X className="w-5 h-5 text-gray-400" /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Student *</label>
                <select value={form.student_id} onChange={e => setForm({ ...form, student_id: e.target.value })} className="input-field">
                  <option value="">Select student</option>
                  {students.map(s => <option key={s.id} value={s.id}>{s.full_name} ({s.student_code})</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Meal Plan *</label>
                <select value={form.plan_id} onChange={e => setForm({ ...form, plan_id: e.target.value })} className="input-field">
                  <option value="">Select plan</option>
                  {plans.map(p => <option key={p.id} value={p.id}>{p.plan_name} — ₹{p.price} / {p.duration_days} days</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Start Date *</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input type="date" value={form.start_date} onChange={e => setForm({ ...form, start_date: e.target.value })} className="input-field pl-10" />
                </div>
              </div>
              {form.plan_id && (
                <div className="p-3 bg-gray-50 rounded-xl text-sm text-gray-600">
                  End Date: <span className="font-semibold text-gray-900">
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
                {saving ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save className="w-4 h-4" />}
                Create
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
