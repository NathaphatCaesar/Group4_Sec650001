import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Users, FileText, BookOpen, Flag, Search, ArrowRight } from 'lucide-react';
import { AdminUserTable } from '@/components/AdminUserTable';
import { getMe } from '@/lib/data';
import { getAdminStats, getPostsPerDay, getReportSummary, searchUsersForAdmin } from '@/lib/admin';
import { REPORT_REASONS, REPORT_REASON_ORDER } from '@/lib/types';
import { compact } from '@/lib/utils';
import { getT } from '@/lib/i18n/server';

export const dynamic = 'force-dynamic';
export async function generateMetadata() {
  const t = await getT();
  return { title: `${t('แดชบอร์ด')} — BACKHOME TU` };
}

export default async function AdminDashboardPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [t, me, sp] = await Promise.all([getT(), getMe(), searchParams]);
  if (!me || me.role !== 'admin') notFound();

  const q = typeof sp.q === 'string' ? sp.q : '';
  const [stats, summary, daily, users] = await Promise.all([
    getAdminStats(),
    getReportSummary(),
    getPostsPerDay(14),
    searchUsersForAdmin(q),
  ]);

  const cards = [
    { label: t('ผู้ใช้ทั้งหมด'), value: stats.users, sub: t('+{n} ใน 7 วัน', { n: stats.usersNew7d }), Icon: Users },
    { label: t('โพสต์ทั้งหมด'), value: stats.posts, sub: t('+{n} ใน 7 วัน', { n: stats.postsNew7d }), Icon: FileText },
    { label: t('ชีทสรุป'), value: stats.sheets, sub: null, Icon: BookOpen },
    { label: t('รายงานรอตรวจ'), value: stats.pendingReports, sub: t('ระงับอยู่ {n} บัญชี', { n: stats.suspended }), Icon: Flag },
  ];

  const maxDaily = Math.max(1, ...daily.map((d) => d.count));
  const maxReason = Math.max(1, ...Object.values(summary.byReason));

  return (
    <div className="mx-auto flex w-full max-w-[880px] flex-col gap-4">
      <h1 className="px-1 text-xl font-bold">{t('แดชบอร์ด')}</h1>

      <section className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {cards.map(({ label, value, sub, Icon }) => (
          <div key={label} className="card p-4">
            <p className="flex items-center gap-1.5 text-xs text-ink-soft">
              <Icon size={14} aria-hidden /> {label}
            </p>
            <p className="mt-1 text-2xl font-bold tabular-nums">{compact(value)}</p>
            {sub ? <p className="text-xs text-ink-soft">{sub}</p> : null}
          </div>
        ))}
      </section>

      <section className="card p-4">
        <h2 className="mb-3 text-sm font-semibold">{t('โพสต์ใหม่ 14 วันล่าสุด')}</h2>
        <div className="flex h-36 items-end gap-1" role="list">
          {daily.map((d) => (
            <div
              key={d.date}
              role="listitem"
              className="group flex h-full flex-1 flex-col items-center justify-end gap-1"
              title={`${d.date}: ${d.count}`}
            >
              <span className="text-[10px] tabular-nums text-ink-soft">{d.count || ''}</span>
              <div
                className="w-full rounded-t-md bg-brand-400 group-hover:bg-brand-500"
                style={{ height: `${(d.count / maxDaily) * 100}%`, minHeight: d.count ? 4 : 1 }}
              />
              <span className="text-[10px] tabular-nums text-ink-soft">{d.date.slice(8)}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="card p-4">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold">{t('สรุปรายงาน')}</h2>
          <Link href="/admin/reports" className="inline-flex items-center gap-1 text-xs font-medium text-brand-700 hover:underline">
            {t('ไปที่คิวรายงาน')} <ArrowRight size={13} />
          </Link>
        </div>
        <div className="mb-4 flex flex-wrap gap-2 text-xs">
          <span className="chip bg-amber-50 px-2.5 py-1 text-amber-800">{t('รอตรวจ')} {summary.byStatus.pending}</span>
          <span className="chip bg-brand-50 px-2.5 py-1 text-brand-700">{t('จัดการแล้ว')} {summary.byStatus.actioned}</span>
          <span className="chip bg-stone-100 px-2.5 py-1 text-stone-700">{t('ไม่ผิดกฎ')} {summary.byStatus.dismissed}</span>
        </div>
        <ul className="flex flex-col gap-2">
          {REPORT_REASON_ORDER.map((reason) => {
            const n = summary.byReason[reason];
            return (
              <li key={reason} className="grid grid-cols-[minmax(0,9rem)_1fr_2rem] items-center gap-2 text-xs">
                <span className="truncate text-ink-soft">{t(REPORT_REASONS[reason].short)}</span>
                <div className="h-2 overflow-hidden rounded-full bg-[color:var(--color-canvas)]">
                  <div className="h-full rounded-full bg-brand-400" style={{ width: `${(n / maxReason) * 100}%` }} />
                </div>
                <span className="text-right tabular-nums">{n}</span>
              </li>
            );
          })}
        </ul>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="px-1 text-sm font-semibold">{t('จัดการผู้ใช้')}</h2>
        <form action="/admin" className="relative">
          <Search size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-soft" aria-hidden />
          <input
            name="q"
            defaultValue={q}
            placeholder={t('ค้นหาชื่อ ชื่อผู้ใช้ หรือรหัสนักศึกษา')}
            className="input w-full pl-10"
          />
        </form>
        {!q ? <p className="px-1 text-xs text-ink-soft">{t('ผู้ใช้ที่สมัครล่าสุด')}</p> : null}
        <AdminUserTable users={users} meId={me.id} />
      </section>
    </div>
  );
}
