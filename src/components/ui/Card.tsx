import React from 'react';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  hoverable?: boolean;
  className?: string;
  id?: string;
}

export const Card: React.FC<CardProps> = ({
  children,
  hoverable = false,
  className = '',
  id,
  ...props
}) => {
  return (
    <div
      id={id}
      className={`glass-panel rounded-xl p-5 border border-border-accent/80 transition-all duration-200 ${
        hoverable ? 'glow-hover cursor-pointer' : ''
      } ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};
