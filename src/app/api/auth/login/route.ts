import { NextResponse } from 'next/server';
import { tuVerify, TuApiError } from '@/lib/tu-api';
import { syncTuUser, AuthError } from '@/lib/auth';
import { createSession, SESSION_COOKIE, sessionCookieOptions, sessionMaxAgeSeconds } from '@/lib/session';
import { clientIp, rateLimit } from '@/lib/security';

export async function POST(request: Request) {
  const ip = clientIp(request.headers);
  const gate = rateLimit(`login:${ip}`, { limit: 8, windowMs: 10 * 60_000 });
  if (!gate.ok) {
    return NextResponse.json(
      { error: 'ลองล็อกอินบ่อยเกินไป รออีก {sec} วินาทีแล้วลองใหม่', vars: { sec: gate.retryAfterSeconds } },
      { status: 429, headers: { 'Retry-After': String(gate.retryAfterSeconds) } },
    );
  }

  let body: { username?: string; password?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'รูปแบบคำขอไม่ถูกต้อง' }, { status: 400 });
  }

  const username = body.username?.trim() ?? '';
  const password = body.password ?? '';
  if (!username || !password) {
    return NextResponse.json({ error: 'กรอกบัญชี มธ. และรหัสผ่านให้ครบ' }, { status: 400 });
  }
  if (username.length > 64 || password.length > 256) {
    return NextResponse.json({ error: 'บัญชี มธ. หรือรหัสผ่านยาวเกินไป' }, { status: 400 });
  }

  try {
    const verified = await tuVerify(username, password);
    const profile = await syncTuUser(verified, username);
    const token = await createSession(String(profile.id), request.headers.get('user-agent'), ip);

    const res = NextResponse.json({ ok: true });
    res.cookies.set(SESSION_COOKIE, token, sessionCookieOptions(sessionMaxAgeSeconds()));
    return res;
  } catch (err) {
    if (err instanceof TuApiError) {
      return NextResponse.json(
        { error: err.message, detail: err.isUserFault ? undefined : err.detail },
        { status: err.status },
      );
    }
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    console.error('[login]', err);
    return NextResponse.json({ error: 'ฐานข้อมูลมีปัญหา ลองใหม่อีกครั้ง' }, { status: 502 });
  }
}
