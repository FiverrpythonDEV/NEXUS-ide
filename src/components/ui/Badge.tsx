import React from 'react';

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  children: React.ReactNode;
  variant?: 'primary' | 'success' | 'warning' | 'error' | 'neutral';
  className?: string;
  id?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'neutral',
  className = '',
  id,
  ...props
}) => {
  const baseStyle = 'inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-medium tracking-wide font-sans border';
  
  const variants = {
    primary: 'bg-accent-purple/10 text-accent-purple border-accent-purple/20',
    success: 'bg-status-success/10 text-status-success border-status-success/20',
    warning: 'bg-status-warning/10 text-status-warning border-status-warning/20',
    error: 'bg-status-error/10 text-status-error border-status-error/20',
    neutral: 'bg-hover-bg text-text-secondary border-border-accent',
  };

  return (
    <span
      id={id}
      className={`${baseStyle} ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </span>
  );
};
