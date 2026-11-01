import Link from 'next/link';
import { redirect } from 'next/navigation';
import clsx from 'clsx';
import { StudySessionList } from '@/components/StudySessionList';
import { getMe, getMyStudySessions } from '@/lib/data';
import { getT } from '@/lib/i18n/server';

export const dynamic = 'force-dynamic';
export async function generateMetadata() {
  const t = await getT();
  return { title: `${t('นัดติวของฉัน')} — BACKHOME TU` };
}

export default async function StudyPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [t, me, sp] = await Promise.all([getT(), getMe(), searchParams]);
  if (!me) redirect('/login');

  const view = sp.view === 'joined' ? 'joined' : 'owned';
  const { owned, joined } = await getMyStudySessions();
  const pending = owned.reduce((n, s) => n + s.pending_count, 0);

  const tabs = [
    { key: 'owned', label: pending ? `${t('นัดที่ฉันสร้าง')} (${pending})` : t('นัดที่ฉันสร้าง'), href: '/study' },
    { key: 'joined', label: t('นัดที่ฉันเข้าร่วม'), href: '/study?view=joined' },
  ];

  return (
    <div className="mx-auto flex w-full max-w-[680px] flex-col gap-3">
      <h1 className="px-1 text-xl font-bold">{t('นัดติวของฉัน')}</h1>

      <nav className="flex gap-2">
        {tabs.map((tab) => (
          <Link
            key={tab.key}
            href={tab.href}
            className={clsx('chip px-3.5 py-1.5 text-sm', view === tab.key ? 'bg-brand-50 text-brand-700 font-semibold' : 'text-ink-soft')}
          >
            {tab.label}
          </Link>
        ))}
      </nav>

      <StudySessionList sessions={view === 'owned' ? owned : joined} view={view} />
    </div>
  );
}
