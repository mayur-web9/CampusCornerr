import { useEffect, useState } from 'react';
import { Plus, Search, Trash2, Pencil, X, Save, Eye, EyeOff, KeyRound, Mail, AlertTriangle } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { Staff } from '../../lib/types';
import { toast } from 'sonner';

const EMPTY_FORM = { full_name: '', email: '', phone: '', role: 'staff' as const, password: '' };

export default function AdminStaff() {
  const [staff, setStaff] = useState<Staff[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<'add' | 'edit' | 'password' | 'delete' | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Staff | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [selected, setSelected] = useState<Staff | null>(null);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [saving, setSaving] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  // Set-password modal state
  const [settingPw, setSettingPw] = useState(false);
  const [resetEmailSent, setResetEmailSent] = useState(false);

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

  function openAdd() {
    setForm({ ...EMPTY_FORM });
    setShowPassword(false);
    setModal('add');
  }

  function openEdit(s: Staff) {
    setSelected(s);
    setForm({ full_name: s.full_name, email: s.email, phone: s.phone ?? '', role: s.role as any, password: '' });
    setModal('edit');
  }

  function openSetPassword(s: Staff) {
    setSelected(s);
    setResetEmailSent(false);
    setModal('password');
  }

  async function handleSave() {
    if (!form.full_name || !form.email) { toast.error('Fill required fields'); return; }
    setSaving(true);

    if (modal === 'add') {
      if (!form.password || form.password.length < 6) {
        toast.error('Password must be at least 6 characters');
        setSaving(false);
        return;
      }

      // 1. Create Supabase auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: form.email,
        password: form.password,
        options: {
          // Suppress email confirmation so they can log in immediately
          data: { role: 'staff' },
        },
      });

      if (authError) {
        toast.error(`Auth error: ${authError.message}`);
        setSaving(false);
        return;
      }

      const userId = authData.user?.id ?? null;

      // 2. Insert staff row with linked user_id
      const { error: dbError } = await supabase.from('staff').insert({
        full_name: form.full_name,
        email: form.email,
        phone: form.phone || null,
        role: form.role,
        user_id: userId,
        active: true,
      });

      if (dbError) {
        toast.error(dbError.message);
        setSaving(false);
        return;
      }

      toast.success('Staff member created — they can now log in!');

    } else if (selected) {
      const { error } = await supabase.from('staff').update({
        full_name: form.full_name,
        email: form.email,
        phone: form.phone || null,
        role: form.role,
      }).eq('id', selected.id);

      if (error) { toast.error(error.message); setSaving(false); return; }
      toast.success('Staff updated');
    }

    setSaving(false);
    setModal(null);
    loadStaff();
  }



  async function handleSendReset() {
    if (!selected) return;
    setSettingPw(true);
    const { error } = await supabase.auth.resetPasswordForEmail(selected.email, {
      redirectTo: `${window.location.origin}/`,
    });
    if (error) {
      toast.error(`Failed: ${error.message}`);
    } else {
      toast.success(`Password reset email sent to ${selected.email}`);
      setResetEmailSent(true);
    }
    setSettingPw(false);
  }

  function openDelete(s: Staff) {
    setDeleteTarget(s);
    setModal('delete');
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    const { error } = await supabase.from('staff').delete().eq('id', deleteTarget.id);
    if (error) { toast.error('Failed to delete staff member'); setDeleting(false); return; }
    toast.success(`${deleteTarget.full_name} has been removed`);
    setDeleting(false);
    setDeleteTarget(null);
    setModal(null);
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
              <div className="flex items-center gap-1.5">
                <span className={`w-2 h-2 rounded-full mt-0.5 ${member.user_id ? (member.active ? 'bg-green-500' : 'bg-gray-300') : 'bg-amber-400'}`} title={member.user_id ? 'Auth account linked' : 'No auth account'} />
              </div>
            </div>
            <p className="text-sm text-gray-500 mb-1">{member.email}</p>
            <p className="text-sm text-gray-500">{member.phone || '—'}</p>
            {!member.user_id && (
              <p className="text-xs text-amber-600 font-medium mt-1.5 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 inline-block" />
                No login account yet
              </p>
            )}
            <div className="flex gap-2 mt-4 pt-4 border-t border-gray-100">
              <button onClick={() => openEdit(member)} className="flex-1 btn-secondary py-1.5 text-sm flex items-center justify-center gap-1.5">
                <Pencil className="w-3.5 h-3.5" /> Edit
              </button>
              <button onClick={() => openSetPassword(member)} className="flex-1 py-1.5 text-sm rounded-lg font-medium flex items-center justify-center gap-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors">
                <KeyRound className="w-3.5 h-3.5" /> Password
              </button>
              <button onClick={() => openDelete(member)} className="flex-1 py-1.5 text-sm rounded-lg font-medium flex items-center justify-center gap-1.5 bg-red-50 text-red-600 hover:bg-red-100 transition-colors">
                <Trash2 className="w-3.5 h-3.5" /> Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Add / Edit Modal */}
      {(modal === 'add' || modal === 'edit') && (
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
                <input
                  type="email"
                  value={form.email}
                  onChange={e => setForm({ ...form, email: e.target.value })}
                  placeholder="staff@hostel.com"
                  className="input-field"
                  disabled={modal === 'edit'} // email can't change (tied to auth account)
                />
                {modal === 'edit' && (
                  <p className="text-xs text-gray-400 mt-1">Email cannot be changed after creation.</p>
                )}
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

              {/* Password field — only for new staff */}
              {modal === 'add' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Password * <span className="text-gray-400 font-normal text-xs">(min 6 characters)</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={form.password}
                      onChange={e => setForm({ ...form, password: e.target.value })}
                      placeholder="Set login password"
                      className="input-field pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(v => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <p className="text-xs text-gray-400 mt-1">Staff will use this password to log in immediately.</p>
                </div>
              )}
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setModal(null)} className="btn-secondary flex-1">Cancel</button>
              <button onClick={handleSave} disabled={saving} className="btn-primary flex-1 flex items-center justify-center gap-2">
                {saving ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save className="w-4 h-4" />}
                {modal === 'add' ? 'Create & Set Password' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Set Password Modal */}
      {modal === 'password' && selected && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-blue-100 rounded-xl flex items-center justify-center">
                  <KeyRound className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-gray-900">Manage Password</h2>
                  <p className="text-xs text-gray-500">{selected.full_name}</p>
                </div>
              </div>
              <button onClick={() => setModal(null)}><X className="w-5 h-5 text-gray-400" /></button>
            </div>

            {!selected.user_id ? (
              // No auth account linked — staff was created before this feature
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-5">
                <p className="text-sm font-semibold text-amber-800 mb-1">No login account linked</p>
                <p className="text-xs text-amber-700">
                  This staff member was added before password support. Please delete them and re-add them using <strong>Add Staff</strong> to set a password.
                </p>
              </div>
            ) : (
              <>
                {/* Send Reset Email */}
                <div className="bg-gray-50 rounded-xl p-4 mb-4">
                  <p className="text-sm font-semibold text-gray-800 mb-1">Send Password Reset Email</p>
                  <p className="text-xs text-gray-500 mb-3">
                    An email will be sent to <span className="font-medium text-gray-700">{selected.email}</span> with a link to set a new password.
                  </p>
                  {resetEmailSent ? (
                    <div className="flex items-center gap-2 text-green-700 bg-green-50 rounded-lg px-3 py-2 text-xs font-medium">
                      <Mail className="w-4 h-4" />
                      Reset email sent successfully!
                    </div>
                  ) : (
                    <button
                      onClick={handleSendReset}
                      disabled={settingPw}
                      className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-sm font-semibold py-2.5 rounded-xl transition-colors"
                    >
                      {settingPw
                        ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        : <Mail className="w-4 h-4" />}
                      Send Reset Email
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-2 my-3">
                  <div className="flex-1 h-px bg-gray-200" />
                  <span className="text-xs text-gray-400">or</span>
                  <div className="flex-1 h-px bg-gray-200" />
                </div>

                {/* Note about direct password set */}
                <div className="bg-gray-50 rounded-xl p-4">
                  <p className="text-sm font-semibold text-gray-800 mb-1">Direct Password Set</p>
                  <p className="text-xs text-gray-500">
                    To directly set a password without email, ask the staff member to click the reset link in their email. Alternatively, delete and re-create their account with a new password.
                  </p>
                </div>
              </>
            )}

            <button onClick={() => setModal(null)} className="btn-secondary w-full mt-4">Close</button>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {modal === 'delete' && deleteTarget && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5 text-red-600" />
                </div>
                <h2 className="text-lg font-bold text-gray-900">Delete Staff</h2>
              </div>
              <button onClick={() => { setModal(null); setDeleteTarget(null); }}>
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            {/* Staff preview */}
            <div className="bg-gray-50 rounded-xl p-4 mb-5 flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${deleteTarget.active ? 'bg-red-100' : 'bg-gray-100'}`}>
                <span className={`font-bold text-sm ${deleteTarget.active ? 'text-red-600' : 'text-gray-400'}`}>
                  {deleteTarget.full_name.charAt(0)}
                </span>
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">{deleteTarget.full_name}</p>
                <p className="text-xs text-gray-500">{deleteTarget.email}</p>
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full capitalize mt-1 inline-block ${{
                  staff: 'bg-blue-100 text-blue-700',
                  supervisor: 'bg-purple-100 text-purple-700',
                  manager: 'bg-orange-100 text-orange-700',
                }[deleteTarget.role]}`}>
                  {deleteTarget.role}
                </span>
              </div>
            </div>

            <p className="text-sm text-gray-600 mb-5">
              This will permanently remove this staff member from the system.{' '}
              <span className="font-semibold text-red-600">This action cannot be undone.</span>
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => { setModal(null); setDeleteTarget(null); }}
                className="btn-secondary flex-1"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1 flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 disabled:opacity-60 text-white text-sm font-semibold py-2.5 px-4 rounded-xl transition-colors"
              >
                {deleting
                  ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  : <Trash2 className="w-4 h-4" />}
                Delete Staff
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
