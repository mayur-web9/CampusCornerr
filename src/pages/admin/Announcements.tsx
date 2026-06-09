import { useEffect, useState } from 'react';
import { Plus, Megaphone, Power, Trash2, X, Save } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { Announcement } from '../../lib/types';
import { toast } from 'sonner';

export default function AdminAnnouncements() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ title: '', description: '' });
  const [saving, setSaving] = useState(false);

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

  async function deleteAnn(id: string) {
    if (!confirm('Delete this announcement?')) return;
    await supabase.from('announcements').delete().eq('id', id);
    toast.success('Announcement deleted');
    load();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Announcements</h1>
          <p className="text-gray-500 text-sm mt-1">Manage announcements for students</p>
        </div>
        <button onClick={() => setModal(true)} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" />
          New Announcement
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4">
        <div className="card">
          <p className="text-gray-500 text-sm">Total</p>
          <p className="text-3xl font-bold text-gray-900 mt-1">{announcements.length}</p>
        </div>
        <div className="card">
          <p className="text-gray-500 text-sm">Active</p>
          <p className="text-3xl font-bold text-green-600 mt-1">{announcements.filter(a => a.active).length}</p>
        </div>
      </div>

      {/* List */}
      <div className="space-y-3">
        {loading ? (
          [...Array(4)].map((_, i) => <div key={i} className="card h-28 animate-pulse bg-gray-100" />)
        ) : announcements.length === 0 ? (
          <div className="card text-center py-12">
            <Megaphone className="w-12 h-12 text-gray-200 mx-auto mb-3" />
            <p className="text-gray-500 text-sm">No announcements yet</p>
            <button onClick={() => setModal(true)} className="mt-3 btn-primary text-sm px-4 py-2">Create First Announcement</button>
          </div>
        ) : announcements.map(ann => (
          <div key={ann.id} className={`card border-l-4 ${ann.active ? 'border-green-500' : 'border-gray-300'}`}>
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3 flex-1 min-w-0">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${ann.active ? 'bg-orange-100' : 'bg-gray-100'}`}>
                  <Megaphone className={`w-5 h-5 ${ann.active ? 'text-orange-600' : 'text-gray-400'}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-bold text-gray-900">{ann.title}</h3>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${ann.active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                      {ann.active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">{ann.description}</p>
                  <p className="text-xs text-gray-400 mt-2">
                    {new Date(ann.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                <button onClick={() => toggleActive(ann)} title={ann.active ? 'Deactivate' : 'Activate'} className={`p-1.5 rounded-lg transition-colors ${ann.active ? 'text-green-600 hover:bg-green-50' : 'text-gray-400 hover:bg-gray-50'}`}>
                  <Power className="w-4 h-4" />
                </button>
                <button onClick={() => deleteAnn(ann.id)} title="Delete" className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      {modal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-gray-900">New Announcement</h2>
              <button onClick={() => setModal(false)}><X className="w-5 h-5 text-gray-400" /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
                <input type="text" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="e.g., Holiday Notice" className="input-field" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description *</label>
                <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Enter announcement details..." rows={4} className="input-field resize-none" />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setModal(false)} className="btn-secondary flex-1">Cancel</button>
              <button onClick={handleCreate} disabled={saving} className="btn-primary flex-1 flex items-center justify-center gap-2">
                {saving ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save className="w-4 h-4" />}
                Publish
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
