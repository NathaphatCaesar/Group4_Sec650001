'use client';

import { useEffect, useState } from 'react';
import { timeAgo } from '@/lib/utils';
import { useLocale } from '@/lib/i18n/client';

// เวลาแบบ "5 นาที" คำนวณจาก Date.now() ซึ่งฝั่ง server กับ browser ไม่ตรงกัน
// จึงให้ React ข้ามการเทียบข้อความนี้ตอน hydrate แล้วอัปเดตทุก 1 นาที
export function TimeAgo({ date, className }: { date: string; className?: string }) {
  const locale = useLocale();
  const [, tick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => tick((n) => n + 1), 60_000);
    return () => clearInterval(id);
  }, []);
  return (
    <time dateTime={date} className={className} suppressHydrationWarning>
      {timeAgo(date, locale)}
    </time>
  );
}
