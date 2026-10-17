'use client';

import { useRouter } from 'next/navigation';
import { useTransition } from 'react';
import clsx from 'clsx';
import { Check, Languages, Loader2 } from 'lucide-react';
import { setLocale } from '@/actions/settings';
import { LOCALES, LOCALE_LABEL, type Locale } from '@/lib/i18n';
import { useLocale, useT } from '@/lib/i18n/client';

export function LanguageSettings() {
  const t = useT();
  const current = useLocale();
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function pick(next: Locale) {
    if (next === current || pending) return;
    startTransition(async () => {
      await setLocale(next);
      router.refresh();
    });
  }

  return (
    <section className="card p-5">
      <h2 className="flex items-center gap-1.5 text-sm font-semibold">
        <Languages size={15} /> {t('ภาษา')}
        {pending ? <Loader2 size={13} className="animate-spin text-ink-soft" /> : null}
      </h2>
      <p className="mt-1 mb-3 text-xs text-ink-soft">
        {t('ครั้งแรกเว็บจะเลือกภาษาตามเครื่องของคุณให้เอง เปลี่ยนตรงนี้ได้ตลอด')}
      </p>

      <div className="flex flex-wrap gap-2">
        {LOCALES.map((l) => (
          <button
            key={l}
            type="button"
            onClick={() => pick(l)}
            aria-pressed={current === l}
            className={clsx(
              'chip px-4 py-2 text-sm font-semibold',
              current === l
                ? 'bg-brand-50 text-brand-700 ring-2 ring-brand-200'
                : 'bg-[color:var(--color-canvas)] text-ink-soft',
            )}
          >
            {current === l ? <Check size={14} /> : null} {LOCALE_LABEL[l]}
          </button>
        ))}
      </div>
    </section>
  );
}
