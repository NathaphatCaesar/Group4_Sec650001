'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import clsx from 'clsx';
import { CalendarClock, Check, MapPin, Users, X } from 'lucide-react';
import { Avatar } from '@/components/Avatar';
import { Empty } from '@/components/Empty';
import type { MyStudySession } from '@/lib/data';
import type { SignupStatus, StudySignup } from '@/lib/types';
import { meetDate } from '@/lib/utils';
import { useT, useLocale } from '@/lib/i18n/client';

const STATUS_STYLE: Record<Exclude<SignupStatus, 'none'>, { label: string; cls: string }> = {
  pending:  { label: 'รออนุมัติ',          cls: 'bg-amber-50 text-amber-800' },
  approved: { label: 'เข้าร่วมแล้ว',       cls: 'bg-emerald-50 text-emerald-800' },
  rejected: { label: 'ไม่ได้รับอนุมัติ',   cls: 'bg-red-50 text-red-700' },
};

export function StudySessionList({ sessions, view }: { sessions: MyStudySession[]; view: 'owned' | 'joined' }) {
  const t = useT();
  if (!sessions.length) {
    return view === 'owned'
      ? <Empty icon={CalendarClock} title={t('ยังไม่มีนัดติวที่คุณสร้าง')} hint={t('โพสต์แบบนัดติวจากหน้าฟีดได้เลย')} />
      : <Empty icon={CalendarClock} title={t('ยังไม่ได้เข้าร่วมนัดติว')} hint={t('ดูนัดติวที่เพื่อนตั้งไว้ในหน้าฟีด')} />;
  }
  return (
    <div className="flex flex-col gap-3">
      {sessions.map((s) => <SessionCard key={s.id} session={s} />)}
    </div>
  );
}

function SessionCard({ session }: { session: MyStudySession }) {
  const t = useT();
  const locale = useLocale();
  const status = session.my_status !== 'none' ? STATUS_STYLE[session.my_status] : null;

  return (
    <article className={clsx('card p-4', session.is_past && 'opacity-75')}>
      <div className="flex items-start justify-between gap-3">
        <Link href={`/posts/${session.id}`} className="min-w-0">
          <h2 className="truncate font-semibold hover:underline">
            {session.title || session.subject_name || session.body.slice(0, 60) || t('นัดติว')}
          </h2>
          {session.subject_code ? (
            <p className="text-xs text-ink-soft">{session.subject_code}{session.subject_name ? ` · ${session.subject_name}` : ''}</p>
          ) : null}
        </Link>
        {!session.is_owner && status ? (
          <span className={clsx('chip shrink-0 px-2.5 py-1 text-xs', status.cls)}>{t(status.label)}</span>
        ) : null}
        {session.is_past ? <span className="chip shrink-0 bg-stone-100 px-2.5 py-1 text-xs text-stone-700">{t('ผ่านไปแล้ว')}</span> : null}
      </div>

      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-ink-soft">
        {session.meet_at ? (
          <span className="inline-flex items-center gap-1.5"><CalendarClock size={15} /> {meetDate(session.meet_at, locale)}</span>
        ) : null}
        {session.meet_place ? (
          <span className="inline-flex items-center gap-1.5"><MapPin size={15} /> {session.meet_place}</span>
        ) : null}
        <span className="inline-flex items-center gap-1.5">
          <Users size={15} /> {t('เข้าร่วมแล้ว {n} คน', { n: `${session.signup_count}${session.capacity ? `/${session.capacity}` : ''}` })}
        </span>
        {!session.is_owner ? (
          <span>{t('โดย {name}', { name: session.author.display_name })}</span>
        ) : null}
      </div>

      {session.is_owner ? <MemberList postId={session.id} members={session.members} /> : null}
    </article>
  );
}

function MemberList({ postId, members }: { postId: string; members: StudySignup[] }) {
  const t = useT();
  if (!members.length) {
    return <p className="mt-3 text-xs text-ink-soft">{t('ยังไม่มีคนขอเข้าร่วม')}</p>;
  }
  return (
    <ul className="mt-3 divide-y divide-[color:var(--color-line)] rounded-2xl border border-[color:var(--color-line)]">
      {members.map((m) => <MemberRow key={m.user_id} postId={postId} member={m} />)}
    </ul>
  );
}

function MemberRow({ postId, member }: { postId: string; member: StudySignup }) {
  const t = useT();
  const router = useRouter();
  const [status, setStatus] = useState(member.status);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function decide(approve: boolean) {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/study/${postId}/${approve ? 'approve' : 'reject'}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: member.user_id }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'เกิดข้อผิดพลาด');
      setStatus(data.status);
      router.refresh();
    } catch (err) {
      setError(t(err instanceof Error ? err.message : 'เกิดข้อผิดพลาด'));
    } finally {
      setBusy(false);
    }
  }

  const style = STATUS_STYLE[status];
  return (
    <li className="flex flex-wrap items-center gap-3 px-3 py-2.5">
      <Link href={`/u/${member.user.username}`} className="flex min-w-0 flex-1 items-center gap-2.5">
        <Avatar name={member.user.display_name} src={member.user.avatar_url} size={32} />
        <span className="truncate text-sm font-medium">{member.user.display_name}</span>
      </Link>
      {status === 'pending' ? (
        <div className="flex shrink-0 gap-2">
          <button type="button" disabled={busy} onClick={() => decide(false)} className="btn-outline px-3 py-1.5 text-xs">
            <X size={13} /> {t('ปฏิเสธ')}
          </button>
          <button type="button" disabled={busy} onClick={() => decide(true)} className="btn-primary px-3 py-1.5 text-xs">
            <Check size={13} /> {t('อนุมัติ')}
          </button>
        </div>
      ) : (
        <span className={clsx('chip shrink-0 px-2.5 py-1 text-xs', style.cls)}>{t(style.label)}</span>
      )}
      {error ? <p className="w-full text-xs text-red-600">{error}</p> : null}
    </li>
  );
}
