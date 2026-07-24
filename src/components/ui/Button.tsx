import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'outline' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  id?: string;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  className = '',
  id,
  ...props
}) => {
  const baseStyle = 'inline-flex items-center justify-center font-sans font-medium rounded-lg transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed outline-hidden';
  
  const variants = {
    primary: 'bg-accent-purple text-text-primary hover:bg-accent-purple/90 active:scale-95 shadow-[0_0_15px_rgba(139,92,246,0.15)] hover:shadow-[0_0_20px_rgba(139,92,246,0.25)] border border-accent-purple/20',
    secondary: 'bg-hover-bg text-text-primary hover:bg-hover-bg/80 border border-border-accent active:scale-95',
    outline: 'bg-transparent text-text-secondary hover:text-text-primary hover:bg-hover-bg border border-border-accent active:scale-95',
    danger: 'bg-status-error/10 hover:bg-status-error/20 text-status-error border border-status-error/20 active:scale-95',
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-4 py-2 text-sm',
    lg: 'px-5 py-2.5 text-base',
  };

  return (
    <button
      id={id}
      className={`${baseStyle} ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};
