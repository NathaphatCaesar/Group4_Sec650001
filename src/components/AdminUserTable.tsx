'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { Ban, RotateCcw } from 'lucide-react';
import { Avatar } from '@/components/Avatar';
import { RoleBadge } from '@/components/RoleBadge';
import { Empty } from '@/components/Empty';
import { setUserSuspended } from '@/actions/admin';
import type { AdminUserRow } from '@/lib/admin';
import { useT } from '@/lib/i18n/client';

export function AdminUserTable({ users, meId }: { users: AdminUserRow[]; meId: string }) {
  const t = useT();
  if (!users.length) return <Empty title={t('ไม่พบผู้ใช้')} />;

  return (
    <ul className="card divide-y divide-[color:var(--color-line)]">
      {users.map((u) => <UserRow key={u.id} user={u} isMe={u.id === meId} />)}
    </ul>
  );
}

function UserRow({ user, isMe }: { user: AdminUserRow; isMe: boolean }) {
  const t = useT();
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [suspended, setSuspended] = useState(user.is_suspended);
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canToggle = !isMe && user.role !== 'admin';

  function toggle(next: boolean) {
    setError(null);
    setConfirming(false);
    startTransition(async () => {
      const res = await setUserSuspended(user.id, next);
      if (res.ok) {
        setSuspended(next);
        router.refresh();
      } else {
        setError(t(res.error));
      }
    });
  }

  return (
    <li className="flex flex-wrap items-center gap-3 px-4 py-3">
      <Link href={`/u/${user.username}`} className="flex min-w-0 flex-1 items-center gap-3">
        <Avatar name={user.display_name} src={user.avatar_url} size={40} />
        <div className="min-w-0">
          <p className="flex items-center gap-2 truncate text-sm font-semibold">
            {user.display_name}
            {suspended ? (
              <span className="chip bg-red-50 px-2 py-0.5 text-[11px] text-red-700">{t('ถูกระงับ')}</span>
            ) : null}
          </p>
          <p className="truncate text-xs text-ink-soft">
            @{user.username}{user.student_id ? ` · ${user.student_id}` : ''}
          </p>
          <RoleBadge role={user.role} studyYear={user.study_year} faculty={user.faculty_name} />
        </div>
      </Link>

      {canToggle ? (
        <div className="flex shrink-0 items-center gap-2">
          {suspended ? (
            <button type="button" disabled={pending} onClick={() => toggle(false)} className="btn-outline px-3 py-1.5 text-xs">
              <RotateCcw size={13} /> {t('ปลดระงับ')}
            </button>
          ) : confirming ? (
            <>
              <button type="button" disabled={pending} onClick={() => setConfirming(false)} className="btn-ghost px-3 py-1.5 text-xs">
                {t('ยกเลิก')}
              </button>
              <button type="button" disabled={pending} onClick={() => toggle(true)} className="btn-primary px-3 py-1.5 text-xs">
                <Ban size={13} /> {t('ยืนยันระงับ')}
              </button>
            </>
          ) : (
            <button type="button" disabled={pending} onClick={() => setConfirming(true)} className="btn-outline px-3 py-1.5 text-xs">
              <Ban size={13} /> {t('ระงับบัญชี')}
            </button>
          )}
        </div>
      ) : null}

      {error ? <p className="w-full text-xs text-red-600">{error}</p> : null}
    </li>
  );
}
