'use client';

import clsx from 'clsx';
import { TAG_META, type PostTag } from '@/lib/types';
import { useT } from '@/lib/i18n/client';

export function TagChip({ tag, className }: { tag: PostTag; className?: string }) {
  const t = useT();
  const meta = TAG_META[tag];
  return (
    <span className={clsx('chip px-2.5 py-1 text-xs font-semibold', meta.tone, className)}>
      {t(meta.hash)}
    </span>
  );
}
