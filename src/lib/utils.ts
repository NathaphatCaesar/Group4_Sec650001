import dayjs from 'dayjs';
import 'dayjs/locale/th';
import 'dayjs/locale/en';
import relativeTime from 'dayjs/plugin/relativeTime';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import buddhistEra from 'dayjs/plugin/buddhistEra';
import type { Locale } from '@/lib/i18n';

dayjs.extend(relativeTime);
dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(buddhistEra);
dayjs.locale('th');

export const TZ = 'Asia/Bangkok';

function at(iso: string, locale: Locale) {
  return dayjs(iso).tz(TZ).locale(locale);
}

export function timeAgo(iso: string, locale: Locale = 'th'): string {
  const d = dayjs(iso).locale(locale);
  if (dayjs().diff(d, 'day') >= 7) {
    return at(iso, locale).format(locale === 'en' ? 'D MMM YY' : 'D MMM BB');
  }
  return locale === 'en'
    ? d.fromNow(true)
    : d.fromNow(true).replace('ที่แล้ว', '').trim();
}

export function fullDate(iso: string, locale: Locale = 'th'): string {
  return at(iso, locale).format(
    locale === 'en' ? 'D MMMM YYYY [at] HH:mm' : 'D MMMM BBBB เวลา HH:mm น.',
  );
}

export function dateOnly(iso: string, locale: Locale = 'th'): string {
  return at(iso, locale).format(locale === 'en' ? 'D MMMM YYYY' : 'D MMMM BBBB');
}

export function meetDate(iso: string, locale: Locale = 'th'): string {
  return at(iso, locale).format(
    locale === 'en' ? 'ddd D MMM YY · HH:mm' : 'dd D MMM BB · HH:mm น.',
  );
}

export function fileSize(bytes: number | null | undefined): string {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 ** 2) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / 1024 ** 2).toFixed(1)} MB`;
}

export function compact(n: number): string {
  if (n < 1000) return String(n);
  if (n < 1_000_000) return `${(n / 1000).toFixed(n < 10_000 ? 1 : 0)}K`;
  return `${(n / 1_000_000).toFixed(1)}M`;
}

export function initials(name: string): string {
  return name.trim().slice(0, 1).toUpperCase() || '?';
}

export function avatarTint(seed: string): string {
  const palette = ['#FFD3DE', '#FFE2C2', '#D7F0DC', '#D6E6FF', '#EADBFF', '#FFF0B8', '#CFF1F0'];
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return palette[h % palette.length];
}

export function slugifyUsername(email: string, fallback: string): string {
  const local = email.split('@')[0]?.toLowerCase().replace(/[^a-z0-9._-]/g, '');
  return local && local.length >= 3 ? local : fallback;
}

export function timeLeft(iso: string | null | undefined, locale: Locale = 'th'): string | null {
  if (!iso) return null;
  const ms = dayjs(iso).diff(dayjs());
  const en = locale === 'en';
  if (ms <= 0) return en ? 'expired' : 'หมดอายุแล้ว';

  const hours = Math.floor(ms / 3_600_000);
  if (hours < 1) {
    const mins = Math.max(1, Math.floor(ms / 60_000));
    return en ? `${mins} min left` : `อีก ${mins} นาที`;
  }
  if (hours < 24) return en ? `${hours} hr left` : `อีก ${hours} ชั่วโมง`;

  const days = Math.floor(hours / 24);
  return en ? `${days} day${days > 1 ? 's' : ''} left` : `อีก ${days} วัน`;
}
