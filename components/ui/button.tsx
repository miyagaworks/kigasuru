// components/ui/button.tsx
import * as React from 'react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'lg';
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className = '', variant = 'default', size = 'default', ...props }, ref) => {
    const baseStyles =
      'inline-flex items-center justify-center rounded-lg font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none';

    const variantStyles = {
      default: 'bg-[var(--color-primary-green)] text-white hover:bg-[var(--color-primary-dark)]',
      outline:
        'border-2 border-[var(--color-neutral-300)] bg-white hover:bg-[var(--color-neutral-100)] text-[var(--color-neutral-900)]',
      ghost: 'hover:bg-[var(--color-neutral-100)] text-[var(--color-neutral-900)]',
    };

    const sizeStyles = {
      default: 'h-10 px-4 py-2',
      sm: 'h-8 px-3 text-sm',
      lg: 'h-12 px-8 text-lg',
    };

    return (
      <button
        ref={ref}
        className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
        {...props}
      />
    );
  },
);

Button.displayName = 'Button';

export { Button };
