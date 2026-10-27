import { NextResponse } from 'next/server';
import { currentUserId } from '@/lib/session';
import { db } from '@/lib/supabase';

export async function GET() {
  try {
    const userId = await currentUserId();

    if (!userId) {
      return NextResponse.json(
        { error: 'กรุณาเข้าสู่ระบบ' },
        { status: 401 },
      );
    }

    // Fetch the latest 50 notifications for display and count ALL unread rows
    // separately so the badge does not stop at 50.
    const client = db();
    const [listResult, unreadResult] = await Promise.all([
      client
        .from('notifications')
        .select('*')
        .eq('recipient_id', userId)
        .order('created_at', { ascending: false })
        .limit(50),
      client
        .from('notifications')
        .select('id', { count: 'exact', head: true })
        .eq('recipient_id', userId)
        .is('read_at', null),
    ]);

    if (listResult.error) {
      console.error('Fetch notifications failed:', listResult.error.message);
      return NextResponse.json(
        { error: 'ไม่สามารถโหลดการแจ้งเตือนได้' },
        { status: 500 },
      );
    }

    if (unreadResult.error) {
      console.error('Count unread notifications failed:', unreadResult.error.message);
      return NextResponse.json(
        { error: 'ไม่สามารถนับการแจ้งเตือนที่ยังไม่ได้อ่านได้' },
        { status: 500 },
      );
    }

    return NextResponse.json({
      notifications: listResult.data ?? [],
      unreadCount: unreadResult.count ?? 0,
    });
  } catch (error) {
    console.error('Notifications GET failed:', error);
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในการโหลดการแจ้งเตือน' },
      { status: 500 },
    );
  }
}
