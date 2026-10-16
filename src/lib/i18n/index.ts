import { EN } from '@/lib/i18n/en';

export const LOCALES = ['th', 'en'] as const;
export type Locale = (typeof LOCALES)[number];

export const LOCALE_COOKIE = 'bh_lang';
export const LOCALE_LABEL: Record<Locale, string> = { th: 'ไทย', en: 'English' };

export type Vars = Record<string, string | number>;

export function normalizeLocale(value: string | null | undefined): Locale | null {
  if (!value) return null;
  const v = value.trim().toLowerCase();
  return (LOCALES as readonly string[]).includes(v) ? (v as Locale) : null;
}

export function detectLocale(acceptLanguage: string | null | undefined): Locale {
  if (!acceptLanguage) return 'th';

  const ranked = acceptLanguage
    .split(',')
    .map((part) => {
      const [tag, ...params] = part.trim().split(';');
      const q = params.find((p) => p.trim().startsWith('q='));
      return { tag: tag.trim().toLowerCase(), q: q ? Number(q.split('=')[1]) || 0 : 1 };
    })
    .filter((x) => x.tag)
    .sort((a, b) => b.q - a.q);

  for (const { tag } of ranked) {
    if (tag === '*') continue;
    const base = tag.split('-')[0];
    if (base === 'th') return 'th';
    if (base === 'en') return 'en';
  }
  return 'th';
}

function interpolate(text: string, vars?: Vars): string {
  if (!vars) return text;
  return text.replace(/\{(\w+)\}/g, (whole, key: string) =>
    key in vars ? String(vars[key]) : whole);
}

export function translate(locale: Locale, key: string, vars?: Vars): string {
  const text = locale === 'en' ? EN[key] ?? key : key;
  return interpolate(text, vars);
}

export type TFunction = (key: string, vars?: Vars) => string;

export function createT(locale: Locale): TFunction {
  return (key, vars) => translate(locale, key, vars);
}
