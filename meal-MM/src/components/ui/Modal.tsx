import { ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  maxWidth?: string;
  footer?: ReactNode;
}

export default function Modal({ open, onClose, title, children, maxWidth = 'max-w-md', footer }: ModalProps) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 8 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            className={`bg-white rounded-2xl w-full ${maxWidth} shadow-2xl max-h-[90vh] overflow-y-auto`}
            onClick={e => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label={title}
          >
            {title && (
              <div className="flex items-center justify-between px-6 pt-6 pb-4">
                <h2 className="text-lg font-bold text-slate-900">{title}</h2>
                <button onClick={onClose} aria-label="Close dialog" className="btn-icon">
                  <X className="w-5 h-5" />
                </button>
              </div>
            )}
            <div className={title ? 'px-6 pb-6' : 'p-6'}>{children}</div>
            {footer && <div className="px-6 pb-6 flex gap-3">{footer}</div>}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
