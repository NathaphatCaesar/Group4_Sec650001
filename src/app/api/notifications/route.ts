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

    // เติมชื่อคนทำ (actor) และหัวข้อโพสต์ เพื่อให้แสดงผลและกดลิงก์ได้
    const rows = (listResult.data ?? []) as Array<{ actor_id: string | null; post_id: string | null }>;
    const actorIds = [...new Set(rows.map((r) => r.actor_id).filter((id): id is string => Boolean(id)))];
    const postIds = [...new Set(rows.map((r) => r.post_id).filter((id): id is string => Boolean(id)))];
    const [actorsResult, postsResult] = await Promise.all([
      actorIds.length
        ? client.from('profiles').select('id, username, display_name, avatar_url, role').in('id', actorIds)
        : Promise.resolve({ data: [] }),
      postIds.length
        ? client.from('posts').select('id, title, author_id').in('id', postIds)
        : Promise.resolve({ data: [] }),
    ]);
    const actors = new Map(
      ((actorsResult.data ?? []) as Array<{ id: string; username: string; display_name: string; avatar_url: string | null; role: string }>)
        .map((a) => [a.id, a]),
    );
    const posts = new Map(
      ((postsResult.data ?? []) as Array<{ id: string; title: string | null; author_id: string }>)
        .map((p) => [p.id, p]),
    );

    return NextResponse.json({
      notifications: rows.map((row) => ({
        ...row,
        actor: row.actor_id ? actors.get(row.actor_id) ?? null : null,
        post_title: row.post_id ? posts.get(row.post_id)?.title ?? null : null,
      })),
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
