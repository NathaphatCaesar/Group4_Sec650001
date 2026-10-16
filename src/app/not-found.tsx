import { Compass } from 'lucide-react';
import Link from 'next/link';
import { getT } from '@/lib/i18n/server';

export default async function NotFound() {
  const t = await getT();

  return (
    <main className="grid min-h-dvh place-items-center p-6 text-center">
      <div>
        <Compass size={44} strokeWidth={1.5} className="text-brand-400" aria-hidden />
        <h1 className="mt-2 text-xl font-bold">{t('ไม่เจอหน้านี้')}</h1>
        <Link href="/" className="btn-primary mt-4">{t('กลับหน้าฟีด')}</Link>
      </div>
    </main>
  );
}
