'use client';

import { useEffect, useState } from 'react';
import clsx from 'clsx';
import { Search, X } from 'lucide-react';
import {
  DEFAULT_REPORT_FILTERS,
  REPORT_REASONS,
  REPORT_REASON_ORDER,
  REPORT_SEARCH_MAX,
  type ReportFilters,
  type ReportSort,
  type ReportStatusFilter,
} from '@/lib/types';
import { useT } from '@/lib/i18n/client';

const STATUSES: Array<{ key: ReportStatusFilter; label: string }> = [
  { key: 'pending', label: 'รอตรวจ' },
  { key: 'actioned', label: 'จัดการแล้ว' },
  { key: 'dismissed', label: 'ไม่ผิดกฎ' },
  { key: 'all', label: 'ทั้งหมด' },
];

export function isDefaultReportView(f: ReportFilters) {
  return f.status === 'pending' && f.reason === 'all' && !f.q;
}

// Task42: ตัวกรองรายงาน ทุกตัวทำงานร่วมกัน ค่าที่เปลี่ยนจะส่งออกผ่าน onChange
export function ReportFilterBar({
  filters, onChange,
}: { filters: ReportFilters; onChange: (patch: Partial<ReportFilters>) => void }) {
  const t = useT();
  const [q, setQ] = useState(filters.q);

  useEffect(() => {
    const term = q.trim();
    if (term === filters.q) return;
    const timer = setTimeout(() => onChange({ q: term }), 300);
    return () => clearTimeout(timer);
  }, [q, filters.q, onChange]);

  function reset() {
    setQ('');
    onChange(DEFAULT_REPORT_FILTERS);
  }

  return (
    <div className="card flex flex-col gap-3 p-3">
      <div role="group" aria-label={t('สถานะ')} className="flex flex-wrap gap-2">
        {STATUSES.map((s) => (
          <button
            key={s.key}
            type="button"
            aria-pressed={filters.status === s.key}
            onClick={() => onChange({ status: s.key })}
            className={clsx('chip px-3.5 py-1.5 text-sm', filters.status === s.key ? 'bg-brand-50 text-brand-700 font-semibold' : 'text-ink-soft')}
          >
            {t(s.label)}
          </button>
        ))}
      </div>

      <div className="relative">
        <Search size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-soft" aria-hidden />
        <input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          maxLength={REPORT_SEARCH_MAX}
          placeholder={t('ค้นหาในรายละเอียดหรือเนื้อหาโพสต์')}
          aria-label={t('ค้นหา')}
          className="input !pl-10 text-sm"
        />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <select
          value={filters.reason}
          onChange={(e) => onChange({ reason: e.target.value as ReportFilters['reason'] })}
          aria-label={t('หมวดหมู่')}
          className="input min-w-0 flex-1 text-sm"
        >
          <option value="all">{t('ทุกหมวด')}</option>
          {REPORT_REASON_ORDER.map((r) => (
            <option key={r} value={r}>{t(REPORT_REASONS[r].short)}</option>
          ))}
        </select>
        <select
          value={filters.sort}
          onChange={(e) => onChange({ sort: e.target.value as ReportSort })}
          aria-label={t('เรียงตาม')}
          className="input min-w-0 flex-1 text-sm"
        >
          <option value="newest">{t('ล่าสุด')}</option>
          <option value="oldest">{t('เก่าสุด')}</option>
        </select>
        {!isDefaultReportView(filters) ? (
          <button type="button" onClick={reset} className="btn-outline px-3 py-2 text-sm">
            <X size={14} /> {t('ล้างทั้งหมด')}
          </button>
        ) : null}
      </div>
    </div>
  );
}
