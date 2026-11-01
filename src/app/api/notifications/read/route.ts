
import { NextResponse } from 'next/server';
import { currentUserId } from '@/lib/session';
import { db } from '@/lib/supabase';

export async function PATCH(request: Request) {
  try {
    const userId = await currentUserId();

    if (!userId) {
      return NextResponse.json(
        { error: 'กรุณาเข้าสู่ระบบ' },
        { status: 401 },
      );
    }

    const body = await request.json().catch(() => null);

    if (
      !body ||
      (body.id !== undefined && typeof body.id !== 'string') ||
      (body.all !== undefined && typeof body.all !== 'boolean') ||
      (body.id === undefined && body.all !== true)
    ) {
      return NextResponse.json(
        { error: 'ข้อมูลคำขอไม่ถูกต้อง' },
        { status: 400 },
      );
    }

    let query = db()
      .from('notifications')
      .update({ read_at: new Date().toISOString() })
      .eq('recipient_id', userId)
      .is('read_at', null);

    if (typeof body.id === 'string') {
      query = query.eq('id', body.id);
    }

    const { data, error } = await query.select('id');

    if (error) {
      console.error('Mark notification as read failed:', error.message);
      return NextResponse.json(
        { error: 'ไม่สามารถอัปเดตการแจ้งเตือนได้' },
        { status: 500 },
      );
    }

    if (typeof body.id === 'string' && (!data || data.length === 0)) {
      return NextResponse.json(
        { error: 'ไม่พบการแจ้งเตือนที่ยังไม่ได้อ่านของคุณ' },
        { status: 404 },
      );
    }

    return NextResponse.json({
      ok: true,
      updatedCount: data?.length ?? 0,
    });
  } catch (error) {
    console.error('Notifications PATCH failed:', error);
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในการอัปเดตการแจ้งเตือน' },
      { status: 500 },
    );
  }
}
