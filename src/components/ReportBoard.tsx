'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import clsx from 'clsx';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { ReportFilterBar, isDefaultReportView } from '@/components/ReportFilterBar';
import { ReportQueue } from '@/components/ReportQueue';
import { reportFiltersToQuery, type ReportFilters, type ReportPage } from '@/lib/types';
import { useT } from '@/lib/i18n/client';

// Task42: หน้าแรก render จากเซิร์ฟเวอร์ จากนั้นเปลี่ยนตัวกรอง/หน้าผ่าน GET /api/admin/reports
export function ReportBoard({
  initialFilters, initialData,
}: { initialFilters: ReportFilters; initialData: ReportPage | null }) {
  const t = useT();
  const pathname = usePathname();
  const [filters, setFilters] = useState(initialFilters);
  const [data, setData] = useState(initialData);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(initialData ? null : 'เกิดข้อผิดพลาด');
  const filtersRef = useRef(initialFilters);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => () => abortRef.current?.abort(), []);

  // ยกเลิกคำขอเก่าทุกครั้ง กันผลลัพธ์ที่ช้ากว่ามาทับตัวกรองล่าสุด
  const load = useCallback(async (target: ReportFilters) => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/reports?${reportFiltersToQuery(target)}`, {
        signal: controller.signal,
        cache: 'no-store',
      });
      const body = await res.json().catch(() => null);
      if (!res.ok || !body) {
        setError(body?.error ?? 'เกิดข้อผิดพลาด');
        return;
      }
      const result = body as ReportPage;
      // API อาจลดเลขหน้าลง เมื่อรายการในหน้าสุดท้ายหมดไป
      const synced = { ...target, page: result.page };
      filtersRef.current = synced;
      setFilters(synced);
      setData(result);
      setError(null);
      window.history.replaceState(null, '', `${pathname}?${reportFiltersToQuery(synced)}`);
    } catch {
      if (!controller.signal.aborted) setError('เกิดข้อผิดพลาด');
    } finally {
      if (!controller.signal.aborted) setLoading(false);
    }
  }, [pathname]);

  const apply = useCallback((patch: Partial<ReportFilters>) => {
    const next = { ...filtersRef.current, page: 1, ...patch };
    filtersRef.current = next;
    setFilters(next);
    void load(next);
  }, [load]);

  const reload = useCallback(() => load(filtersRef.current), [load]);

  function goToPage(page: number) {
    apply({ page });
    window.scrollTo({ top: 0 });
  }

  const totalPages = data ? Math.ceil(data.total / data.pageSize) : 0;

  return (
    <div className="flex flex-col gap-3">
      <ReportFilterBar filters={filters} onChange={apply} />

      {error ? (
        <div role="alert" className="card flex flex-wrap items-center justify-between gap-2 px-5 py-4 text-sm">
          <span className="font-medium text-brand-700">{t(error)}</span>
          <button type="button" disabled={loading} onClick={() => void reload()} className="btn-outline px-3 py-1.5 text-xs">
            {t('ลองอีกครั้ง')}
          </button>
        </div>
      ) : data ? (
        <div aria-busy={loading} className={clsx('flex flex-col gap-3 transition-opacity', loading && 'opacity-60')}>
          <ReportQueue
            reports={data.reports}
            total={data.total}
            defaultView={isDefaultReportView(filters)}
            onResolved={reload}
          />

          {totalPages > 1 ? (
            <nav className="flex items-center justify-between gap-2">
              <button type="button" disabled={loading || data.page <= 1} onClick={() => goToPage(data.page - 1)} className="btn-outline px-3 py-1.5 text-sm">
                <ChevronLeft size={15} /> {t('ก่อนหน้า')}
              </button>
              <span className="text-sm text-ink-soft">{t('หน้า {page} / {total}', { page: data.page, total: totalPages })}</span>
              <button type="button" disabled={loading || data.page >= totalPages} onClick={() => goToPage(data.page + 1)} className="btn-outline px-3 py-1.5 text-sm">
                {t('ถัดไป')} <ChevronRight size={15} />
              </button>
            </nav>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
