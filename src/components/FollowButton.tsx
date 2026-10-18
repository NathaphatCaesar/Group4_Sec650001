'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import clsx from 'clsx';
import { useT } from '@/lib/i18n/client';

export function FollowButton({
  targetId, initial, size = 'sm',
}: { targetId: string; initial: boolean; size?: 'sm' | 'md' }) {
  const t = useT();
  const router = useRouter();
  const [following, setFollowing] = useState(initial);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function toggle() {
    const was = following;
    setFollowing(!was);
    setError(null);
    startTransition(async () => {
      try {
        const res = await fetch('/api/follow', {
          method: was ? 'DELETE' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ targetUserId: targetId }),
        });
        const json = (await res.json()) as { following?: boolean; error?: string };
        if (!res.ok) {
          setFollowing(was);
          setError(t(json.error ?? 'บันทึกการติดตามไม่สำเร็จ'));
          return;
        }
        setFollowing(Boolean(json.following));
        router.refresh();
      } catch {
        setFollowing(was);
        setError(t('บันทึกการติดตามไม่สำเร็จ'));
      }
    });
  }

  return (
    <span className="flex flex-col items-end gap-1">
      <button
        type="button"
        disabled={pending}
        onClick={toggle}
        className={clsx(
          following ? 'btn-outline' : 'btn-primary',
          size === 'sm' ? 'px-3.5 py-1.5 text-xs' : 'px-5 py-2 text-sm',
        )}
      >
        {following ? t('กำลังติดตาม') : t('ติดตาม')}
      </button>
      {error ? <span className="text-[11px] text-brand-700">{error}</span> : null}
    </span>
  );
}
