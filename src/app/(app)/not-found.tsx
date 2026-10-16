import { SearchX } from 'lucide-react';
import Link from 'next/link';
import { getT } from '@/lib/i18n/server';

export default async function NotFound() {
  const t = await getT();

  return (
    <div className="card mx-auto grid max-w-md place-items-center gap-2 px-6 py-16 text-center">
      <SearchX size={44} strokeWidth={1.5} className="text-ink-soft opacity-60" aria-hidden />
      <h1 className="text-lg font-bold">{t('ไม่เจอหน้านี้')}</h1>
      <p className="text-sm text-ink-soft">{t('โพสต์อาจถูกลบไปแล้ว หรือลิงก์ผิด')}</p>
      <Link href="/" className="btn-primary mt-2">{t('กลับหน้าฟีด')}</Link>
    </div>
  );
}
