import { useEffect, useState } from 'react';
import { Plus, Megaphone, Power, Trash2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { Announcement } from '../../lib/types';
import { toast } from 'sonner';
import PageHeader from '../../components/ui/PageHeader';
import StatCard from '../../components/ui/StatCard';
import EmptyState from '../../components/ui/EmptyState';
import Modal from '../../components/ui/Modal';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import ActionButton from '../../components/ui/ActionButton';

export default function AdminAnnouncements() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ title: '', description: '' });
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Announcement | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => { load(); }, []);

  async function load() {
    const { data } = await supabase.from('announcements').select('*').order('created_at', { ascending: false });
    setAnnouncements(data ?? []);
    setLoading(false);
  }

  async function handleCreate() {
    if (!form.title || !form.description) { toast.error('Fill all fields'); return; }
    setSaving(true);
    const { error } = await supabase.from('announcements').insert({ title: form.title, description: form.description, active: true });
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success('Announcement created');
    setModal(false);
    setForm({ title: '', description: '' });
    load();
  }

  async function toggleActive(ann: Announcement) {
    const { error } = await supabase.from('announcements').update({ active: !ann.active }).eq('id', ann.id);
    if (error) { toast.error('Update failed'); return; }
    toast.success(`Announcement ${ann.active ? 'deactivated' : 'activated'}`);
    load();
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    const { error } = await supabase.from('announcements').delete().eq('id', deleteTarget.id);
    setDeleting(false);
    if (error) { toast.error('Failed to delete announcement'); return; }
    toast.success('Announcement deleted');
    setDeleteTarget(null);
    load();
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Announcements"
        subtitle="Manage announcements for students"
        actions={
          <button onClick={() => setModal(true)} className="btn-primary flex items-center gap-2">
            <Plus className="w-4 h-4" />
            New Announcement
          </button>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4">
        <StatCard label="Total" value={announcements.length} icon={Megaphone} iconBg="bg-blue-50" iconColor="text-blue-600" />
        <StatCard label="Active" value={announcements.filter(a => a.active).length} icon={Power} iconBg="bg-green-50" iconColor="text-green-600" />
      </div>

      {/* List */}
      <div className="space-y-3">
        {loading ? (
          [...Array(4)].map((_, i) => <div key={i} className="card h-28 skeleton" />)
        ) : announcements.length === 0 ? (
          <div className="card">
            <EmptyState
              icon={Megaphone}
              title="No announcements yet"
              action={<button onClick={() => setModal(true)} className="btn-primary text-sm px-4 py-2">Create First Announcement</button>}
            />
          </div>
        ) : announcements.map(ann => (
          <div key={ann.id} className={`card border-l-4 ${ann.active ? 'border-green-500' : 'border-gray-300'}`}>
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3 flex-1 min-w-0">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${ann.active ? 'bg-orange-50' : 'bg-gray-100'}`}>
                  <Megaphone className={`w-5 h-5 ${ann.active ? 'text-orange-600' : 'text-gray-400'}`} aria-hidden="true" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-bold text-slate-900">{ann.title}</h3>
                    <span className={ann.active ? 'badge-active' : 'badge-neutral'}>{ann.active ? 'Active' : 'Inactive'}</span>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">{ann.description}</p>
                  <p className="text-xs text-gray-400 mt-2">
                    {new Date(ann.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                <ActionButton icon={Power} label={ann.active ? 'Deactivate' : 'Activate'} tone="success" onClick={() => toggleActive(ann)} />
                <ActionButton icon={Trash2} label="Delete" tone="danger" onClick={() => setDeleteTarget(ann)} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Create Modal */}
      <Modal open={modal} onClose={() => setModal(false)} title="New Announcement" maxWidth="max-w-md">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Title *</label>
            <input type="text" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="e.g., Holiday Notice" className="input-field" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Description *</label>
            <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Enter announcement details..." rows={4} className="input-field resize-none" />
          </div>
        </div>
        <div className="flex gap-3 mt-6">
          <button onClick={() => setModal(false)} className="btn-secondary flex-1">Cancel</button>
          <button onClick={handleCreate} disabled={saving} className="btn-primary flex-1 flex items-center justify-center gap-2">
            {saving && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
            Publish
          </button>
        </div>
      </Modal>

      <ConfirmDialog
        open={deleteTarget !== null}
        title="Delete Announcement"
        description="This will permanently delete this announcement. This action cannot be undone."
        confirmLabel="Delete"
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
