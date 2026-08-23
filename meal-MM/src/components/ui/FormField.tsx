import { ReactNode } from 'react';

interface FormFieldProps {
  label: string;
  required?: boolean;
  error?: string;
  helperText?: string;
  children: ReactNode;
  htmlFor?: string;
}

export default function FormField({ label, required, error, helperText, children, htmlFor }: FormFieldProps) {
  return (
    <div>
      <label htmlFor={htmlFor} className="block text-sm font-medium text-slate-700 mb-1">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {children}
      {error ? (
        <p className="text-xs text-red-600 mt-1">{error}</p>
      ) : helperText ? (
        <p className="text-xs text-gray-400 mt-1">{helperText}</p>
      ) : null}
    </div>
  );
}
