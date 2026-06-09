import { useState, useEffect } from 'react';
import { User, Phone, Mail, Home, Hash, BookOpen, Save, Pencil } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { Student } from '../../lib/types';
import { toast } from 'sonner';

export default function StudentProfile() {
  const { profile, refreshProfile } = useAuth();
  const student = profile as Student;
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ phone: '', room_number: '', hostel_block: '' });

  useEffect(() => {
    if (student) {
      setForm({
        phone: student.phone ?? '',
        room_number: student.room_number ?? '',
        hostel_block: student.hostel_block ?? '',
      });
    }
  }, [student]);

  async function handleSave() {
    setSaving(true);
    const { error } = await supabase
      .from('students')
      .update({ phone: form.phone, room_number: form.room_number, hostel_block: form.hostel_block, updated_at: new Date().toISOString() })
      .eq('id', student.id);

    setSaving(false);
    if (error) { toast.error('Failed to update profile'); return; }
    toast.success('Profile updated successfully');
    setEditing(false);
    await refreshProfile();
  }

  if (!student) return null;

  const infoItems = [
    { label: 'Student Code', value: student.student_code, icon: Hash, readonly: true },
    { label: 'Full Name', value: student.full_name, icon: User, readonly: true },
    { label: 'Email', value: student.email, icon: Mail, readonly: true },
    { label: 'Role', value: student.role, icon: User, readonly: true },
    { label: 'College ID', value: student.college_id ?? '—', icon: BookOpen, readonly: true },
  ];

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Profile</h1>
          <p className="text-gray-500 text-sm mt-1">View and manage your personal information</p>
        </div>
        {!editing ? (
          <button onClick={() => setEditing(true)} className="btn-outline flex items-center gap-2">
            <Pencil className="w-4 h-4" />
            Edit
          </button>
        ) : (
          <div className="flex gap-2">
            <button onClick={() => setEditing(false)} className="btn-secondary">Cancel</button>
            <button onClick={handleSave} disabled={saving} className="btn-primary flex items-center gap-2">
              {saving ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save className="w-4 h-4" />}
              Save
            </button>
          </div>
        )}
      </div>

      {/* Avatar + name */}
      <div className="card flex items-center gap-5">
        <div className="w-16 h-16 bg-gradient-to-br from-red-500 to-red-600 rounded-2xl flex items-center justify-center shadow-lg shadow-red-200">
          <span className="text-white font-bold text-2xl">{student.full_name.charAt(0)}</span>
        </div>
        <div>
          <h2 className="text-xl font-bold text-gray-900">{student.full_name}</h2>
          <p className="text-gray-500 text-sm">{student.email}</p>
          <span className="inline-flex items-center mt-1 px-2.5 py-0.5 bg-red-100 text-red-700 text-xs font-semibold rounded-full capitalize">
            {student.role}
          </span>
        </div>
      </div>

      {/* Personal Information */}
      <div className="card">
        <div className="flex items-center gap-2 mb-5">
          <User className="w-5 h-5 text-red-600" />
          <h3 className="font-bold text-gray-900">Personal Information</h3>
        </div>
        <div className="space-y-4">
          {infoItems.map(item => (
            <div key={item.label} className="flex items-center gap-4 py-3 border-b border-gray-50 last:border-0">
              <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <item.icon className="w-4 h-4 text-gray-500" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-gray-500 font-medium">{item.label}</p>
                <p className="text-sm font-semibold text-gray-900 mt-0.5">{item.value}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Editable Information */}
      <div className="card">
        <div className="flex items-center gap-2 mb-5">
          <Home className="w-5 h-5 text-red-600" />
          <h3 className="font-bold text-gray-900">Contact & Room Details</h3>
        </div>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Phone Number</label>
            {editing ? (
              <input
                type="tel"
                value={form.phone}
                onChange={e => setForm({ ...form, phone: e.target.value })}
                placeholder="Enter phone number"
                className="input-field"
              />
            ) : (
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <Phone className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-900">{student.phone || '—'}</span>
              </div>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Room Number</label>
            {editing ? (
              <input
                type="text"
                value={form.room_number}
                onChange={e => setForm({ ...form, room_number: e.target.value })}
                placeholder="e.g., 101"
                className="input-field"
              />
            ) : (
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <Home className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-900">{student.room_number || '—'}</span>
              </div>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Hostel Block</label>
            {editing ? (
              <input
                type="text"
                value={form.hostel_block}
                onChange={e => setForm({ ...form, hostel_block: e.target.value })}
                placeholder="e.g., Block A"
                className="input-field"
              />
            ) : (
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <Home className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-900">{student.hostel_block || '—'}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      <p className="text-xs text-gray-400 text-center">
        Account created on {new Date(student.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
      </p>
    </div>
  );
}
