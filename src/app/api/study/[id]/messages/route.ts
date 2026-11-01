import { NextResponse } from 'next/server';
import { db } from '@/lib/supabase';
import { notifyManySafely } from '@/lib/notifications';
import { errorResponse, guard, UUID_PATTERN } from '@/lib/study';
import { broadcastNewMessage, getChatAccess, listMessages, MESSAGE_MAX } from '@/lib/study-chat';

// ดึงข้อความในแชทกลุ่มนัดติว ?after=<ISO> เพื่อดึงเฉพาะข้อความใหม่
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const auth = await guard(id, 'chat-read');
  if ('response' in auth) return auth.response;

  const access = await getChatAccess(id, auth.userId);
  if (!access) return errorResponse(403, 'เฉพาะสมาชิกนัดติวนี้');

  const after = new URL(request.url).searchParams.get('after');
  const validAfter = after && !Number.isNaN(Date.parse(after)) ? after : null;
  const messages = await listMessages(id, validAfter);
  return NextResponse.json({ messages, is_open: access.isOpen });
}

// ส่งข้อความ (ตัวอักษร และ/หรือรูปที่อัปโหลดผ่าน /api/upload แล้ว)
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const auth = await guard(id, 'chat-send');
  if ('response' in auth) return auth.response;

  const access = await getChatAccess(id, auth.userId);
  if (!access) return errorResponse(403, 'เฉพาะสมาชิกนัดติวนี้');
  if (!access.isOpen) return errorResponse(409, 'แชทนี้ปิดแล้ว');

  const input = await request.json().catch(() => null) as { body?: unknown; imageId?: unknown } | null;
  const text = typeof input?.body === 'string' ? input.body.trim() : '';
  const imageId = typeof input?.imageId === 'string' && UUID_PATTERN.test(input.imageId) ? input.imageId : null;
  if (!text && !imageId) return errorResponse(400, 'พิมพ์ข้อความหรือแนบรูปก่อนส่ง');
  if (text.length > MESSAGE_MAX) return errorResponse(400, 'ข้อความยาวเกินไป');

  if (imageId) {
    const { data: file } = await db()
      .from('files')
      .select('id, owner_id, kind')
      .eq('id', imageId)
      .maybeSingle();
    const f = file as { owner_id: string; kind: string } | null;
    if (!f || f.owner_id !== auth.userId || f.kind !== 'image') {
      return errorResponse(400, 'รูปนี้ใช้ไม่ได้');
    }
  }

  const { error } = await db().from('study_messages').insert({
    post_id: id,
    user_id: auth.userId,
    body: text || null,
    image_id: imageId,
  });
  if (error) {
    console.error('[study-chat] send failed:', error.message);
    return errorResponse(500, 'ส่งข้อความไม่สำเร็จ');
  }

  await broadcastNewMessage(id);

  // แจ้งเตือนสมาชิกที่ยังไม่มีแจ้งเตือนข้อความค้างของกลุ่มนี้ ไม่ให้เด้งทุกข้อความ
  const others = access.memberIds.filter((m) => m !== auth.userId);
  if (others.length) {
    const { data: unread } = await db()
      .from('notifications')
      .select('recipient_id')
      .eq('type', 'message')
      .eq('post_id', id)
      .is('read_at', null)
      .in('recipient_id', others);
    const already = new Set(((unread ?? []) as Array<{ recipient_id: string }>).map((r) => r.recipient_id));
    await notifyManySafely(others.filter((m) => !already.has(m)), {
      actorId: auth.userId,
      type: 'message',
      postId: id,
      payload: { title: access.title },
    });
  }

  return NextResponse.json({ ok: true }, { status: 201 });
}
