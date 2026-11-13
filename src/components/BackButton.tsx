'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { useT } from '@/lib/i18n/client';

// นับจำนวนหน้าที่เปิดภายในแอปในแท็บนี้ ใช้ตัดสินว่าย้อนกลับได้หรือไม่
let visitedInApp = 0;

export function NavTracker() {
  const pathname = usePathname();
  useEffect(() => {
    visitedInApp += 1;
  }, [pathname]);
  return null;
}

// ย้อนกลับหน้าก่อนหน้าในแอป ถ้าเปิดลิงก์ตรง ๆ (เช่นจาก LINE หรือแจ้งเตือน) ให้ไปหน้า fallback แทน
export function BackButton({ fallback = '/' }: { fallback?: string }) {
  const router = useRouter();
  const t = useT();

  return (
    <button
      type="button"
      aria-label={t('กลับ')}
      title={t('กลับ')}
      onClick={() => {
        if (visitedInApp > 1) router.back();
        else router.push(fallback);
      }}
      className="shrink-0 rounded-full p-2 text-ink-soft hover:bg-brand-50"
    >
      <ArrowLeft size={18} />
    </button>
  );
}
