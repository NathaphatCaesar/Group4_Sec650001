import 'server-only';
import crypto from 'node:crypto';
import { cookies } from 'next/headers';
import { db } from '@/lib/supabase';

export const SESSION_COOKIE = 'bh_session';

export function sessionMaxAgeSeconds(): number {
  const days = Number(process.env.SESSION_MAX_AGE_DAYS) || 90;
  return days * 24 * 60 * 60;
}

export function sessionCookieOptions(maxAge: number) {
  return {
    httpOnly: true,
    sameSite: 'lax' as const,
    secure: process.env.SESSION_COOKIE_SECURE === 'true',
    path: '/',
    maxAge,
  };
}

function hash(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

function isToken(token: string | undefined): token is string {
  return !!token && /^[0-9a-f]{64}$/.test(token);
}

export async function createSession(userId: string, userAgent: string | null, ip: string): Promise<string> {
  const token = crypto.randomBytes(32).toString('hex');
  const { error } = await db().from('sessions').insert({
    user_id: userId,
    token_hash: hash(token),
    user_agent: userAgent?.slice(0, 300) ?? null,
    ip,
    expires_at: new Date(Date.now() + sessionMaxAgeSeconds() * 1000).toISOString(),
  });
  if (error) throw new Error(`สร้าง session ไม่สำเร็จ: ${error.message}`);
  return token;
}

export async function userIdFromToken(token: string | undefined): Promise<string | null> {
  if (!isToken(token)) return null;
  const { data } = await db()
    .from('sessions')
    .select('user_id')
    .eq('token_hash', hash(token))
    .gt('expires_at', new Date().toISOString())
    .maybeSingle();
  return (data as { user_id: string } | null)?.user_id ?? null;
}

export async function deleteSession(token: string | undefined): Promise<void> {
  if (!isToken(token)) return;
  await db().from('sessions').delete().eq('token_hash', hash(token));
}

export async function currentUserId(): Promise<string | null> {
  const jar = await cookies();
  return userIdFromToken(jar.get(SESSION_COOKIE)?.value);
}
