'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import clsx from 'clsx';
import { EyeOff, Trash2, CheckCircle2, ShieldCheck } from 'lucide-react';
import { PostCard } from '@/components/PostCard';
import { Empty } from '@/components/Empty';
import { resolveReport } from '@/actions/reports';
import { REPORT_REASONS, REPORT_DETAIL_MAX, type ReportAction, type ReportItem } from '@/lib/types';
import { timeAgo } from '@/lib/utils';
import { useT, useLocale } from '@/lib/i18n/client';

export function ReportQueue({ reports, view }: { reports: ReportItem[]; view: 'pending' | 'closed' }) {
  const t = useT();

  if (!reports.length) {
    return view === 'pending'
      ? <Empty icon={ShieldCheck} title={t('ไม่มีรายงานค้าง')} hint={t('ชุมชนเรียบร้อยดี')} />
      : <Empty title={t('ยังไม่มีเคสที่ปิดแล้ว')} />;
  }

  return (
    <div className="flex flex-col gap-3">
      {view === 'pending' ? (
        <p className="px-1 text-sm text-ink-soft">{t('ค้างอยู่ {n} รายการ', { n: reports.length })}</p>
      ) : null}
      {reports.map((r) => <ReportCase key={r.id} report={r} />)}
    </div>
  );
}

function ReportCase({ report }: { report: ReportItem }) {
  const t = useT();
  const locale = useLocale();
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [note, setNote] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const isPending = report.status === 'pending';
  const postGone = !report.post;

  function decide(action: ReportAction) {
    setError(null);
    startTransition(async () => {
      const res = await resolveReport(report.id, action, note);
      if (res.ok || res.gone) {
        setDone(true);
        router.refresh();
      } else {
        setError(t(res.error));
      }
    });
  }

  if (done) return null;

  return (
    <section className="card overflow-hidden">
      <header className="flex flex-wrap items-center gap-2 border-b border-[color:var(--color-line)] px-5 py-3 text-sm">
        <span className="chip bg-brand-50 px-2.5 py-1 text-xs font-semibold text-brand-700">
          {t(REPORT_REASONS[report.reason]?.short ?? report.reason)}
        </span>
        <StatusChip report={report} />
        {report.post_hidden ? (
          <span className="chip bg-stone-100 px-2.5 py-1 text-xs text-stone-700">{t('ซ่อนอยู่')}</span>
        ) : null}
        <span className="ml-auto text-xs text-ink-soft">
          {report.reporter ? t('รายงานโดย {name}', { name: report.reporter.display_name }) : null}
          {' · '}{timeAgo(report.created_at, locale)}
        </span>
      </header>

      {report.detail ? (
        <p className="whitespace-pre-wrap border-b border-[color:var(--color-line)] px-5 py-3 text-sm">“{report.detail}”</p>
      ) : null}

      <div className="bg-[color:var(--color-canvas)] p-3">
        {report.post ? (
          <PostCard post={report.post} meId={null} dense />
        ) : (
          <div className="card px-5 py-4 text-sm">
            <p className="font-semibold text-ink-soft">{t('เนื้อหาถูกลบไปแล้ว')}</p>
            {report.post_excerpt ? <p className="mt-1 line-clamp-3 text-ink-soft">{report.post_excerpt}</p> : null}
          </div>
        )}
      </div>

      {isPending ? (
        <div className="flex flex-col gap-2 px-5 py-4">
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            maxLength={REPORT_DETAIL_MAX}
            rows={2}
            placeholder={t('บันทึกการตัดสิน (ไม่บังคับ)')}
            className="input resize-none text-sm"
          />
          {error ? <p role="alert" className="text-sm text-brand-700">{error}</p> : null}

          {confirmDelete ? (
            <div className="flex flex-wrap items-center gap-2 rounded-2xl bg-brand-50 px-3 py-2.5 text-sm">
              <span className="flex-1 font-medium text-brand-700">{t('ลบโพสต์นี้?')} {t('ลบแล้วกู้คืนไม่ได้')}</span>
              <button type="button" disabled={pending} onClick={() => setConfirmDelete(false)} className="btn-outline px-3 py-1.5 text-xs">
                {t('ยกเลิก')}
              </button>
              <button type="button" disabled={pending} onClick={() => decide('delete')} className="btn-primary px-3 py-1.5 text-xs">
                <Trash2 size={13} /> {t('ลบ')}
              </button>
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              <button type="button" disabled={pending || postGone} onClick={() => decide('hide')} className="btn-primary px-3.5 py-2 text-sm">
                <EyeOff size={15} /> {t('ซ่อนเนื้อหา + ปิดเคส')}
              </button>
              <button type="button" disabled={pending || postGone} onClick={() => setConfirmDelete(true)} className="btn-soft px-3.5 py-2 text-sm">
                <Trash2 size={15} /> {t('ลบโพสต์')}
              </button>
              <button type="button" disabled={pending} onClick={() => decide('dismiss')} className="btn-outline px-3.5 py-2 text-sm">
                <CheckCircle2 size={15} /> {t('ปิดเคส (ไม่ซ่อน)')}
              </button>
            </div>
          )}
        </div>
      ) : report.resolution_note ? (
        <p className="px-5 py-3 text-sm text-ink-soft">{report.resolution_note}</p>
      ) : null}
    </section>
  );
}

function StatusChip({ report }: { report: ReportItem }) {
  const t = useT();
  const label = report.status === 'pending' ? 'รอตรวจ'
    : report.status === 'dismissed' ? 'ไม่ผิดกฎ'
    : report.action === 'delete' ? 'ลบแล้ว'
    : 'จัดการแล้ว';
  return (
    <span
      className={clsx(
        'chip px-2.5 py-1 text-xs',
        report.status === 'pending' && 'bg-amber-50 text-amber-700',
        report.status === 'actioned' && 'bg-emerald-50 text-emerald-700',
        report.status === 'dismissed' && 'bg-stone-100 text-stone-700',
      )}
    >
      {t(label)}
    </span>
  );
}
