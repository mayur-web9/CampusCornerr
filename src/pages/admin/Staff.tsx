import { useEffect, useState } from 'react';
import { Plus, Search, Power, Pencil, X, Save } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { Staff } from '../../lib/types';
import { toast } from 'sonner';

const EMPTY_FORM = { full_name: '', email: '', phone: '', role: 'staff' as const };

export default function AdminStaff() {
  const [staff, setStaff] = useState<Staff[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<'add' | 'edit' | null>(null);
  const [selected, setSelected] = useState<Staff | null>(null);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [saving, setSaving] = useState(false);

  useEffect(() => { loadStaff(); }, []);

  async function loadStaff() {
    const { data } = await supabase.from('staff').select('*').order('created_at', { ascending: false });
    setStaff(data ?? []);
    setLoading(false);
  }

  const filtered = staff.filter(s =>
    s.full_name.toLowerCase().includes(search.toLowerCase()) ||
    s.email.toLowerCase().includes(search.toLowerCase()) ||
    s.role.toLowerCase().includes(search.toLowerCase())
  );

  function openAdd() { setForm({ ...EMPTY_FORM }); setModal('add'); }
  function openEdit(s: Staff) { setSelected(s); setForm({ full_name: s.full_name, email: s.email, phone: s.phone ?? '', role: s.role as any }); setModal('edit'); }

  async function handleSave() {
    if (!form.full_name || !form.email) { toast.error('Fill required fields'); return; }
    setSaving(true);
    if (modal === 'add') {
      const { error } = await supabase.from('staff').insert({ ...form });
      if (error) { toast.error(error.message); setSaving(false); return; }
      toast.success('Staff member added');
    } else if (selected) {
      const { error } = await supabase.from('staff').update({ ...form }).eq('id', selected.id);
      if (error) { toast.error(error.message); setSaving(false); return; }
      toast.success('Staff updated');
    }
    setSaving(false);
    setModal(null);
    loadStaff();
  }

  async function toggleActive(s: Staff) {
    const { error } = await supabase.from('staff').update({ active: !s.active }).eq('id', s.id);
    if (error) { toast.error('Update failed'); return; }
    toast.success(`Staff ${s.active ? 'deactivated' : 'activated'}`);
    loadStaff();
  }

  const roleColors: Record<string, string> = {
    staff: 'bg-blue-100 text-blue-700',
    supervisor: 'bg-purple-100 text-purple-700',
    manager: 'bg-orange-100 text-orange-700',
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Staff Management</h1>
          <p className="text-gray-500 text-sm mt-1">{staff.length} staff members</p>
        </div>
        <button onClick={openAdd} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Add Staff
        </button>
      </div>

      <div className="card">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search staff..." className="input-field pl-10" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          [...Array(6)].map((_, i) => <div key={i} className="card h-36 animate-pulse bg-gray-100" />)
        ) : filtered.length === 0 ? (
          <div className="col-span-full card text-center py-12 text-gray-400">
            <p className="text-sm">No staff members found</p>
          </div>
        ) : filtered.map(member => (
          <div key={member.id} className="card hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${member.active ? 'bg-red-100' : 'bg-gray-100'}`}>
                  <span className={`font-bold ${member.active ? 'text-red-600' : 'text-gray-400'}`}>{member.full_name.charAt(0)}</span>
                </div>
                <div>
                  <p className="font-bold text-gray-900 text-sm">{member.full_name}</p>
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full capitalize ${roleColors[member.role]}`}>{member.role}</span>
                </div>
              </div>
              <span className={`w-2 h-2 rounded-full mt-2 ${member.active ? 'bg-green-500' : 'bg-gray-300'}`} />
            </div>
            <p className="text-sm text-gray-500 mb-1">{member.email}</p>
            <p className="text-sm text-gray-500">{member.phone || '—'}</p>
            <div className="flex gap-2 mt-4 pt-4 border-t border-gray-100">
              <button onClick={() => openEdit(member)} className="flex-1 btn-secondary py-1.5 text-sm flex items-center justify-center gap-1.5">
                <Pencil className="w-3.5 h-3.5" /> Edit
              </button>
              <button onClick={() => toggleActive(member)} className={`flex-1 py-1.5 text-sm rounded-lg font-medium flex items-center justify-center gap-1.5 transition-colors ${member.active ? 'bg-red-50 text-red-600 hover:bg-red-100' : 'bg-green-50 text-green-600 hover:bg-green-100'}`}>
                <Power className="w-3.5 h-3.5" /> {member.active ? 'Deactivate' : 'Activate'}
              </button>
            </div>
          </div>
        ))}
      </div>

      {modal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-gray-900">{modal === 'add' ? 'Add Staff' : 'Edit Staff'}</h2>
              <button onClick={() => setModal(null)}><X className="w-5 h-5 text-gray-400" /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
                <input type="text" value={form.full_name} onChange={e => setForm({ ...form, full_name: e.target.value })} placeholder="Enter full name" className="input-field" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="staff@hostel.com" className="input-field" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                <input type="tel" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="Enter phone" className="input-field" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                <select value={form.role} onChange={e => setForm({ ...form, role: e.target.value as any })} className="input-field">
                  <option value="staff">Staff</option>
                  <option value="supervisor">Supervisor</option>
                  <option value="manager">Manager</option>
                </select>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setModal(null)} className="btn-secondary flex-1">Cancel</button>
              <button onClick={handleSave} disabled={saving} className="btn-primary flex-1 flex items-center justify-center gap-2">
                {saving ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save className="w-4 h-4" />}
                {modal === 'add' ? 'Add' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
