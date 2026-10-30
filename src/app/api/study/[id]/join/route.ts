import { NextResponse } from 'next/server';
import { db } from '@/lib/supabase';
import { notifySafely } from '@/lib/notifications';
import { dbErrorResponse, errorResponse, guard } from '@/lib/study';

interface JoinResult {
  status: 'pending' | 'approved';
  owner_id: string;
  title: string | null;
  capacity: number | null;
  signup_count: number;
}

// ขอเข้าร่วมนัดติว: ถ้าต้องอนุมัติจะได้ pending ไม่งั้น approved ทันที แล้วแจ้งเตือนเจ้าของ (study_signup)
export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const auth = await guard(id, 'join');
  if ('response' in auth) return auth.response;

  const { data, error } = await db().rpc('study_request_join', {
    p_post_id: id,
    p_user_id: auth.userId,
  });
  if (error) return dbErrorResponse(error, 'join');

  const result = data as JoinResult;
  await notifySafely({
    recipientId: result.owner_id,
    actorId: auth.userId,
    type: 'study_signup',
    postId: id,
    payload: { title: result.title, status: result.status },
  });

  return NextResponse.json(
    {
      ok: true,
      status: result.status,
      signup_count: result.signup_count,
      capacity: result.capacity,
    },
    { status: 201 },
  );
}

// ยกเลิกคำขอ / ออกจากนัดติว (คำขอที่ถูกปฏิเสธแล้วลบเองไม่ได้ เพื่อไม่ให้ส่งคำขอซ้ำ)
export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const auth = await guard(id, 'join');
  if ('response' in auth) return auth.response;

  const { data, error } = await db()
    .from('study_members')
    .delete()
    .eq('post_id', id)
    .eq('user_id', auth.userId)
    .in('status', ['pending', 'approved'])
    .select('status');

  if (error) {
    console.error('[study] cancel failed:', error.message);
    return errorResponse(500, 'ยกเลิกคำขอไม่สำเร็จ');
  }
  if (!data || data.length === 0) {
    return errorResponse(404, 'ไม่พบคำขอเข้าร่วมนี้');
  }
  return NextResponse.json({ ok: true, status: 'none' });
}
