import { InputHTMLAttributes, forwardRef, SelectHTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface FieldWrapperProps {
  label?: string;
  error?: string;
  hint?: string;
  children: ReactNode;
  htmlFor?: string;
}

export function Field({ label, error, hint, children, htmlFor }: FieldWrapperProps): JSX.Element {
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={htmlFor} className="text-sm font-medium text-ink">
          {label}
        </label>
      )}
      {children}
      {error ? (
        <p className="text-caption text-[#B91C1C]">{error}</p>
      ) : hint ? (
        <p className="text-caption text-muted">{hint}</p>
      ) : null}
    </div>
  );
}

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { className, error, ...props },
  ref,
) {
  return (
    <input
      ref={ref}
      className={cn(
        'h-10 rounded-md border bg-white px-3 text-body text-ink placeholder:text-muted',
        'focus:outline-none focus:ring-2 focus:ring-brand/40 focus:border-brand',
        error ? 'border-[#B91C1C]' : 'border-border',
        className,
      )}
      {...props}
    />
  );
});

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  error?: boolean;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { className, error, children, ...props },
  ref,
) {
  return (
    <select
      ref={ref}
      className={cn(
        'h-10 rounded-md border bg-white px-3 text-body text-ink',
        'focus:outline-none focus:ring-2 focus:ring-brand/40 focus:border-brand',
        error ? 'border-[#B91C1C]' : 'border-border',
        className,
      )}
      {...props}
    >
      {children}
    </select>
  );
});
