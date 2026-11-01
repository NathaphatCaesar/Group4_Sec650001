import { NextResponse } from 'next/server';
import { currentUserId } from '@/lib/session';
import { db } from '@/lib/supabase';

function isValidEndpoint(value: unknown): value is string {
  if (typeof value !== 'string' || value.length > 1000) return false;
  try {
    return new URL(value).protocol === 'https:';
  } catch {
    return false;
  }
}

export async function POST(request: Request) {
  const userId = await currentUserId();
  if (!userId) {
    return NextResponse.json({ error: 'กรุณาเข้าสู่ระบบ' }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const endpoint = body?.endpoint;
  const p256dh = body?.keys?.p256dh;
  const auth = body?.keys?.auth;

  if (
    !isValidEndpoint(endpoint) ||
    typeof p256dh !== 'string' || p256dh.length > 200 ||
    typeof auth !== 'string' || auth.length > 100
  ) {
    return NextResponse.json({ error: 'ข้อมูลคำขอไม่ถูกต้อง' }, { status: 400 });
  }

  const { error } = await db()
    .from('push_subscriptions')
    .upsert(
      {
        user_id: userId,
        endpoint,
        p256dh,
        auth,
        user_agent: request.headers.get('user-agent')?.slice(0, 300) ?? null,
      },
      { onConflict: 'endpoint' },
    );

  if (error) {
    console.error('Save push subscription failed:', error.message);
    return NextResponse.json({ error: 'เปิดการแจ้งเตือนไม่สำเร็จ' }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

export async function DELETE(request: Request) {
  const userId = await currentUserId();
  if (!userId) {
    return NextResponse.json({ error: 'กรุณาเข้าสู่ระบบ' }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  if (!isValidEndpoint(body?.endpoint)) {
    return NextResponse.json({ error: 'ข้อมูลคำขอไม่ถูกต้อง' }, { status: 400 });
  }

  const { error } = await db()
    .from('push_subscriptions')
    .delete()
    .eq('user_id', userId)
    .eq('endpoint', body.endpoint);

  if (error) {
    console.error('Delete push subscription failed:', error.message);
    return NextResponse.json({ error: 'ปิดการแจ้งเตือนไม่สำเร็จ' }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
