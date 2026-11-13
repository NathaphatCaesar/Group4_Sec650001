import { notFound } from 'next/navigation';
import { getMe } from '@/lib/data';
import CommentsSection from './CommentsSection';

export const dynamic = 'force-dynamic';

export default async function PostCommentsPage({
  params,
}: {
  params: Promise<{ postId: string }>;
}) {
  const [{ postId }, me] = await Promise.all([params, getMe()]);

  if (!me) notFound();

  return (
    <div className="mx-auto flex w-full max-w-[680px] flex-col gap-3">
      <section className="card px-5 py-4">
        <h1 className="text-lg font-bold">ความคิดเห็น</h1>
        <p className="mt-1 text-sm text-ink-soft">
          แสดงความคิดเห็นและพูดคุยเกี่ยวกับโพสต์นี้
        </p>
      </section>

      <CommentsSection postId={postId} meId={me.id} isAdmin={me.role === 'admin'} />
    </div>
  );
}