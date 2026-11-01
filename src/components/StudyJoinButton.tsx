'use client';

import Link from 'next/link';
import { useState } from 'react';
import clsx from 'clsx';
import { CheckCircle2, Clock, UserPlus, XCircle } from 'lucide-react';
import type { SignupStatus } from '@/lib/types';
import { useT } from '@/lib/i18n/client';

// U14: ปุ่มเข้าร่วม/ยกเลิกนัดติวบนการ์ดโพสต์ เจ้าของนัดเห็นลิงก์ไปจัดการคำขอแทน
export function StudyJoinButton({
  postId, isOwner, ended, requiresApproval, capacity, signupCount, pendingCount, status, onChange,
}: {
  postId: string;
  isOwner: boolean;
  ended: boolean;
  requiresApproval: boolean;
  capacity: number | null;
  signupCount: number;
  pendingCount: number;
  status: SignupStatus;
  onChange: (next: { status: SignupStatus; signupCount: number }) => void;
}) {
  const t = useT();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (isOwner) {
    return (
      <Link href="/study" className="btn-soft px-3 py-1.5 text-xs">
        {t('จัดการคำขอ')}{pendingCount ? ` (${pendingCount})` : ''}
      </Link>
    );
  }

  const full = capacity !== null && signupCount >= capacity;

  async function send(method: 'POST' | 'DELETE') {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/study/${postId}/join`, { method });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'เกิดข้อผิดพลาด');
      if (method === 'POST') {
        onChange({ status: data.status, signupCount: data.signup_count ?? signupCount });
      } else {
        onChange({ status: 'none', signupCount: status === 'approved' ? Math.max(0, signupCount - 1) : signupCount });
      }
    } catch (err) {
      setError(t(err instanceof Error ? err.message : 'เกิดข้อผิดพลาด'));
    } finally {
      setBusy(false);
    }
  }

  let button: React.ReactNode;
  if (status === 'approved') {
    button = (
      <button type="button" disabled={busy} onClick={() => send('DELETE')} className="btn-outline px-3 py-1.5 text-xs" title={t('ออกจากนัดติว')}>
        <CheckCircle2 size={14} /> {t('เข้าร่วมแล้ว')} · {t('ออก')}
      </button>
    );
  } else if (status === 'pending') {
    button = (
      <button type="button" disabled={busy} onClick={() => send('DELETE')} className="btn-outline px-3 py-1.5 text-xs" title={t('ยกเลิกคำขอ')}>
        <Clock size={14} /> {t('รออนุมัติ')} · {t('ยกเลิก')}
      </button>
    );
  } else if (status === 'rejected') {
    button = (
      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-red-700">
        <XCircle size={14} /> {t('คำขอไม่ได้รับอนุมัติ')}
      </span>
    );
  } else if (ended || full) {
    button = (
      <span className="text-xs font-medium opacity-70">{t(ended ? 'นัดติวนี้ปิดรับแล้ว' : 'ที่นั่งเต็มแล้ว')}</span>
    );
  } else {
    button = (
      <button type="button" disabled={busy} onClick={() => send('POST')} className="btn-primary px-3 py-1.5 text-xs">
        <UserPlus size={14} /> {t(requiresApproval ? 'ขอเข้าร่วม' : 'เข้าร่วมติว')}
      </button>
    );
  }

  return (
    <div className={clsx('flex flex-col items-start gap-1', busy && 'opacity-70')}>
      {button}
      {error ? <p className="text-xs text-red-600">{error}</p> : null}
    </div>
  );
}
