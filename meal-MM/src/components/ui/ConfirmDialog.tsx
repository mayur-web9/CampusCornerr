import { ReactNode } from 'react';
import { AlertTriangle } from 'lucide-react';
import Modal from './Modal';

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  danger = true,
  loading = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  return (
    <Modal open={open} onClose={onCancel} maxWidth="max-w-sm">
      <div className="flex items-center gap-3 mb-4">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${danger ? 'bg-red-50' : 'bg-orange-50'}`}>
          <AlertTriangle className={`w-5 h-5 ${danger ? 'text-red-600' : 'text-orange-600'}`} aria-hidden="true" />
        </div>
        <h2 className="text-lg font-bold text-slate-900">{title}</h2>
      </div>
      <div className="text-sm text-gray-600 mb-6">{description}</div>
      <div className="flex gap-3">
        <button onClick={onCancel} className="btn-secondary flex-1">{cancelLabel}</button>
        <button
          onClick={onConfirm}
          disabled={loading}
          className={`flex-1 flex items-center justify-center gap-2 ${danger ? 'btn-danger' : 'btn-warning'}`}
        >
          {loading && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
          {confirmLabel}
        </button>
      </div>
    </Modal>
  );
}
