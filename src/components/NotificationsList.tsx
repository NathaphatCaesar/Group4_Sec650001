
'use client';

import { useCallback, useEffect, useState } from 'react';
import type { NotificationItem } from '@/lib/types';

type NotificationRow = Omit<
  NotificationItem,
  'post_title' | 'actor'
> & {
  recipient_id: string;
  actor_id: string | null;
};

export function NotificationsList() {
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
        throw new Error(result.error || 'โหลดการแจ้งเตือนไม่สำเร็จ');
      }

      setItems(result.notifications ?? []);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'เกิดข้อผิดพลาด',
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadNotifications();
  }, [loadNotifications]);

  async function markAsRead(id: string) {
    try {
      const response = await fetch('/api/notifications/read', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'อัปเดตสถานะไม่สำเร็จ');
      }

      setItems((current) =>
        current.map((item) =>
          item.id === id
            ? { ...item, read_at: new Date().toISOString() }
            : item,
        ),
      );
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'เกิดข้อผิดพลาด',
      );
    }
  }

  if (loading) {
    return <p className="py-8 text-center text-ink-soft">กำลังโหลด...</p>;
  }

  if (error && items.length === 0) {
    return (
      <div className="py-8 text-center">
        <p className="text-red-600">{error}</p>
        <button className="btn-primary mt-3" onClick={loadNotifications}>
          ลองอีกครั้ง
        </button>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="rounded-xl border border-[color:var(--color-line)] p-8 text-center">
        <p className="font-medium">ยังไม่มีการแจ้งเตือน</p>
        <p className="mt-1 text-sm text-ink-soft">
          เมื่อมีกิจกรรมใหม่ การแจ้งเตือนจะแสดงที่นี่
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-[color:var(--color-line)]">
      {error && <p className="p-3 text-sm text-red-600">{error}</p>}

      {items.map((item) => (
        <div
          key={item.id}
          className={`flex items-start justify-between gap-3 border-b border-[color:var(--color-line)] p-4 last:border-b-0 ${
            item.read_at ? '' : 'bg-brand-50'
          }`}
        >
          <div className="min-w-0">
            <p className="font-medium">
              {notificationText(item.type)}
            </p>
            <p className="mt-1 text-xs text-ink-soft">
              {new Date(item.created_at).toLocaleString('th-TH')}
            </p>
          </div>

          {!item.read_at && (
            <button
              className="shrink-0 text-sm text-brand-700 hover:underline"
              onClick={() => void markAsRead(item.id)}
            >
              อ่านแล้ว
            </button>
          )}
        </div>
      ))}
    </div>
  );
}

function notificationText(type: NotificationItem['type']) {
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

  return labels[type];
}
