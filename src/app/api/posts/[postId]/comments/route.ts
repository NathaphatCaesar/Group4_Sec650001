import { NextResponse } from 'next/server';
import { db } from '@/lib/supabase';
import { currentUserId } from '@/lib/session';
import { getMe } from '@/lib/data';
import { notifySafely } from '@/lib/notifications';
import { studyYear } from '@/lib/tu-api';

type Context = {
  params: Promise<{ postId: string }>;
};

export async function GET(
  _request: Request,
  { params }: Context,
) {
  try {
    const { postId } = await params;

    const { data: post, error: postError } = await db()
      .from('posts')
      .select('id, author_id, visibility, is_hidden')
      .eq('id', postId)
      .maybeSingle();

    if (postError) {
      return NextResponse.json(
        { error: 'โหลดข้อมูลโพสต์ไม่สำเร็จ' },
        { status: 500 },
      );
    }

    if (!post || post.is_hidden || post.visibility !== 'public') {
      return NextResponse.json(
        { error: 'ไม่พบโพสต์นี้' },
        { status: 404 },
      );
    }

    const { data: comments, error } = await db()
      .from('comments')
      .select('id, post_id, author_id, parent_id, body, like_count, created_at')
      .eq('post_id', postId)
      .order('created_at', { ascending: true });

    if (error) {
      return NextResponse.json(
        { error: 'โหลดคอมเมนต์ไม่สำเร็จ' },
        { status: 500 },
      );
    }

    const authorIds = [
      ...new Set((comments ?? []).map((c) => c.author_id)),
    ];

    const { data: profiles } = authorIds.length
      ? await db()
          .from('profiles')
          .select('id, username, display_name, avatar_url, role, role_override, faculty_name, entry_year_be')
          .in('id', authorIds)
      : { data: [] };

    const authorMap = new Map(
      (profiles ?? []).map((p) => [
        p.id,
        {
          id: p.id,
          username: p.username,
          display_name: p.display_name,
          avatar_url: p.avatar_url,
          equipped_frame: null,
          role: p.role_override ?? p.role,
          study_year: studyYear(p.entry_year_be),
          faculty_name: p.faculty_name,
        },
      ]),
    );

    return NextResponse.json({
      comments: (comments ?? []).map((comment) => ({
        id: comment.id,
        post_id: comment.post_id,
        parent_id: comment.parent_id,
        body: comment.body,
        like_count: comment.like_count,
        created_at: comment.created_at,
        liked: false,
        author: authorMap.get(comment.author_id) ?? null,
      })),
    });
  } catch (error) {
    console.error('Comments GET failed:', error);
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในการโหลดคอมเมนต์' },
      { status: 500 },
    );
  }
}

export async function POST(
  request: Request,
  { params }: Context,
) {
  try {
    const userId = await currentUserId();

    if (!userId) {
      return NextResponse.json(
        { error: 'กรุณาเข้าสู่ระบบ' },
        { status: 401 },
      );
    }

    const me = await getMe();

    if (!me) {
      return NextResponse.json(
        { error: 'ไม่พบบัญชีผู้ใช้ หรือบัญชีถูกระงับ' },
        { status: 403 },
      );
    }

    const { postId } = await params;

    let body: {
      body?: unknown;
      parentId?: unknown;
    };

    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: 'รูปแบบคำขอไม่ถูกต้อง' },
        { status: 400 },
      );
    }

    if (typeof body.body !== 'string') {
      return NextResponse.json(
        { error: 'กรุณากรอกข้อความคอมเมนต์' },
        { status: 400 },
      );
    }

    const commentBody = body.body.trim();

    if (!commentBody || commentBody.length > 2000) {
      return NextResponse.json(
        { error: 'คอมเมนต์ต้องมีความยาว 1–2000 ตัวอักษร' },
        { status: 400 },
      );
    }

    const { data: post, error: postError } = await db()
      .from('posts')
      .select('id, author_id, visibility, is_hidden')
      .eq('id', postId)
      .maybeSingle();

    if (postError) {
      return NextResponse.json(
        { error: 'ตรวจสอบโพสต์ไม่สำเร็จ' },
        { status: 500 },
      );
    }

    if (!post || post.is_hidden || post.visibility !== 'public') {
      return NextResponse.json(
        { error: 'ไม่พบโพสต์นี้' },
        { status: 404 },
      );
    }

    let parentId: number | null = null;

if (body.parentId !== undefined && body.parentId !== null) {
  const parsedParentId = Number(body.parentId);

  if (!Number.isSafeInteger(parsedParentId) || parsedParentId <= 0) {
    return NextResponse.json(
      { error: 'parentId ไม่ถูกต้อง' },
      { status: 400 },
    );
  }

  const { data: parent, error: parentError } = await db()
    .from('comments')
    .select('id, post_id')
    .eq('id', parsedParentId)
    .maybeSingle();

  if (parentError) {
    return NextResponse.json(
      { error: 'ตรวจสอบคอมเมนต์ต้นทางไม่สำเร็จ' },
      { status: 500 },
    );
  }

  if (!parent || parent.post_id !== postId) {
    return NextResponse.json(
      { error: 'ไม่พบคอมเมนต์ต้นทาง' },
      { status: 404 },
    );
  }

  parentId = parent.id;
}

    const { data: comment, error } = await db()
      .from('comments')
      .insert({
        post_id: postId,
        author_id: me.id,
        parent_id: parentId,
        body: commentBody,
      })
      .select('id, post_id, parent_id, body, like_count, created_at')
      .single();

    if (error || !comment) {
      console.error('Create comment failed:', error?.message);
      return NextResponse.json(
        { error: 'เพิ่มคอมเมนต์ไม่สำเร็จ' },
        { status: 500 },
      );
    }

    await notifySafely({
      recipientId: post.author_id,
      actorId: me.id,
      type: parentId ? 'reply' : 'comment',
      postId,
      commentId: comment.id,
      payload: {
        comment: commentBody.slice(0, 100),
      },
    });

    return NextResponse.json(
      { ok: true, comment },
      { status: 201 },
    );
  } catch (error) {
    console.error('Comments POST failed:', error);
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในการเพิ่มคอมเมนต์' },
      { status: 500 },
    );
  }
}