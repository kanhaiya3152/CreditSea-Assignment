import { AlertTriangle, Inbox, Loader2 } from 'lucide-react';

export function LoadingState({ label = 'Loading...' }: { label?: string }): JSX.Element {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-16 text-muted">
      <Loader2 className="h-5 w-5 animate-spin" />
      <p className="text-caption">{label}</p>
    </div>
  );
}

export function EmptyState({ title, description }: { title: string; description?: string }): JSX.Element {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-16 text-center">
      <Inbox className="h-6 w-6 text-muted" />
      <p className="text-body font-medium text-ink">{title}</p>
      {description && <p className="max-w-sm text-caption text-muted">{description}</p>}
    </div>
  );
}

export function ErrorState({ message }: { message: string }): JSX.Element {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-16 text-center">
      <AlertTriangle className="h-6 w-6 text-[#B91C1C]" />
      <p className="max-w-sm text-body text-ink">{message}</p>
    </div>
  );
}
