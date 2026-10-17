'use client';

import { PostCard } from '@/components/PostCard';
import { Empty } from '@/components/Empty';
import { useT } from '@/lib/i18n/client';
import type { Post } from '@/lib/types';

export function FeedList({
  initial, meId, isAdmin, emptyTitle, emptyHint,
}: {
  initial: Post[];
  meId: string | null;
  isAdmin?: boolean;
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

  return (
    <div className="flex flex-col gap-3">
      {initial.map((post) => (
        <PostCard key={post.id} post={post} meId={meId} isAdmin={isAdmin} dense />
      ))}
      <p className="py-6 text-center text-xs text-ink-soft">{t('— หมดแล้ว เลื่อนขึ้นไปโพสต์อะไรหน่อยไหม —')}</p>
    </div>
  );
}
