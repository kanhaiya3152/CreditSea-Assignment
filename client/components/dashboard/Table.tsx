import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

export function Table({ children }: { children: ReactNode }): JSX.Element {
  return (
    <div className="overflow-x-auto rounded-lg border border-border bg-surface">
      <table className="w-full min-w-[640px] border-collapse text-left text-sm">{children}</table>
    </div>
  );
}

export function Thead({ children }: { children: ReactNode }): JSX.Element {
  return <thead className="border-b border-border bg-bg">{children}</thead>;
}

export function Th({ children, className }: { children: ReactNode; className?: string }): JSX.Element {
  return (
    <th className={cn('px-4 py-2.5 text-caption font-medium text-muted', className)}>
      {children}
    </th>
  );
}

export function Td({ children, className }: { children: ReactNode; className?: string }): JSX.Element {
  return <td className={cn('px-4 py-3 text-body text-ink', className)}>{children}</td>;
}

export function Tr({
  children,
  className,
  onClick,
}: {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
}): JSX.Element {
  return (
    <tr
      onClick={onClick}
      className={cn('border-b border-border last:border-0', onClick && 'cursor-pointer hover:bg-bg', className)}
    >
      {children}
    </tr>
  );
}
