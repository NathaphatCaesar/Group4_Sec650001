import { NextRequest, NextResponse } from 'next/server';
import { getMe, getPolls } from '@/lib/data';
import { db } from '@/lib/supabase';

type RouteContext = { params: Promise<{ postId: string }> };

async function result(postId: string, userId: string) {
  const polls = await getPolls([postId], userId);
  return NextResponse.json(polls.get(postId) ?? null);
}

// POST { optionId } = โหวต/เปลี่ยนโหวต
export async function POST(request: NextRequest, context: RouteContext) {
  const me = await getMe();
  if (!me) return NextResponse.json({ error: 'กรุณาเข้าสู่ระบบก่อน' }, { status: 401 });
  if (me.is_suspended) return NextResponse.json({ error: 'บัญชีถูกระงับ' }, { status: 403 });

  const { postId } = await context.params;
  const body = await request.json().catch(() => ({}));
  const optionId = typeof body?.optionId === 'string' ? body.optionId : '';

  const { data: option } = await db()
    .from('poll_options')
    .select('id')
    .eq('id', optionId)
    .eq('post_id', postId)
    .maybeSingle();
  if (!option) return NextResponse.json({ error: 'ไม่พบตัวเลือกนี้' }, { status: 404 });

  const { error } = await db()
    .from('poll_votes')
    .upsert({ post_id: postId, user_id: me.id, option_id: optionId }, { onConflict: 'post_id,user_id' });
  if (error) {
    console.error('Poll vote error:', error);
    return NextResponse.json({ error: 'โหวตไม่สำเร็จ' }, { status: 500 });
  }
  return result(postId, me.id);
}

// DELETE = ถอนโหวต
export async function DELETE(_request: NextRequest, context: RouteContext) {
  const me = await getMe();
  if (!me) return NextResponse.json({ error: 'กรุณาเข้าสู่ระบบก่อน' }, { status: 401 });
  const { postId } = await context.params;
  const { error } = await db().from('poll_votes').delete().eq('post_id', postId).eq('user_id', me.id);
  if (error) return NextResponse.json({ error: 'ถอนโหวตไม่สำเร็จ' }, { status: 500 });
  return result(postId, me.id);
}
