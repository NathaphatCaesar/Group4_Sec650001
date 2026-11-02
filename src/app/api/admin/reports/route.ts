import { NextResponse } from 'next/server';
import { getMe, getReports } from '@/lib/data';
import { rateLimit } from '@/lib/security';
import { currentUserId } from '@/lib/session';
import { parseReportFilters } from '@/lib/types';

// Task43: GET /api/admin/reports กรองรายงานสำหรับแอดมินเท่านั้น
export async function GET(req: Request) {
  try {
    const userId = await currentUserId();
    if (!userId) {
      return NextResponse.json({ error: 'กรุณาเข้าสู่ระบบ' }, { status: 401 });
    }

    const me = await getMe();
    if (!me || me.role !== 'admin') {
      return NextResponse.json({ error: 'ไม่มีสิทธิ์เข้าถึง' }, { status: 403 });
    }

    const gate = rateLimit(`admin-reports:${userId}`, { limit: 120, windowMs: 60_000 });
    if (!gate.ok) {
      return NextResponse.json({ error: 'ค้นหาถี่เกินไป กรุณารอสักครู่' }, { status: 429 });
    }

    const filters = parseReportFilters(new URL(req.url).searchParams);
    if (!filters) {
      return NextResponse.json({ error: 'ตัวกรองไม่ถูกต้อง' }, { status: 400 });
    }

    return NextResponse.json(await getReports(filters));
  } catch (err) {
    console.error('[api/admin/reports] failed', err);
    return NextResponse.json({ error: 'เกิดข้อผิดพลาด' }, { status: 500 });
  }
}
