import { notFound } from 'next/navigation';
import { getMe } from '@/lib/data';
import { getT } from '@/lib/i18n/server';
import { BackButton } from '@/components/BackButton';
import CommentsSection from './CommentsSection';

export const dynamic = 'force-dynamic';

export default async function PostCommentsPage({
  params,
}: {
  params: Promise<{ postId: string }>;
}) {
  const [{ postId }, me, t] = await Promise.all([params, getMe(), getT()]);

  if (!me) notFound();

  return (
    <div className="mx-auto flex w-full max-w-[680px] flex-col gap-3">
      <section className="card flex items-center gap-2 px-3 py-3">
        <BackButton />
        <div className="min-w-0">
          <h1 className="text-lg font-bold">{t('ความคิดเห็น')}</h1>
          <p className="text-sm text-ink-soft">
            {t('แสดงความคิดเห็นและพูดคุยเกี่ยวกับโพสต์นี้')}
          </p>
        </div>
      </section>

      <CommentsSection postId={postId} meId={me.id} isAdmin={me.role === 'admin'} />
    </div>
  );
}
