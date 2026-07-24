import React, { forwardRef } from 'react';

// --- LABEL ---
export interface LabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {
  children: React.ReactNode;
  className?: string;
}

export const Label: React.FC<LabelProps> = ({ children, className = '', ...props }) => {
  return (
    <label className={`block text-xs font-medium text-text-secondary mb-1.5 ${className}`} {...props}>
      {children}
    </label>
  );
};

// --- INPUT ---
export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  className?: string;
  id?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className = '', id, ...props }, ref) => {
    return (
      <input
        id={id}
        ref={ref}
        className={`w-full bg-hover-bg/50 hover:bg-hover-bg/70 border border-border-accent rounded-lg px-3 py-2 text-sm text-text-primary placeholder:text-text-tertiary focus:outline-hidden focus:border-accent-purple/50 focus:bg-hover-bg focus:ring-1 focus:ring-accent-purple/30 transition-all duration-200 ${className}`}
        {...props}
      />
    );
  }
);

Input.displayName = 'Input';

// --- TEXTAREA ---
export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  className?: string;
  id?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className = '', id, ...props }, ref) => {
    return (
      <textarea
        id={id}
        ref={ref}
        className={`w-full bg-hover-bg/50 hover:bg-hover-bg/70 border border-border-accent rounded-lg px-3 py-2 text-sm text-text-primary placeholder:text-text-tertiary focus:outline-hidden focus:border-accent-purple/50 focus:bg-hover-bg focus:ring-1 focus:ring-accent-purple/30 transition-all duration-200 min-h-[100px] resize-y ${className}`}
        {...props}
      />
    );
  }
);

Textarea.displayName = 'Textarea';

// --- SELECT ---
export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  children: React.ReactNode;
  className?: string;
  id?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ children, className = '', id, ...props }, ref) => {
    return (
      <select
        id={id}
        ref={ref}
        className={`w-full bg-hover-bg/50 hover:bg-hover-bg/70 border border-border-accent rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-hidden focus:border-accent-purple/50 focus:bg-hover-bg focus:ring-1 focus:ring-accent-purple/30 transition-all duration-200 cursor-pointer ${className}`}
        {...props}
      >
        {children}
      </select>
    );
  }
);

Select.displayName = 'Select';
