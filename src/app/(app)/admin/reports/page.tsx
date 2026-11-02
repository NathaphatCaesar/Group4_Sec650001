import { notFound } from 'next/navigation';
import { ReportBoard } from '@/components/ReportBoard';
import { getMe, getReports } from '@/lib/data';
import { getT } from '@/lib/i18n/server';
import { DEFAULT_REPORT_FILTERS, parseReportFilters, type ReportPage } from '@/lib/types';

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

  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(sp)) {
    const first = Array.isArray(value) ? value[0] : value;
    if (first !== undefined) params.set(key, first);
  }
  // เปิดหน้าโดยไม่ระบุสถานะ = ดูคิวที่รอตรวจ, URL ผิดรูปแบบ = กลับไปค่าเริ่มต้น
  if (!params.get('status')) params.set('status', 'pending');
  const filters = parseReportFilters(params) ?? DEFAULT_REPORT_FILTERS;

  let initialData: ReportPage | null = null;
  try {
    initialData = await getReports(filters);
  } catch (err) {
    console.error('[admin/reports] load failed', err);
  }

  return (
    <div className="mx-auto flex w-full max-w-[680px] flex-col gap-3">
      <h1 className="px-1 text-lg font-bold">{t('คิวรายงาน')}</h1>
      <ReportBoard
        initialFilters={{ ...filters, page: initialData?.page ?? filters.page }}
        initialData={initialData}
      />
    </div>
  );
}
