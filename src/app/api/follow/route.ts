import { NextResponse } from 'next/server';
import { follow, unfollow } from './follow';

async function update(request: Request, action: typeof follow | typeof unfollow) {
  let body: { targetUserId?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'รูปแบบคำขอไม่ถูกต้อง' }, { status: 400 });
  }

  if (typeof body.targetUserId !== 'string') {
    return NextResponse.json({ error: 'กรุณาระบุบัญชีผู้ใช้' }, { status: 400 });
  }

  const result = await action(body.targetUserId);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }
  return NextResponse.json({ ok: true, following: result.following });
}

export async function POST(request: Request) {
  return update(request, follow);
}

export async function DELETE(request: Request) {
  return update(request, unfollow);
}