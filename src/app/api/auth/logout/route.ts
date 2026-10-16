import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { deleteSession, SESSION_COOKIE, sessionCookieOptions } from '@/lib/session';

export async function POST() {
  const jar = await cookies();
  await deleteSession(jar.get(SESSION_COOKIE)?.value);

  const res = NextResponse.json({ ok: true });
  res.cookies.set(SESSION_COOKIE, '', sessionCookieOptions(0));
  return res;
}
