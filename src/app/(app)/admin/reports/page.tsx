import Link from 'next/link';
import { notFound } from 'next/navigation';
import clsx from 'clsx';
import { ReportQueue } from '@/components/ReportQueue';
import { getMe, getReports } from '@/lib/data';
import { getT } from '@/lib/i18n/server';

export const dynamic = 'force-dynamic';
export async function generateMetadata() {
  const t = await getT();
  return { title: `${t('คิวรายงาน')} — BACKHOME TU` };
}

export default async function AdminReportsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [t, me, sp] = await Promise.all([getT(), getMe(), searchParams]);
  if (!me || me.role !== 'admin') notFound();

  const view = sp.view === 'closed' ? 'closed' : 'pending';
  const reports = await getReports(view);

  const tabs = [
    { key: 'pending', label: t('รอตรวจ'), href: '/admin/reports' },
    { key: 'closed', label: t('ปิดเคสแล้ว'), href: '/admin/reports?view=closed' },
  ];

  return (
    <div className="mx-auto flex w-full max-w-[680px] flex-col gap-3">
      <h1 className="px-1 text-lg font-bold">{t('คิวรายงาน')}</h1>

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

      <ReportQueue reports={reports} view={view} />
    </div>
  );
}
