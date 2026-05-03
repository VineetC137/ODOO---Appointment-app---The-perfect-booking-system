import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  onClick?: () => void;
  hover?: boolean;
}

const Card: React.FC<CardProps> = ({ children, className = '', padding = 'md', onClick, hover = false }) => {
  const pads = { none: '', sm: 'p-4', md: 'p-6', lg: 'p-8' };
  return (
    <div onClick={onClick}
      className={`bg-white rounded-2xl border border-gray-100 shadow-sm ${hover ? 'hover:shadow-md hover:border-primary-200 transition-all duration-200' : ''} ${onClick ? 'cursor-pointer' : ''} ${pads[padding]} ${className}`}>
      {children}
    </div>
  );
};
export default Card;
