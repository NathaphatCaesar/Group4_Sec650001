'use client';

import { Empty } from '@/components/Empty';
import { useT } from '@/lib/i18n/client';
import type { Post } from '@/lib/types';

export function FeedList({
  initial, emptyTitle, emptyHint,
}: {
  initial: Post[];
  emptyTitle?: string;
  emptyHint?: string;
}) {
  const t = useT();

  if (!initial.length) {
    return (
      <Empty
        title={t(emptyTitle ?? 'ยังไม่มีโพสต์ตรงนี้')}
        hint={emptyHint ? t(emptyHint) : undefined}
      />
    );
  }

  return null;
}
