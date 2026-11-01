import { NextResponse } from 'next/server';
import { bookmark, unbookmark } from './bookmark';

async function update(request: Request, action: typeof bookmark | typeof unbookmark) {
  let body: { postId?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'รูปแบบคำขอไม่ถูกต้อง' }, { status: 400 });
  }

  if (typeof body.postId !== 'string') {
    return NextResponse.json({ error: 'กรุณาระบุโพสต์' }, { status: 400 });
  }

  const result = await action(body.postId);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }
  return NextResponse.json({ ok: true, bookmarked: result.bookmarked });
}

export async function POST(request: Request) {
  return update(request, bookmark);
}

export async function DELETE(request: Request) {
  return update(request, unbookmark);
}
