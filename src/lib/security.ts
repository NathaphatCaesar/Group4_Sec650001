type Bucket = { count: number; resetAt: number };
const buckets = new Map<string, Bucket>();

export function rateLimit(
  key: string,
  { limit, windowMs }: { limit: number; windowMs: number },
): { ok: boolean; retryAfterSeconds: number } {
  const now = Date.now();

  if (buckets.size > 5000) {
    for (const [k, b] of buckets) if (b.resetAt <= now) buckets.delete(k);
  }

  const hit = buckets.get(key);
  if (!hit || hit.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, retryAfterSeconds: 0 };
  }

  hit.count += 1;
  if (hit.count > limit) {
    return { ok: false, retryAfterSeconds: Math.ceil((hit.resetAt - now) / 1000) };
  }
  return { ok: true, retryAfterSeconds: 0 };
}

export function clientIp(headers: Headers): string {
  return (
    headers.get('cf-connecting-ip') ??
    headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    'unknown'
  );
}

export async function fetchWithTimeout(
  input: string | URL | Request,
  init: RequestInit = {},
  timeoutMs = 12_000,
): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(input, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}
