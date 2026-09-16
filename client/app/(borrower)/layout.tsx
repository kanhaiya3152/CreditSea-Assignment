import { ApplyProvider } from '@/lib/ApplyContext';

export default function BorrowerLayout({ children }: { children: React.ReactNode }): JSX.Element {
  return <ApplyProvider>{children}</ApplyProvider>;
}
