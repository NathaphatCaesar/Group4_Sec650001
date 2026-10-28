'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { Avatar } from '@/components/Avatar';
import { useLocale, useT } from '@/lib/i18n/client';
import { timeAgo } from '@/lib/utils';
import type { NotificationItem } from '@/lib/types';

type NotificationRow = NotificationItem & {
  recipient_id: string;
  actor_id: string | null;
};

export function NotificationsList() {
  const t = useT();
  const locale = useLocale();
  const router = useRouter();
  const [items, setItems] = useState<NotificationRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadNotifications = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/notifications', {
        cache: 'no-store',
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || t('โหลดการแจ้งเตือนไม่สำเร็จ'));
      }

      setItems(result.notifications ?? []);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : t('เกิดข้อผิดพลาด'),
      );
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    void loadNotifications();
  }, [loadNotifications]);

  async function markAsRead(body: { id: string } | { all: true }) {
    try {
      const response = await fetch('/api/notifications/read', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || t('อัปเดตสถานะไม่สำเร็จ'));
      }

      const now = new Date().toISOString();
      setItems((current) =>
        current.map((item) =>
          'all' in body || item.id === body.id
            ? { ...item, read_at: item.read_at ?? now }
            : item,
        ),
      );
      // อัปเดตตัวเลขบนกระดิ่ง
      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : t('เกิดข้อผิดพลาด'),
      );
    }
  }

  if (loading) {
    return <p className="py-8 text-center text-ink-soft">{t('กำลังโหลด...')}</p>;
  }

  if (error && items.length === 0) {
    return (
      <div className="py-8 text-center">
        <p className="text-red-600">{error}</p>
        <button className="btn-primary mt-3" onClick={loadNotifications}>
          {t('ลองอีกครั้ง')}
        </button>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="rounded-xl border border-[color:var(--color-line)] p-8 text-center">
        <p className="font-medium">{t('ยังไม่มีการแจ้งเตือน')}</p>
        <p className="mt-1 text-sm text-ink-soft">
          {t('เมื่อมีกิจกรรมใหม่ การแจ้งเตือนจะแสดงที่นี่')}
        </p>
      </div>
    );
  }

  const hasUnread = items.some((item) => !item.read_at);

  return (
    <div>
      {hasUnread && (
        <div className="mb-2 flex justify-end">
          <button
            className="text-sm font-medium text-brand-700 hover:underline"
            onClick={() => void markAsRead({ all: true })}
          >
            {t('อ่านทั้งหมด')}
          </button>
        </div>
      )}

      <div className="overflow-hidden rounded-xl border border-[color:var(--color-line)]">
        {error && <p className="p-3 text-sm text-red-600">{error}</p>}

        {items.map((item) => {
          const href = notificationHref(item);
          const content = (
            <div className="flex min-w-0 items-start gap-3">
              {item.actor ? (
                <Avatar name={item.actor.display_name} src={item.actor.avatar_url} size={36} />
              ) : null}
              <div className="min-w-0">
                <p className="font-medium">
                  {notificationText(item, t)}
                </p>
                {item.post_title ? (
                  <p className="mt-0.5 truncate text-sm text-ink-soft">{item.post_title}</p>
                ) : null}
                <p className="mt-1 text-xs text-ink-soft">
                  {timeAgo(item.created_at, locale)}
                </p>
              </div>
            </div>
          );

          return (
            <div
              key={item.id}
              className={`flex items-start justify-between gap-3 border-b border-[color:var(--color-line)] p-4 last:border-b-0 ${
                item.read_at ? '' : 'bg-brand-50'
              }`}
            >
              {href ? (
                <Link
                  href={href}
                  className="min-w-0 flex-1 hover:opacity-80"
                  onClick={() => { if (!item.read_at) void markAsRead({ id: item.id }); }}
                >
                  {content}
                </Link>
              ) : (
                <div className="min-w-0 flex-1">{content}</div>
              )}

              {!item.read_at && (
                <button
                  className="shrink-0 text-sm text-brand-700 hover:underline"
                  onClick={() => void markAsRead({ id: item.id })}
                >
                  {t('อ่านแล้ว')}
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function notificationHref(item: NotificationRow): string | null {
  if (item.actor && (item.type === 'follow' || item.type === 'announce')) {
    return `/u/${item.actor.username}`;
  }
  return null;
}

function notificationText(item: NotificationRow, t: ReturnType<typeof useT>) {
  const name = item.actor?.display_name ?? t('มีคน');

  if (item.type === 'follow') return t('{name} เริ่มติดตามคุณ', { name });
  if (item.type === 'announce') return t('{name} โพสต์ประกาศใหม่', { name });
  if (item.type === 'report_resolved') {
    return item.payload?.action === 'dismiss'
      ? t('รายงานของคุณได้รับการตรวจแล้ว ไม่พบการทำผิดกฎ')
      : t('รายงานของคุณได้รับการดำเนินการแล้ว');
  }

  const labels: Record<NotificationItem['type'], string> = {
    like: 'มีคนถูกใจโพสต์',
    comment: 'มีความคิดเห็นใหม่',
    reply: 'มีคนตอบกลับความคิดเห็น',
    follow: 'มีผู้ติดตามใหม่',
    mention: 'มีคนกล่าวถึงคุณ',
    answer_accepted: 'คำตอบของคุณได้รับการยอมรับ',
    study_reminder: 'แจ้งเตือนนัดติว',
    study_signup: 'มีคนสนใจเข้าร่วมติว',
    study_approved: 'คำขอเข้าร่วมติวได้รับอนุมัติ',
    study_rejected: 'คำขอเข้าร่วมติวไม่ได้รับอนุมัติ',
    study_ended: 'กิจกรรมนัดติวสิ้นสุดแล้ว',
    report_resolved: 'รายงานของคุณได้รับการดำเนินการ',
    star_awarded: 'คุณได้รับดาว',
    message: 'มีข้อความใหม่',
    follow_request: 'มีคำขอติดตามใหม่',
    follow_accepted: 'คำขอติดตามได้รับการยอมรับ',
    announce: 'มีประกาศใหม่',
  };

  return t(labels[item.type]);
}
