import { NextResponse } from 'next/server';
import { db } from '@/lib/supabase';
import { currentUserId } from '@/lib/session';
import { getMe } from '@/lib/data';

type Context = {
  params: Promise<{ commentId: string }>;
};

export async function DELETE(
  _request: Request,
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

    const { commentId } = await params;

    const { data: comment, error: findError } = await db()
      .from('comments')
      .select('id, author_id')
      .eq('id', commentId)
      .maybeSingle();

    if (findError) {
      return NextResponse.json(
        { error: 'ตรวจสอบคอมเมนต์ไม่สำเร็จ' },
        { status: 500 },
      );
    }

    if (!comment) {
      return NextResponse.json(
        { error: 'ไม่พบคอมเมนต์นี้' },
        { status: 404 },
      );
    }

    if (comment.author_id !== me.id && me.role !== 'admin') {
      return NextResponse.json(
        { error: 'ไม่มีสิทธิ์ลบคอมเมนต์นี้' },
        { status: 403 },
      );
    }

    const { error: deleteError } = await db()
      .from('comments')
      .delete()
      .eq('id', commentId);

    if (deleteError) {
      return NextResponse.json(
        { error: 'ลบคอมเมนต์ไม่สำเร็จ' },
        { status: 500 },
      );
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Comments DELETE failed:', error);
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในการลบคอมเมนต์' },
      { status: 500 },
    );
  }
}