import { NextResponse } from 'next/server';
import { currentUserId } from '@/lib/session';
import { rateLimit } from '@/lib/security';
import { sendPushToUsers } from '@/lib/push';

export async function POST() {
  const userId = await currentUserId();
  if (!userId) {
    return NextResponse.json({ error: 'กรุณาเข้าสู่ระบบ' }, { status: 401 });
  }

  const gate = rateLimit(`push-test:${userId}`, { limit: 5, windowMs: 60_000 });
  if (!gate.ok) {
    return NextResponse.json({ error: 'ทดสอบถี่เกินไป กรุณารอสักครู่' }, { status: 429 });
  }

  await sendPushToUsers([userId], {
    title: 'BACKHOME TU',
    body: 'ทดสอบการแจ้งเตือน 🎉 ถ้าเห็นข้อความนี้ แปลว่าใช้งานได้แล้ว',
    url: '/notifications',
  });

  return NextResponse.json({ ok: true });
}
