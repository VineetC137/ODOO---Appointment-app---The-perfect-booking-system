import React from 'react';

interface InputProps {
  label?: string;
  type?: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  error?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  icon?: React.ReactNode;
}

const Input: React.FC<InputProps> = ({
  label, type = 'text', value, onChange, placeholder, error,
  required = false, disabled = false, className = '', icon,
}) => (
  <div className={`mb-4 ${className}`}>
    {label && (
      <label className="block text-sm font-medium text-gray-700 mb-1.5">
        {label}{required && <span className="text-red-500 ml-1">*</span>}
      </label>
    )}
    <div className="relative">
      {icon && <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">{icon}</div>}
      <input type={type} value={value} onChange={onChange} placeholder={placeholder}
        disabled={disabled} required={required}
        className={`w-full ${icon ? 'pl-10' : 'pl-4'} pr-4 py-2.5 border rounded-xl text-sm transition-all focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent
          ${error ? 'border-red-400 bg-red-50' : 'border-gray-200 bg-white hover:border-gray-300'}
          ${disabled ? 'bg-gray-50 cursor-not-allowed text-gray-400' : ''}`} />
    </div>
    {error && <p className="mt-1 text-xs text-red-500 flex items-center gap-1">⚠ {error}</p>}
  </div>
);
export default Input;
