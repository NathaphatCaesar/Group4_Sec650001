import { Suspense } from 'react';
import { FeedToolbar } from '@/components/FeedToolbar';
import { FeedList } from '@/components/FeedList';
import { RightRail } from '@/components/RightRail';
import { getFeed, getMe, getSubjects, getFaculties } from '@/lib/data';
import type { FeedScope, FeedSort, PostTag } from '@/lib/types';

export const dynamic = 'force-dynamic';

const TAGS: PostTag[] = ['sheet', 'studybuddy', 'qa', 'poll', 'announce', 'general'];
const SCOPES: FeedScope[] = ['all', 'following', 'bookmarks'];

export default async function FeedPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const pick = (k: string) => (Array.isArray(sp[k]) ? sp[k][0] : sp[k]) as string | undefined;

  const me = await getMe();
  if (!me) return null;

  const tagParam = pick('tag');
  const scopeParam = pick('scope');
  const [subjects, faculties] = await Promise.all([getSubjects(), getFaculties()]);

  const params = {
    tag: TAGS.includes(tagParam as PostTag) ? (tagParam as PostTag) : null,
    subject: pick('subject') ?? null,
    group: pick('group') ?? null,
    faculty: pick('faculty') ?? null,
    scope: SCOPES.includes(scopeParam as FeedScope) ? (scopeParam as FeedScope) : ('all' as FeedScope),
    sort: (pick('sort') === 'top' ? 'top' : 'new') as FeedSort,
    limit: 20,
    offset: 0,
  };

  const posts = await getFeed(params);

  return (
    <div className="flex gap-6">
      <div className="mx-auto flex w-full max-w-[640px] flex-col gap-3">
        <Suspense fallback={<div className="skeleton h-11 w-full" />}>
          <FeedToolbar subjects={subjects} faculties={faculties} />
        </Suspense>

        <FeedList
          initial={posts}
          meId={me.id}
          isAdmin={me.role === 'admin'}
          emptyTitle={
            params.scope === 'bookmarks' ? 'ยังไม่มีโพสต์ที่บันทึกไว้'
              : params.scope === 'following' ? 'คนที่คุณติดตามยังไม่ได้โพสต์'
              : 'ยังไม่มีโพสต์ตรงนี้'
          }
          emptyHint="เป็นคนแรกที่โพสต์เลย"
        />
      </div>

      <RightRail me={me} />
    </div>
  );
}
