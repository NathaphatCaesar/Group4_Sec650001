'use client';

import { useState } from 'react';
import clsx from 'clsx';
import type { Poll } from '@/lib/types';
import { useT } from '@/lib/i18n/client';

export function PollView({ postId, poll: initial, canVote }: { postId: string; poll: Poll; canVote: boolean }) {
  const t = useT();
  const [poll, setPoll] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const voted = poll.my_option !== null;

  async function send(optionId: string | null) {
    if (!canVote || busy) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/posts/${postId}/vote`, {
        method: optionId ? 'POST' : 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: optionId ? JSON.stringify({ optionId }) : undefined,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'โหวตไม่สำเร็จ');
      if (data) setPoll(data);
    } catch (e) {
      setError(t(e instanceof Error ? e.message : 'เกิดข้อผิดพลาด'));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mt-3 flex flex-col gap-2">
      {poll.options.map((o) => {
        const pct = poll.total ? Math.round((o.votes / poll.total) * 100) : 0;
        const mine = poll.my_option === o.id;
        return (
          <button
            key={o.id}
            type="button"
            disabled={!canVote || busy}
            onClick={() => send(mine ? null : o.id)}
            className={clsx(
              'relative overflow-hidden rounded-xl border px-3.5 py-2.5 text-left text-sm transition',
              mine ? 'border-[color:var(--color-brand-500)] font-semibold' : 'border-[color:var(--color-line)]',
              canVote && 'hover:bg-black/5',
            )}
          >
            {voted ? (
              <span
                className="absolute inset-y-0 left-0 bg-[color:var(--color-brand-500)] opacity-15"
                style={{ width: `${pct}%` }}
              />
            ) : null}
            <span className="relative flex items-center justify-between gap-3">
              <span className="break-words">{o.label}</span>
              {voted ? <span className="shrink-0 tabular-nums">{pct}%</span> : null}
            </span>
          </button>
        );
      })}
      <p className="text-xs text-[color:var(--color-ink-soft)]">
        {t('{n} โหวต', { n: poll.total })}
        {' · '}
        {voted ? `${t('กดตัวเลือกอื่นเพื่อเปลี่ยน')} · ${t('ถอนโหวต')}` : t('กดเพื่อโหวตแล้วดูผล')}
      </p>
      {error ? <p className="text-xs text-rose-600">{error}</p> : null}
    </div>
  );
}
