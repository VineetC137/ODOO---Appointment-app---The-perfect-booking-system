import React from 'react';

interface ButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  type?: 'button' | 'submit' | 'reset';
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  fullWidth?: boolean;
  className?: string;
}

const Button: React.FC<ButtonProps> = ({
  children, onClick, type = 'button', variant = 'primary',
  size = 'md', disabled = false, fullWidth = false, className = '',
}) => {
  const base = 'inline-flex items-center justify-center font-semibold rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';
  const variants = {
    primary:   'bg-primary-500 text-white hover:bg-primary-600 focus:ring-primary-400 shadow-sm hover:shadow-md',
    secondary: 'border-2 border-primary-500 text-primary-600 hover:bg-primary-50 focus:ring-primary-400',
    ghost:     'text-gray-600 hover:bg-gray-100 focus:ring-gray-300',
    danger:    'bg-red-500 text-white hover:bg-red-600 focus:ring-red-400 shadow-sm',
  };
  const sizes = { sm: 'px-3 py-1.5 text-sm gap-1.5', md: 'px-5 py-2.5 text-sm gap-2', lg: 'px-6 py-3 text-base gap-2' };
  return (
    <button type={type} onClick={onClick} disabled={disabled}
      className={`${base} ${variants[variant]} ${sizes[size]} ${fullWidth ? 'w-full' : ''} ${className}`}>
      {children}
    </button>
  );
};
export default Button;
