import { useEffect, useState } from 'react';
import { Plus, Calendar, Save, Pencil, Sunrise, Sun, Moon } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { Menu } from '../../lib/types';
import { toast } from 'sonner';
import PageHeader from '../../components/ui/PageHeader';
import EmptyState from '../../components/ui/EmptyState';
import Modal from '../../components/ui/Modal';
import ActionButton from '../../components/ui/ActionButton';

const EMPTY_FORM = { meal_date: new Date().toISOString().split('T')[0], breakfast: '', lunch: '', dinner: '' };

export default function AdminMenus() {
  const [menus, setMenus] = useState<Menu[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<'add' | 'edit' | null>(null);
  const [selected, setSelected] = useState<Menu | null>(null);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [saving, setSaving] = useState(false);

  useEffect(() => { loadMenus(); }, []);

  async function loadMenus() {
    const { data } = await supabase.from('menus').select('*').order('meal_date', { ascending: false }).limit(30);
    setMenus(data ?? []);
    setLoading(false);
  }

  function openAdd() { setForm({ ...EMPTY_FORM }); setModal('add'); }
  function openEdit(m: Menu) { setSelected(m); setForm({ meal_date: m.meal_date, breakfast: m.breakfast ?? '', lunch: m.lunch ?? '', dinner: m.dinner ?? '' }); setModal('edit'); }

  async function handleSave() {
    if (!form.meal_date) { toast.error('Select a date'); return; }
    setSaving(true);
    if (modal === 'add') {
      const { error } = await supabase.from('menus').upsert({ ...form });
      if (error) { toast.error(error.message); setSaving(false); return; }
      toast.success('Menu saved');
    } else if (selected) {
      const { error } = await supabase.from('menus').update({ breakfast: form.breakfast, lunch: form.lunch, dinner: form.dinner }).eq('id', selected.id);
      if (error) { toast.error(error.message); setSaving(false); return; }
      toast.success('Menu updated');
    }
    setSaving(false);
    setModal(null);
    loadMenus();
  }

  const today = new Date().toISOString().split('T')[0];
  const todaysMenu = menus.find(m => m.meal_date === today);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Menu Management"
        subtitle="Set daily meal menus for students"
        actions={
          <button onClick={openAdd} className="btn-primary flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Add Menu
          </button>
        }
      />

      {/* Today's Menu Highlight */}
      {todaysMenu ? (
        <div className="bg-gradient-to-br from-red-600 to-red-700 rounded-2xl p-6 text-white shadow-lg shadow-red-600/20">
          <div className="flex items-center gap-2 mb-4">
            <Calendar className="w-5 h-5" aria-hidden="true" />
            <h2 className="font-bold">Today's Menu — {new Date().toLocaleDateString('en-IN', { weekday: 'long', month: 'long', day: 'numeric' })}</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { label: 'Breakfast', icon: Sunrise, value: todaysMenu.breakfast },
              { label: 'Lunch', icon: Sun, value: todaysMenu.lunch },
              { label: 'Dinner', icon: Moon, value: todaysMenu.dinner },
            ].map(item => (
              <div key={item.label} className="bg-white/10 rounded-xl p-3">
                <p className="text-white/70 text-xs mb-1 flex items-center gap-1.5">
                  <item.icon className="w-3.5 h-3.5" aria-hidden="true" />
                  {item.label}
                </p>
                <p className="text-white font-medium text-sm">{item.value || 'Not set'}</p>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="card border-2 border-dashed border-red-200 bg-red-50/50">
          <EmptyState
            icon={Calendar}
            title="No menu set for today"
            action={<button onClick={openAdd} className="btn-primary text-sm px-4 py-2">Set Today's Menu</button>}
          />
        </div>
      )}

      {/* Menu List */}
      <div className="space-y-3">
        {loading ? (
          [...Array(5)].map((_, i) => <div key={i} className="card h-24 skeleton" />)
        ) : menus.length === 0 ? (
          <div className="card">
            <EmptyState icon={Calendar} title="No menus found" />
          </div>
        ) : menus.map(menu => {
          const isToday = menu.meal_date === today;
          return (
            <div key={menu.id} className={`card flex items-start gap-4 ${isToday ? 'ring-2 ring-red-500 ring-offset-1' : ''}`}>
              <div className="flex-shrink-0">
                <div className={`w-12 h-12 rounded-xl flex flex-col items-center justify-center ${isToday ? 'bg-red-600 text-white' : 'bg-gray-100 text-gray-600'}`}>
                  <span className="text-xs font-bold">{new Date(menu.meal_date).toLocaleDateString('en-IN', { day: '2-digit' })}</span>
                  <span className="text-[10px]">{new Date(menu.meal_date).toLocaleDateString('en-IN', { month: 'short' })}</span>
                </div>
                {isToday && <div className="text-center text-[10px] text-red-600 font-bold mt-1">Today</div>}
              </div>
              <div className="flex-1">
                <p className="font-semibold text-slate-900 text-sm mb-2">{new Date(menu.meal_date).toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-sm text-gray-600">
                  <div><span className="text-gray-400 text-xs">Breakfast:</span> <span>{menu.breakfast || '—'}</span></div>
                  <div><span className="text-gray-400 text-xs">Lunch:</span> <span>{menu.lunch || '—'}</span></div>
                  <div><span className="text-gray-400 text-xs">Dinner:</span> <span>{menu.dinner || '—'}</span></div>
                </div>
              </div>
              <ActionButton icon={Pencil} label="Edit" onClick={() => openEdit(menu)} />
            </div>
          );
        })}
      </div>

      {/* Modal */}
      <Modal open={modal !== null} onClose={() => setModal(null)} title={modal === 'add' ? 'Add Menu' : 'Edit Menu'} maxWidth="max-w-md">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Date *</label>
            <input type="date" value={form.meal_date} onChange={e => setForm({ ...form, meal_date: e.target.value })} className="input-field" disabled={modal === 'edit'} />
          </div>
          {[
            { label: 'Breakfast', icon: Sunrise, key: 'breakfast', placeholder: 'e.g., Poha, Tea, Banana' },
            { label: 'Lunch', icon: Sun, key: 'lunch', placeholder: 'e.g., Rice, Dal, Sabzi, Salad' },
            { label: 'Dinner', icon: Moon, key: 'dinner', placeholder: 'e.g., Roti, Paneer, Sabzi' },
          ].map(field => (
            <div key={field.key}>
              <label className="text-sm font-medium text-slate-700 mb-1 flex items-center gap-1.5">
                <field.icon className="w-3.5 h-3.5 text-gray-400" aria-hidden="true" />
                {field.label}
              </label>
              <input
                type="text"
                value={(form as any)[field.key]}
                onChange={e => setForm({ ...form, [field.key]: e.target.value })}
                placeholder={field.placeholder}
                className="input-field"
              />
            </div>
          ))}
        </div>
        <div className="flex gap-3 mt-6">
          <button onClick={() => setModal(null)} className="btn-secondary flex-1">Cancel</button>
          <button onClick={handleSave} disabled={saving} className="btn-primary flex-1 flex items-center justify-center gap-2">
            {saving ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save className="w-4 h-4" />}
            Save Menu
          </button>
        </div>
      </Modal>
    </div>
  );
}
