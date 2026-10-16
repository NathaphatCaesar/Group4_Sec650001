import { Inbox, type LucideIcon } from 'lucide-react';

export function Empty({
  icon: Icon = Inbox, title, hint,
}: { icon?: LucideIcon; title: string; hint?: string }) {
  return (
    <div className="card grid place-items-center gap-1 px-6 py-14 text-center">
      <Icon size={32} strokeWidth={1.5} className="mb-1 text-ink-soft opacity-60" aria-hidden />
      <p className="font-semibold">{title}</p>
      {hint ? <p className="max-w-sm text-sm text-ink-soft">{hint}</p> : null}
    </div>
  );
}
