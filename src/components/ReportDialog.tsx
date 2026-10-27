'use client';

import { useState, useTransition } from 'react';
import clsx from 'clsx';
import { Flag, X, CheckCircle2 } from 'lucide-react';
import { reportPost } from '@/actions/reports';
import {
  REPORT_REASONS, REPORT_REASON_ORDER, REPORT_DETAIL_MAX,
  type ReportReason,
} from '@/lib/types';
import { useT } from '@/lib/i18n/client';

export function ReportDialog({
  postId, onClose, onGone,
}: { postId: string; onClose: () => void; onGone?: () => void }) {
  const t = useT();
  const [pending, startTransition] = useTransition();
  const [reason, setReason] = useState<ReportReason | null>(null);
  const [detail, setDetail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [gone, setGone] = useState(false);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    // ปุ่มส่งกดได้เสมอ ถ้ายังไม่เลือกเหตุผลให้ระบบแจ้งเตือน (U7 test case 2)
    if (!reason) {
      setError(t('กรุณาเลือกเหตุผลก่อนส่งรายงาน'));
      return;
    }
    startTransition(async () => {
      const res = await reportPost(postId, reason, detail);
      if (res.ok) {
        setSent(true);
      } else {
        setError(t(res.error));
        if (res.gone) setGone(true);
      }
    });
  }

  function close() {
    if (gone) onGone?.();
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4" onClick={close}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="report-title"
        className="card w-full max-w-md p-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-3 flex items-center gap-2">
          <Flag size={18} className="text-brand-700" />
          <h2 id="report-title" className="flex-1 text-base font-semibold">{t('รายงานเนื้อหา')}</h2>
          <button type="button" onClick={close} aria-label={t('ปิด')} className="rounded-full p-1.5 text-ink-soft hover:bg-brand-50">
            <X size={18} />
          </button>
        </div>

        {sent ? (
          <div className="flex flex-col items-center gap-3 py-4 text-center">
            <CheckCircle2 size={36} className="text-emerald-600" />
            <p className="text-sm">{t('ส่งรายงานแล้ว แอดมินจะตรวจสอบให้เร็วที่สุด')}</p>
            <button type="button" onClick={close} className="btn-primary px-5 py-2 text-sm">{t('ปิด')}</button>
          </div>
        ) : gone ? (
          <div className="flex flex-col items-center gap-3 py-4 text-center">
            <p className="font-semibold">{t('ไม่พบเนื้อหาที่จะรายงาน')}</p>
            <p className="text-sm text-ink-soft">{t('โพสต์นี้อาจถูกลบหรือถูกซ่อนไปแล้ว')}</p>
            <button type="button" onClick={close} className="btn-outline px-5 py-2 text-sm">{t('ปิด')}</button>
          </div>
        ) : (
          <form onSubmit={submit} className="flex flex-col gap-3">
            <fieldset>
              <legend className="mb-2 text-sm font-medium">{t('เหตุผล')}</legend>
              <div className="flex flex-col gap-1.5">
                {REPORT_REASON_ORDER.map((key) => (
                  <label
                    key={key}
                    className={clsx(
                      'flex cursor-pointer items-center gap-2.5 rounded-2xl border px-3 py-2.5 text-sm transition-colors',
                      reason === key
                        ? 'border-brand-300 bg-brand-50 text-brand-700'
                        : 'border-[color:var(--color-line)] hover:bg-brand-50/50',
                    )}
                  >
                    <input
                      type="radio"
                      name="reason"
                      value={key}
                      checked={reason === key}
                      onChange={() => { setReason(key); setError(null); }}
                      className="accent-[color:var(--color-brand-500)]"
                    />
                    {t(REPORT_REASONS[key].label)}
                  </label>
                ))}
              </div>
            </fieldset>

            <textarea
              value={detail}
              onChange={(e) => setDetail(e.target.value)}
              maxLength={REPORT_DETAIL_MAX}
              rows={3}
              placeholder={t('อธิบายเพิ่มเติม (ไม่บังคับ)')}
              className="input resize-none"
            />

            {error ? <p role="alert" className="text-sm text-brand-700">{error}</p> : null}

            <div className="flex gap-2">
              <button type="button" onClick={close} className="btn-outline flex-1 py-2 text-sm">{t('ยกเลิก')}</button>
              <button type="submit" disabled={pending} className="btn-primary flex-1 py-2 text-sm">
                {pending ? t('กำลังส่ง...') : t('ส่งรายงาน')}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
