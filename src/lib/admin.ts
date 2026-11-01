import 'server-only';
import { db } from '@/lib/supabase';
import { studyYear } from '@/lib/tu-api';
import { TZ } from '@/lib/utils';
import type { ReportReason, ReportStatus, UserRole } from '@/lib/types';

// ข้อมูลสำหรับหน้าแดชบอร์ดแอดมิน (/admin) ผู้เรียกต้องเช็คสิทธิ์แอดมินก่อนเสมอ

export interface AdminStats {
  users: number;
  usersNew7d: number;
  suspended: number;
  posts: number;
  postsNew7d: number;
  sheets: number;
  pendingReports: number;
}

function daysAgoIso(days: number): string {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
}

export async function getAdminStats(): Promise<AdminStats> {
  const count = { count: 'exact' as const, head: true };
  const since = daysAgoIso(7);

  const [users, usersNew, suspended, posts, postsNew, sheets, pending] = await Promise.all([
    db().from('profiles').select('id', count),
    db().from('profiles').select('id', count).gte('created_at', since),
    db().from('profiles').select('id', count).eq('is_suspended', true),
    db().from('posts').select('id', count),
    db().from('posts').select('id', count).gte('created_at', since),
    db().from('posts').select('id', count).eq('tag', 'sheet'),
    db().from('reports').select('id', count).eq('status', 'pending'),
  ]);

  return {
    users: users.count ?? 0,
    usersNew7d: usersNew.count ?? 0,
    suspended: suspended.count ?? 0,
    posts: posts.count ?? 0,
    postsNew7d: postsNew.count ?? 0,
    sheets: sheets.count ?? 0,
    pendingReports: pending.count ?? 0,
  };
}

export interface ReportSummary {
  byReason: Record<ReportReason, number>;
  byStatus: Record<ReportStatus, number>;
}

export async function getReportSummary(): Promise<ReportSummary> {
  const byReason: Record<ReportReason, number> = {
    wrong_info: 0, copyright: 0, spam: 0, inappropriate: 0, privacy: 0,
  };
  const byStatus: Record<ReportStatus, number> = { pending: 0, actioned: 0, dismissed: 0 };

  const { data } = await db().from('reports').select('reason, status').limit(10000);
  for (const r of (data ?? []) as Array<{ reason: ReportReason; status: ReportStatus }>) {
    if (r.reason in byReason) byReason[r.reason] += 1;
    if (r.status in byStatus) byStatus[r.status] += 1;
  }
  return { byReason, byStatus };
}

export interface DailyCount {
  date: string; // YYYY-MM-DD ตามเวลาไทย
  count: number;
}

function bangkokDate(d: Date): string {
  return d.toLocaleDateString('en-CA', { timeZone: TZ });
}

export async function getPostsPerDay(days = 14): Promise<DailyCount[]> {
  const buckets = new Map<string, number>();
  for (let i = days - 1; i >= 0; i--) {
    buckets.set(bangkokDate(new Date(Date.now() - i * 24 * 60 * 60 * 1000)), 0);
  }

  const { data } = await db()
    .from('posts')
    .select('created_at')
    .gte('created_at', daysAgoIso(days))
    .limit(10000);
  for (const p of (data ?? []) as Array<{ created_at: string }>) {
    const key = bangkokDate(new Date(p.created_at));
    if (buckets.has(key)) buckets.set(key, (buckets.get(key) ?? 0) + 1);
  }

  return Array.from(buckets, ([date, count]) => ({ date, count }));
}

export interface AdminUserRow {
  id: string;
  username: string;
  display_name: string;
  avatar_url: string | null;
  role: UserRole;
  faculty_name: string | null;
  study_year: number | null;
  student_id: string | null;
  is_suspended: boolean;
  created_at: string;
}

export async function searchUsersForAdmin(q: string, limit = 20): Promise<AdminUserRow[]> {
  let query = db()
    .from('profiles')
    .select('id, username, display_name, avatar_url, role, role_override, faculty_name, entry_year_be, student_id, is_suspended, created_at');

  // ตัดอักขระที่มีความหมายใน filter ของ PostgREST ออก
  const term = q.trim().replace(/[,()%*\\]/g, ' ').trim().slice(0, 50);
  if (term) {
    query = query.or(`username.ilike.%${term}%,display_name.ilike.%${term}%,student_id.ilike.%${term}%`);
  } else {
    query = query.order('created_at', { ascending: false });
  }

  const { data } = await query.limit(limit);
  return ((data ?? []) as Array<Record<string, unknown>>).map((u) => ({
    id: String(u.id),
    username: String(u.username ?? 'user'),
    display_name: String(u.display_name ?? 'ผู้ใช้'),
    avatar_url: (u.avatar_url as string | null) ?? null,
    role: ((u.role_override as UserRole | null) ?? (u.role as UserRole) ?? 'student'),
    faculty_name: (u.faculty_name as string | null) ?? null,
    study_year: studyYear((u.entry_year_be as number | null) ?? null),
    student_id: (u.student_id as string | null) ?? null,
    is_suspended: Boolean(u.is_suspended),
    created_at: String(u.created_at ?? ''),
  }));
}
