import { NextRequest, NextResponse } from 'next/server';
import { getMe } from '@/lib/data';
import { db } from '@/lib/supabase';
import { notifySafely } from '@/lib/notifications';

type RouteContext = { params: Promise<{ postId: string }> };

const BEST_ANSWER_STARS = 25;
const STAR_REASON = 'คำตอบถูกเลือกเป็นคำตอบที่ดีที่สุด';

async function loadOwnQaPost(postId: string) {
  const me = await getMe();
  if (!me) return { error: NextResponse.json({ error: 'กรุณาเข้าสู่ระบบก่อน' }, { status: 401 }) };
  const { data: post } = await db()
    .from('posts')
    .select('id, author_id, tag, accepted_comment_id')
    .eq('id', postId)
    .maybeSingle();
  if (!post) return { error: NextResponse.json({ error: 'ไม่พบโพสต์' }, { status: 404 }) };
  if (post.tag !== 'qa') {
    return { error: NextResponse.json({ error: 'เลือกคำตอบได้เฉพาะโพสต์ถาม-ตอบ' }, { status: 400 }) };
  }
  if (post.author_id !== me.id) {
    return { error: NextResponse.json({ error: 'เฉพาะเจ้าของคำถามเท่านั้นที่เลือกคำตอบได้' }, { status: 403 }) };
  }
  return { me, post: post as { id: string; author_id: string; accepted_comment_id: number | null } };
}

// POST { commentId } = เลือกคำตอบที่ดีที่สุด
export async function POST(request: NextRequest, context: RouteContext) {
  const { postId } = await context.params;
  const res = await loadOwnQaPost(postId);
  if ('error' in res) return res.error;
  const { me } = res;

  const body = await request.json().catch(() => ({}));
  const commentId = Number(body?.commentId);
  if (!Number.isSafeInteger(commentId)) {
    return NextResponse.json({ error: 'ไม่พบคอมเมนต์นี้' }, { status: 400 });
  }

  const { data: comment } = await db()
    .from('comments')
    .select('id, author_id')
    .eq('id', commentId)
    .eq('post_id', postId)
    .maybeSingle();
  if (!comment) return NextResponse.json({ error: 'ไม่พบคอมเมนต์นี้' }, { status: 404 });

  const { error } = await db().from('posts').update({ accepted_comment_id: commentId }).eq('id', postId);
  if (error) {
    console.error('Accept answer error:', error);
    return NextResponse.json({ error: 'เลือกคำตอบไม่สำเร็จ' }, { status: 500 });
  }

  // ให้ดาวผู้ตอบ (ไม่ใช่ตัวเอง) ครั้งเดียวต่อโพสต์ต่อคน กันกดสลับไปมาเพื่อปั๊มดาว
  let starsAwarded = 0;
  if (comment.author_id !== me.id) {
    const { data: already } = await db()
      .from('star_events')
      .select('id')
      .eq('user_id', comment.author_id)
      .eq('post_id', postId)
      .eq('reason', STAR_REASON)
      .limit(1);
    if (!already?.length) {
      const { data: profile } = await db()
        .from('profiles').select('stars').eq('id', comment.author_id).maybeSingle();
      await db().from('profiles')
        .update({ stars: Number(profile?.stars ?? 0) + BEST_ANSWER_STARS })
        .eq('id', comment.author_id);
      await db().from('star_events').insert({
        user_id: comment.author_id, post_id: postId, reason: STAR_REASON, delta: BEST_ANSWER_STARS,
      });
      starsAwarded = BEST_ANSWER_STARS;
    }
    await notifySafely({
      recipientId: comment.author_id,
      actorId: me.id,
      type: 'answer_accepted',
      postId,
      commentId,
    });
  }

  return NextResponse.json({ accepted_comment_id: String(commentId), starsAwarded });
}

// DELETE = ยกเลิกคำตอบที่เลือก
export async function DELETE(_request: NextRequest, context: RouteContext) {
  const { postId } = await context.params;
  const res = await loadOwnQaPost(postId);
  if ('error' in res) return res.error;
  const { error } = await db().from('posts').update({ accepted_comment_id: null }).eq('id', postId);
  if (error) return NextResponse.json({ error: 'ยกเลิกไม่สำเร็จ' }, { status: 500 });
  return NextResponse.json({ accepted_comment_id: null });
}
