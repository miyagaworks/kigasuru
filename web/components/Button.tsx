import React from 'react';

/**
 * Button component optimized for outdoor use and glove operation
 * Minimum tap area: 48x48px
 */
export const Button = ({
  children,
  onClick,
  variant = 'primary',
  size = 'md',
  disabled = false,
  className = '',
  ...props
}: {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'danger';
  size?: 'sm' | 'md' | 'lg' | 'icon';
  disabled?: boolean;
  className?: string;
  type?: 'button' | 'submit' | 'reset';
}) => {
  const baseStyles = 'rounded-lg font-medium transition-all duration-200 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed';

  const variants = {
    primary: 'bg-[var(--color-primary-green)] text-white hover:bg-[var(--color-primary-dark)] shadow-md',
    secondary: 'bg-[var(--color-secondary-blue)] text-white hover:opacity-90 shadow-md',
    outline: 'bg-[var(--color-card-bg)] border-2 border-[var(--color-primary-green)] text-[var(--color-primary-green)] hover:bg-[var(--color-neutral-100)]',
    danger: 'bg-[var(--color-secondary-red)] text-white hover:opacity-90 shadow-md',
  };

  const sizes = {
    sm: 'px-4 py-2 text-sm min-h-[48px] min-w-[48px]',
    md: 'px-6 py-3 text-base min-h-[48px] min-w-[48px]',
    lg: 'px-8 py-4 text-lg min-h-[56px] min-w-[56px]',
    icon: 'p-3 min-h-[48px] min-w-[48px]',
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};
