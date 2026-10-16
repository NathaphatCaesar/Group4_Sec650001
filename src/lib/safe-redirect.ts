const JUNK = new RegExp('[\\u0000-\\u0020\\u007F]', 'g');

export function safeNextPath(raw: string | null | undefined, fallback = '/'): string {
  if (!raw) return fallback;

  const value = raw.replace(JUNK, '');

  if (!value.startsWith('/')) return fallback;
  if (value.startsWith('//')) return fallback;
  if (value.startsWith('/\\')) return fallback;

  return value;
}
