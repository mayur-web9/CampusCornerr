import { useEffect, useState } from 'react';
import { Plus, Search, Download, QrCode, Pencil, X, Save } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { Student } from '../../lib/types';
import { toast } from 'sonner';
import QRCode from 'qrcode';

const EMPTY_FORM = { student_code: '', full_name: '', email: '', phone: '', college_id: '', room_number: '', hostel_block: '' };

export default function AdminStudents() {
  const [students, setStudents] = useState<Student[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<'add' | 'edit' | null>(null);
  const [selected, setSelected] = useState<Student | null>(null);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [saving, setSaving] = useState(false);
  const [qrModal, setQrModal] = useState<{ name: string; dataUrl: string } | null>(null);

  useEffect(() => { loadStudents(); }, []);

  async function loadStudents() {
    const { data } = await supabase.from('students').select('*').eq('role', 'student').order('created_at', { ascending: false });
    setStudents(data ?? []);
    setLoading(false);
  }

  const filtered = students.filter(s =>
    s.full_name.toLowerCase().includes(search.toLowerCase()) ||
    s.student_code.toLowerCase().includes(search.toLowerCase()) ||
    (s.room_number ?? '').toLowerCase().includes(search.toLowerCase())
  );

  function openAdd() { setForm({ ...EMPTY_FORM }); setModal('add'); }
  function openEdit(s: Student) { setSelected(s); setForm({ student_code: s.student_code, full_name: s.full_name, email: s.email, phone: s.phone ?? '', college_id: s.college_id ?? '', room_number: s.room_number ?? '', hostel_block: s.hostel_block ?? '' }); setModal('edit'); }

  async function handleSave() {
    if (!form.student_code || !form.full_name || !form.email) { toast.error('Fill required fields'); return; }
    setSaving(true);

    if (modal === 'add') {
      // Create auth user first
      const { data: authData, error: authErr } = await supabase.auth.admin.createUser({ email: form.email, password: form.student_code, email_confirm: true });
      const userId = authData?.user?.id;

      const qrData = JSON.stringify({ studentId: crypto.randomUUID(), mealType: 'all' });
      const { error } = await supabase.from('students').insert({ ...form, role: 'student', user_id: userId ?? null, qr_code: qrData });
      if (error) { toast.error(error.message); setSaving(false); return; }
      toast.success('Student added');
    } else if (selected) {
      const { error } = await supabase.from('students').update({ ...form, updated_at: new Date().toISOString() }).eq('id', selected.id);
      if (error) { toast.error(error.message); setSaving(false); return; }
      toast.success('Student updated');
    }

    setSaving(false);
    setModal(null);
    loadStudents();
  }

  async function showQR(student: Student) {
    const payload = JSON.stringify({ studentId: student.id, studentCode: student.student_code });
    const dataUrl = await QRCode.toDataURL(payload, { width: 256, margin: 2 });
    setQrModal({ name: student.full_name, dataUrl });
  }

  function exportCSV() {
    const header = 'Student Code,Name,Email,Phone,College ID,Room,Block,Created\n';
    const rows = filtered.map(s => `${s.student_code},"${s.full_name}",${s.email},${s.phone ?? ''},${s.college_id ?? ''},${s.room_number ?? ''},${s.hostel_block ?? ''},${new Date(s.created_at).toLocaleDateString()}`).join('\n');
    const blob = new Blob([header + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'students.csv'; a.click();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Students</h1>
          <p className="text-gray-500 text-sm mt-1">{students.length} students registered</p>
        </div>
        <div className="flex gap-2">
          <button onClick={exportCSV} className="btn-secondary flex items-center gap-2">
            <Download className="w-4 h-4" />
            Export CSV
          </button>
          <button onClick={openAdd} className="btn-primary flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Add Student
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="card">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name, code, or room..." className="input-field pl-10" />
        </div>
      </div>

      {/* Table */}
      <div className="card p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-left text-xs font-semibold text-gray-500 px-6 py-4">Student</th>
                <th className="text-left text-xs font-semibold text-gray-500 px-4 py-4 hidden md:table-cell">Code</th>
                <th className="text-left text-xs font-semibold text-gray-500 px-4 py-4 hidden sm:table-cell">Room</th>
                <th className="text-left text-xs font-semibold text-gray-500 px-4 py-4 hidden lg:table-cell">Block</th>
                <th className="text-left text-xs font-semibold text-gray-500 px-4 py-4 hidden lg:table-cell">Phone</th>
                <th className="text-right text-xs font-semibold text-gray-500 px-6 py-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i} className="border-b border-gray-50">
                    <td className="px-6 py-4"><div className="h-10 bg-gray-100 rounded animate-pulse" /></td>
                    <td className="px-4 py-4 hidden md:table-cell"><div className="h-4 bg-gray-100 rounded animate-pulse" /></td>
                    <td className="px-4 py-4 hidden sm:table-cell"><div className="h-4 bg-gray-100 rounded animate-pulse" /></td>
                    <td className="px-4 py-4 hidden lg:table-cell"><div className="h-4 bg-gray-100 rounded animate-pulse" /></td>
                    <td className="px-4 py-4 hidden lg:table-cell"><div className="h-4 bg-gray-100 rounded animate-pulse" /></td>
                    <td className="px-6 py-4" />
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-400">
                    <p className="text-sm">No students found</p>
                  </td>
                </tr>
              ) : filtered.map(student => (
                <tr key={student.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-red-600 font-bold text-xs">{student.full_name.charAt(0)}</span>
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900 text-sm">{student.full_name}</p>
                        <p className="text-xs text-gray-500">{student.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4 hidden md:table-cell text-sm text-gray-600 font-mono">{student.student_code}</td>
                  <td className="px-4 py-4 hidden sm:table-cell text-sm text-gray-600">{student.room_number || '—'}</td>
                  <td className="px-4 py-4 hidden lg:table-cell text-sm text-gray-600">{student.hostel_block || '—'}</td>
                  <td className="px-4 py-4 hidden lg:table-cell text-sm text-gray-600">{student.phone || '—'}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => showQR(student)} title="Show QR" className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                        <QrCode className="w-4 h-4" />
                      </button>
                      <button onClick={() => openEdit(student)} title="Edit" className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                        <Pencil className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit Modal */}
      {modal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-gray-900">{modal === 'add' ? 'Add Student' : 'Edit Student'}</h2>
              <button onClick={() => setModal(null)} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-4">
              {[
                { label: 'Student Code *', key: 'student_code', placeholder: 'e.g., STU001', type: 'text' },
                { label: 'Full Name *', key: 'full_name', placeholder: 'Enter full name', type: 'text' },
                { label: 'Email *', key: 'email', placeholder: 'student@email.com', type: 'email' },
                { label: 'Phone', key: 'phone', placeholder: 'Enter phone', type: 'tel' },
                { label: 'College ID', key: 'college_id', placeholder: 'e.g., CS2024001', type: 'text' },
                { label: 'Room Number', key: 'room_number', placeholder: 'e.g., 101', type: 'text' },
                { label: 'Hostel Block', key: 'hostel_block', placeholder: 'e.g., Block A', type: 'text' },
              ].map(field => (
                <div key={field.key}>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{field.label}</label>
                  <input
                    type={field.type}
                    value={(form as any)[field.key]}
                    onChange={e => setForm({ ...form, [field.key]: e.target.value })}
                    placeholder={field.placeholder}
                    className="input-field"
                    disabled={modal === 'edit' && field.key === 'email'}
                  />
                </div>
              ))}
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setModal(null)} className="btn-secondary flex-1">Cancel</button>
              <button onClick={handleSave} disabled={saving} className="btn-primary flex-1 flex items-center justify-center gap-2">
                {saving ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save className="w-4 h-4" />}
                {modal === 'add' ? 'Add Student' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* QR Modal */}
      {qrModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={() => setQrModal(null)}>
          <div className="bg-white rounded-2xl p-6 max-w-xs w-full text-center" onClick={e => e.stopPropagation()}>
            <h3 className="font-bold text-gray-900 mb-1">{qrModal.name}</h3>
            <p className="text-sm text-gray-500 mb-4">Student QR Code</p>
            <img src={qrModal.dataUrl} alt="QR" className="w-48 h-48 mx-auto" />
            <button onClick={() => setQrModal(null)} className="mt-4 btn-primary w-full">Close</button>
          </div>
        </div>
      )}
    </div>
  );
}
