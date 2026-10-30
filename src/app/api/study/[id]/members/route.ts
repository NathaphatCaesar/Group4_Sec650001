import { NextResponse } from 'next/server';
import { db } from '@/lib/supabase';
import { errorResponse, guard } from '@/lib/study';

interface MemberRow {
  user_id: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  decided_at: string | null;
}

// จำนวนที่นั่ง + สถานะของฉัน; เจ้าของนัดติวได้รายชื่อผู้ขอเข้าร่วมทั้งหมดด้วย
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const auth = await guard(id, 'members');
  if ('response' in auth) return auth.response;

  const { data: post, error: postError } = await db()
    .from('posts')
    .select('id, author_id, tag, is_hidden, capacity, requires_approval')
    .eq('id', id)
    .maybeSingle();
  if (postError) {
    console.error('[study] post lookup failed:', postError.message);
    return errorResponse(500, 'โหลดข้อมูลนัดติวไม่สำเร็จ');
  }
  if (!post || post.tag !== 'studybuddy' || post.is_hidden) {
    return errorResponse(404, 'ไม่พบนัดติวนี้');
  }

  const { data, error } = await db()
    .from('study_members')
    .select('user_id, status, created_at, decided_at')
    .eq('post_id', id)
    .order('created_at', { ascending: true });
  if (error) {
    console.error('[study] members lookup failed:', error.message);
    return errorResponse(500, 'โหลดข้อมูลนัดติวไม่สำเร็จ');
  }

  const rows = (data ?? []) as MemberRow[];
  const isOwner = post.author_id === auth.userId;
  const summary = {
    capacity: post.capacity as number | null,
    requires_approval: post.requires_approval as boolean,
    signup_count: rows.filter((r) => r.status === 'approved').length,
    pending_count: rows.filter((r) => r.status === 'pending').length,
    my_status: rows.find((r) => r.user_id === auth.userId)?.status ?? 'none',
    is_owner: isOwner,
  };
  if (!isOwner) return NextResponse.json(summary);

  const userIds = rows.map((r) => r.user_id);
  const { data: profiles } = userIds.length
    ? await db()
        .from('profiles')
        .select('id, username, display_name, avatar_url, role')
        .in('id', userIds)
    : { data: [] };
  const byId = new Map(((profiles ?? []) as Array<{ id: string }>).map((p) => [p.id, p]));

  return NextResponse.json({
    ...summary,
    members: rows.map((r) => ({ ...r, user: byId.get(r.user_id) ?? null })),
  });
}
