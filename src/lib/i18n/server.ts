import { cache } from 'react';
import { cookies, headers } from 'next/headers';
import {
  LOCALE_COOKIE, createT, detectLocale, normalizeLocale,
  type Locale, type TFunction,
} from '@/lib/i18n';

export const getLocale = cache(async (): Promise<Locale> => {
  const jar = await cookies();
  const chosen = normalizeLocale(jar.get(LOCALE_COOKIE)?.value);
  if (chosen) return chosen;

  const head = await headers();
  return detectLocale(head.get('accept-language'));
});

export async function getT(): Promise<TFunction> {
  return createT(await getLocale());
}
