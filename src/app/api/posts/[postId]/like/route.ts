import { NextRequest, NextResponse } from 'next/server';
import { currentUserId } from '@/lib/session';
import { getMe } from '@/lib/data';
import { db } from '@/lib/supabase';
import { notifySafely } from '@/lib/notifications';

type RouteContext = {
  params: Promise<{ postId: string }>;
};

async function toggleLike(
  request: NextRequest,
  context: RouteContext,
  liked: boolean
) {
  try {
    const userId = await currentUserId();

    if (!userId) {
      return NextResponse.json(
        { error: 'กรุณาเข้าสู่ระบบก่อน' },
        { status: 401 }
      );
    }

    const me = await getMe();

    if (!me) {
      return NextResponse.json(
        { error: 'ไม่สามารถใช้งานบัญชีนี้ได้' },
        { status: 403 }
      );
    }

    const { postId } = await context.params;

    const postResult = await db()
      .from('posts')
      .select('author_id')
      .eq('id', postId)
      .maybeSingle();

    if (postResult.error || !postResult.data) {
      return NextResponse.json(
        { error: 'ไม่พบโพสต์' },
        { status: 404 }
      );
    }

    const { data, error } = await db().rpc('toggle_post_like', {
      p_post_id: postId,
      p_user_id: me.id,
      p_liked: liked,
    });

    if (error) {
      if (error.message.includes('post_not_found')) {
        return NextResponse.json(
          { error: 'ไม่พบโพสต์' },
          { status: 404 }
        );
      }

      if (error.message.includes('cannot_like_own_post')) {
        return NextResponse.json(
          { error: 'ไม่สามารถกดไลก์โพสต์ของตัวเองได้' },
          { status: 400 }
        );
      }

      console.error('Toggle like error:', error);

      return NextResponse.json(
        { error: 'ไม่สามารถเปลี่ยนสถานะไลก์ได้' },
        { status: 500 }
      );
    }

    if (liked && data?.changed) {
      await notifySafely({
        recipientId: postResult.data.author_id,
        actorId: me.id,
        type: 'like',
        postId,
      });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Like API error:', error);

    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดภายในระบบ' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  context: RouteContext
) {
  return toggleLike(request, context, true);
}

export async function DELETE(
  request: NextRequest,
  context: RouteContext
) {
  return toggleLike(request, context, false);
}