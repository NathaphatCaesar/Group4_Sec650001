import 'server-only';
import { cache } from 'react';
import { db } from '@/lib/supabase';
import { currentUserId } from '@/lib/session';
import { studyYear } from '@/lib/tu-api';
import { parseAccent, type Accent } from '@/lib/accent';
import type {
  Attachment,
  Author,
  Faculty,
  FeedScope,
  FeedSort,
  Post,
  PostTag,
  PersonCard,
  ProfileView,
  ReportAction,
  ReportItem,
  ReportReason,
  ReportStatus,
  Subject,
  UserRole,
} from '@/lib/types';

export interface Me {
  id: string;
  username: string;
  display_name: string;
  avatar_url: string | null;
  equipped_frame: string | null;
  role: UserRole;
  faculty_id: string | null;
  faculty_name: string | null;
  study_year: number | null;
  stars: number;
  is_suspended: boolean;
  accent: Accent | null;
  real_name: string | null;
  student_id: string | null;
}

export interface FeedParams {
  tag: PostTag | null;
  subject: string | null;
  group: string | null;
  faculty: string | null;
  scope: FeedScope;
  sort: FeedSort;
  limit: number;
  offset: number;
}

export const getMe = cache(async (): Promise<Me | null> => {
  const userId = await currentUserId();
  if (!userId) return null;

  const { data } = await db()
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle();
  if (!data) return null;

  const row = data as {
    id: string;
    username: string;
    display_name: string;
    avatar_url: string | null;
    role: UserRole;
    role_override: UserRole | null;
    faculty_id: string | null;
    faculty_name: string | null;
    entry_year_be: number | null;
    stars?: number | null;
    is_suspended: boolean;
    accent?: unknown;
    display_name_th?: string | null;
    student_id?: string | null;
  };
  if (row.is_suspended) return null;

  return {
    id: row.id,
    username: row.username,
    display_name: row.display_name,
    avatar_url: row.avatar_url,
    equipped_frame: null,
    role: row.role_override ?? row.role,
    faculty_id: row.faculty_id,
    faculty_name: row.faculty_name,
    study_year: studyYear(row.entry_year_be),
    stars: Number(row.stars ?? 0),
    is_suspended: row.is_suspended,
    accent: parseAccent(row.accent),
    real_name: row.display_name_th ?? null,
    student_id: row.student_id ?? null,
  };
});

export const getFaculties = cache(async (): Promise<Faculty[]> => {
  const { data } = await db().from('faculties').select('*').order('sort_order');
  return (data ?? []) as Faculty[];
});

const SEED_SUBJECTS: Subject[] = [
  ['MATH101', 'แคลคูลัสพื้นฐาน', 'sci', 'MATH'],
  ['MATH102', 'แคลคูลัส 1', 'sci', 'MATH'],
  ['MATH103', 'แคลคูลัส 2', 'sci', 'MATH'],
  ['MATH216', 'พีชคณิตเชิงเส้น', 'sci', 'MATH'],
  ['MA211', 'สถิติเบื้องต้น', 'sci', 'MATH'],
  ['PHY101', 'ฟิสิกส์ 1', 'sci', 'SCI'],
  ['PHY102', 'ฟิสิกส์ 2', 'sci', 'SCI'],
  ['CHM103', 'เคมีพื้นฐาน', 'sci', 'SCI'],
  ['BIO101', 'ชีววิทยาทั่วไป', 'sci', 'SCI'],
  ['CS101', 'ความรู้พื้นฐานคอมพิวเตอร์', 'sci', 'CS'],
  ['CS102', 'การเขียนโปรแกรมเบื้องต้น', 'sci', 'CS'],
  ['CS213', 'โครงสร้างข้อมูล', 'sci', 'CS'],
  ['CS261', 'วิศวกรรมซอฟต์แวร์เบื้องต้น', 'sci', 'CS'],
  ['CS284', 'ระบบฐานข้อมูล', 'sci', 'CS'],
  ['TU100', 'พลเมืองกับความรับผิดชอบต่อสังคม', null, 'GEN'],
  ['TU101', 'โลก อาเซียน และไทย', null, 'GEN'],
  ['TU102', 'ทักษะชีวิตทางสังคม', null, 'GEN'],
  ['TU103', 'ชีวิตกับความยั่งยืน', null, 'GEN'],
  ['TU104', 'สังคมกับการใช้เหตุผล', null, 'GEN'],
  ['TU105', 'ทักษะการสื่อสารด้วยภาษาอังกฤษ', null, 'ENG'],
  ['TU106', 'ความคิดสร้างสรรค์และการสื่อสาร', null, 'GEN'],
  ['EL070', 'ภาษาอังกฤษพื้นฐาน 1', 'arts', 'ENG'],
  ['EL171', 'ภาษาอังกฤษ 1', 'arts', 'ENG'],
  ['EL172', 'ภาษาอังกฤษ 2', 'arts', 'ENG'],
  ['ENG230', 'การอ่านเชิงวิชาการ', 'arts', 'ENG'],
  ['AC201', 'การบัญชีชั้นต้น', 'comm', 'BUS'],
  ['FN201', 'การเงินธุรกิจ', 'comm', 'BUS'],
  ['MK201', 'หลักการตลาด', 'comm', 'BUS'],
  ['EC210', 'เศรษฐศาสตร์จุลภาค', 'econ', 'ECON'],
  ['EC211', 'เศรษฐศาสตร์มหภาค', 'econ', 'ECON'],
  ['LA200', 'กฎหมายแพ่งหลักทั่วไป', 'law', 'LAW'],
  ['LA201', 'กฎหมายอาญาภาคทั่วไป', 'law', 'LAW'],
  ['EG101', 'กลศาสตร์วิศวกรรม', 'engr', 'ENGR'],
  ['EG102', 'เขียนแบบวิศวกรรม', 'engr', 'ENGR'],
].map(([code, name_th, faculty_id, group_code]) => ({
  code: code as string,
  name_th: name_th as string,
  faculty_id,
  group_code,
}));

export const getSubjects = cache(async (): Promise<Subject[]> => {
  const { data, error } = await db()
    .from('subjects')
    .select('code, name_th, faculty_id, group_code')
    .order('code');
  if (error || !data?.length) return SEED_SUBJECTS;
  return data as Subject[];
});

interface RawPostRow {
  id: string;
  author_id: string;
  tag: PostTag;
  visibility: string;
  announce_until: string | null;
  title: string | null;
  body: string;
  subject_code: string | null;
  faculty_id: string | null;
  meet_at: string | null;
  meet_place: string | null;
  capacity: number | null;
  requires_approval: boolean;
  ended_at: string | null;
  chat_expires_at: string | null;
  conversation_id: string | null;
  accepted_comment_id: string | null;
  like_count: number;
  comment_count: number;
  share_count: number;
  is_pinned: boolean;
  is_hidden: boolean;
  created_at: string;
}

interface RawAttachmentRow {
  id: string;
  post_id: string;
  file_id: string;
  kind: 'file' | 'image';
  file_name: string;
  mime_type: string | null;
  size_bytes: number | null;
  sort_order: number;
}

async function hydratePosts(rows: RawPostRow[]): Promise<Post[]> {
  if (!rows.length) return [];

  const postIds = rows.map((r) => r.id);
  const authorIds = Array.from(new Set(rows.map((r) => r.author_id)));

  const [subjects, { data: profilesData }, { data: attachData }] = await Promise.all([
    getSubjects(),
    db().from('profiles').select('*').in('id', authorIds),
    db()
      .from('post_attachments')
      .select('id, post_id, file_id, kind, file_name, mime_type, size_bytes, sort_order')
      .in('post_id', postIds)
      .order('sort_order', { ascending: true }),
  ]);

  const subjectMap = new Map(subjects.map((s) => [s.code, s.name_th]));
  const authorMap = new Map<string, Author>();

  for (const p of (profilesData ?? []) as Array<Record<string, unknown>>) {
    const id = String(p.id);
    const role = ((p.role_override as UserRole | null) ?? (p.role as UserRole) ?? 'student');
    authorMap.set(id, {
      id,
      username: String(p.username ?? 'user'),
      display_name: String(p.display_name ?? 'ผู้ใช้'),
      avatar_url: (p.avatar_url as string | null) ?? null,
      equipped_frame: null,
      role,
      faculty_id: (p.faculty_id as string | null) ?? null,
      faculty_name: (p.faculty_name as string | null) ?? null,
      study_year: studyYear((p.entry_year_be as number | null) ?? null),
      stars: Number(p.stars ?? 0),
    });
  }

  const rawAttachments = (attachData ?? []) as RawAttachmentRow[];
  const fileIds = Array.from(new Set(rawAttachments.map((a) => a.file_id).filter(Boolean)));
  const fileUrlMap = new Map<string, string>();

  if (fileIds.length > 0) {
    const { data: filesData } = await db()
      .from('files')
      .select('id, public_url')
      .in('id', fileIds);
    for (const f of (filesData ?? []) as Array<{ id: string; public_url: string }>) {
      fileUrlMap.set(f.id, f.public_url);
    }
  }

  const attachmentsByPost = new Map<string, Attachment[]>();
  for (const a of rawAttachments) {
    const list = attachmentsByPost.get(a.post_id) ?? [];
    list.push({
      id: a.id,
      kind: a.kind,
      file_id: a.file_id,
      file_name: a.file_name,
      mime_type: a.mime_type,
      size_bytes: a.size_bytes !== null ? Number(a.size_bytes) : null,
      url: fileUrlMap.get(a.file_id) ?? `/api/files/${a.file_id}`,
    });
    attachmentsByPost.set(a.post_id, list);
  }

  return rows.map((r) => {
    const fallbackAuthor: Author = {
      id: r.author_id,
      username: 'user',
      display_name: 'นักศึกษา มธ.',
      avatar_url: null,
      equipped_frame: null,
      role: 'student',
      faculty_id: r.faculty_id,
      faculty_name: null,
      study_year: null,
      stars: 0,
    };

    return {
      id: r.id,
      tag: r.tag,
      announce_until: r.announce_until,
      title: r.title,
      body: r.body,
      subject_code: r.subject_code,
      subject_name: r.subject_code ? (subjectMap.get(r.subject_code) ?? null) : null,
      faculty_id: r.faculty_id,
      meet_at: r.meet_at,
      meet_place: r.meet_place,
      capacity: r.capacity,
      requires_approval: Boolean(r.requires_approval),
      signup_count: 0,
      pending_count: 0,
      my_signup_status: 'none',
      ended_at: r.ended_at,
      chat_expires_at: r.chat_expires_at,
      is_signed_up: false,
      conversation_id: r.conversation_id,
      accepted_comment_id: r.accepted_comment_id,
      like_count: Number(r.like_count ?? 0),
      comment_count: Number(r.comment_count ?? 0),
      share_count: Number(r.share_count ?? 0),
      is_pinned: Boolean(r.is_pinned),
      created_at: r.created_at,
      liked: false,
      bookmarked: false,
      poll: null,
      author: authorMap.get(r.author_id) ?? fallbackAuthor,
      attachments: attachmentsByPost.get(r.id) ?? [],
    };
  });
}

export async function getFeed(params: FeedParams): Promise<Post[]> {
  try {
    const me = await getMe();
    let query = db()
      .from('posts')
      .select('*')
      .eq('is_hidden', false);

    if (params.tag) {
      query = query.eq('tag', params.tag);
    }
    if (params.subject) {
      query = query.eq('subject_code', params.subject);
    }
    if (params.faculty) {
      query = query.eq('faculty_id', params.faculty);
    }
    if (params.group) {
      const subjects = await getSubjects();
      const codes = subjects.filter((s) => s.group_code === params.group).map((s) => s.code);
      if (codes.length > 0) {
        query = query.in('subject_code', codes);
      } else {
        return [];
      }
    }

    if (params.sort === 'top') {
      query = query
        .order('is_pinned', { ascending: false })
        .order('like_count', { ascending: false })
        .order('created_at', { ascending: false });
    } else {
      query = query
        .order('is_pinned', { ascending: false })
        .order('created_at', { ascending: false });
    }

    const from = Math.max(0, params.offset);
    const to = from + Math.max(1, params.limit) - 1;
    const { data, error } = await query.range(from, to);

    if (error || !data) return [];

    const visibleRows = (data as RawPostRow[]).filter(
      (r) => r.visibility === 'public' || (me && r.author_id === me.id),
    );

    return hydratePosts(visibleRows);
  } catch {
    return [];
  }
}
export async function searchPosts(
  searchTerm: string,
  limit = 20,
): Promise<Post[]> {
  try {
    const term = searchTerm.trim();

    if (!term) return [];

    const me = await getMe();

    // Search post titles and body text.
    let query = db()
      .from('posts')
      .select('*')
      .eq('is_hidden', false)
      .or(`title.ilike.%${term}%,body.ilike.%${term}%`)
      .order('is_pinned', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(Math.max(1, Math.min(limit, 50)));

    const { data, error } = await query;

    if (error || !data) return [];

    // Only show public posts or the current user's own posts.
    const visibleRows = (data as RawPostRow[]).filter(
      (row) =>
        row.visibility === 'public' ||
        (me && row.author_id === me.id),
    );

    return await hydratePosts(visibleRows);

  } catch {
    return [];
  }
}

export async function searchPeople(
  searchTerm: string,
  limit = 10,
): Promise<SuggestedUser[]> {
  try {
    const term = searchTerm.trim();

    if (!term) return [];

    const { data, error } = await db()
      .from('profiles')
      .select(
        'id, username, display_name, avatar_url, role, role_override, faculty_name, entry_year_be, is_suspended',
      )
      .eq('is_suspended', false)
      .or(
        `username.ilike.%${term}%,display_name.ilike.%${term}%`,
      )
      .order('display_name', { ascending: true })
      .limit(Math.max(1, Math.min(limit, 20)));

    if (error || !data) return [];

    return data.map((u) => ({
      id: u.id,
      username: u.username,
      display_name: u.display_name,
      avatar_url: u.avatar_url,
      role: u.role_override ?? u.role,
      faculty_name: u.faculty_name,
      study_year: studyYear(u.entry_year_be),
    }));
  } catch {
    return [];
  }
}

export async function getUserProfileAndPosts(
  username: string,
): Promise<{ profile: ProfileView; posts: Post[]; sheets: Post[] } | null> {
  const me = await getMe();

  const { data: userRow } = await db()
    .from('profiles')
    .select('*')
    .eq('username', username.toLowerCase())
    .maybeSingle();

  if (!userRow) return null;

  const p = userRow as Record<string, unknown>;
  const userId = String(p.id);
  const isMe = Boolean(me && me.id === userId);
  const role = ((p.role_override as UserRole | null) ?? (p.role as UserRole) ?? 'student');

  const { data: postRows } = await db()
    .from('posts')
    .select('*')
    .eq('author_id', userId)
    .eq('is_hidden', false)
    .order('created_at', { ascending: false });

  const filteredRows = ((postRows ?? []) as RawPostRow[]).filter(
    (r) => r.visibility === 'public' || isMe,
  );

  const hydrated = await hydratePosts(filteredRows);
  const sheets = hydrated.filter((post) => post.tag === 'sheet' && post.attachments.length > 0);

  const [followersRes, followingRes] = await Promise.all([
    db().from('follows').select('id', { count: 'exact', head: true }).eq('following_id', userId),
    db().from('follows').select('id', { count: 'exact', head: true }).eq('follower_id', userId),
  ]);
  
  const followerCount = followersRes.count ?? 0;
  const followingCount = followingRes.count ?? 0;

  let isFollowing = false;
  if (me && !isMe) {
    const { data: followRow } = await db()
      .from('follows')
      .select('id')
      .eq('follower_id', me.id)
      .eq('following_id', userId)
      .maybeSingle();
    
    isFollowing = Boolean(followRow);
  }

  const profile: ProfileView = {
    id: userId,
    username: String(p.username ?? username),
    display_name: String(p.display_name ?? username),
    real_name: isMe ? ((p.display_name_th as string | null) ?? null) : null,
    avatar_url: (p.avatar_url as string | null) ?? null,
    equipped_frame: null,
    bio: (p.bio as string | null) ?? null,
    role,
    faculty_id: (p.faculty_id as string | null) ?? null,
    faculty_name: (p.faculty_name as string | null) ?? null,
    department: (p.department as string | null) ?? null,
    level_name: (p.level_name as string | null) ?? null,
    study_year: studyYear((p.entry_year_be as number | null) ?? null),
    stars: Number(p.stars ?? 0),
    created_at: String(p.created_at ?? new Date().toISOString()),
    post_count: hydrated.length,
    sheet_count: sheets.length,
    follower_count: followerCount,
    following_count: followingCount,
    rank: 1,
    is_following: isFollowing,
    is_me: isMe,
    is_private: false,
    can_view: true,
    follow_state: 'none',
    is_close_friend: false,
    request_count: 0,
  };

  return { profile, posts: hydrated, sheets };
}

export interface SuggestedUser {
  id: string;
  username: string;
  display_name: string;
  avatar_url: string | null;
  role: UserRole;
  faculty_name: string | null;
  study_year: number | null;
}

export async function getSuggestedUsers(meId: string, limit: number): Promise<SuggestedUser[]> {
  const { data } = await db()
    .from('profiles')
    .select('id, username, display_name, avatar_url, role, role_override, faculty_name, entry_year_be')
    .neq('id', meId)
    .eq('is_suspended', false)
    .order('last_login_at', { ascending: false, nullsFirst: false })
    .limit(limit);

  return ((data ?? []) as Array<SuggestedUser & { role_override: UserRole | null; entry_year_be: number | null }>).map((u) => ({
    id: u.id,
    username: u.username,
    display_name: u.display_name,
    avatar_url: u.avatar_url,
    role: u.role_override ?? u.role,
    faculty_name: u.faculty_name,
    study_year: studyYear(u.entry_year_be),
  }));
}
interface RawReportRow {
  id: string;
  reporter_id: string;
  post_id: string | null;
  post_excerpt: string | null;
  reason: ReportReason;
  detail: string | null;
  status: ReportStatus;
  action: ReportAction | null;
  resolution_note: string | null;
  resolved_at: string | null;
  created_at: string;
}

// U8: คิวรายงานสำหรับแอดมิน 'pending' = รอตรวจ, 'closed' = จัดการแล้ว/ไม่ผิดกฎ
export async function getReports(view: 'pending' | 'closed', limit = 50): Promise<ReportItem[]> {
  const me = await getMe();
  if (!me || me.role !== 'admin') return [];

  let query = db().from('reports').select('*');
  query = view === 'pending'
    ? query.eq('status', 'pending').order('created_at', { ascending: true })
    : query.neq('status', 'pending').order('resolved_at', { ascending: false });

  const { data, error } = await query.limit(limit);
  if (error || !data) return [];
  const rows = data as RawReportRow[];

  const postIds = Array.from(new Set(rows.map((r) => r.post_id).filter((id): id is string => Boolean(id))));
  const reporterIds = Array.from(new Set(rows.map((r) => r.reporter_id)));

  const [{ data: postRows }, { data: reporterRows }] = await Promise.all([
    postIds.length
      ? db().from('posts').select('*').in('id', postIds)
      : Promise.resolve({ data: [] as RawPostRow[] }),
    db()
      .from('profiles')
      .select('id, username, display_name, avatar_url, role, role_override, faculty_name, entry_year_be')
      .in('id', reporterIds),
  ]);

  // แอดมินต้องเห็นโพสต์ที่ถูกซ่อนด้วย จึงไม่กรอง is_hidden ตรงนี้
  const rawPosts = (postRows ?? []) as RawPostRow[];
  const hiddenIds = new Set(rawPosts.filter((p) => p.is_hidden).map((p) => p.id));
  const postMap = new Map((await hydratePosts(rawPosts)).map((p) => [p.id, p]));

  const reporterMap = new Map<string, PersonCard>();
  for (const u of (reporterRows ?? []) as Array<Record<string, unknown>>) {
    reporterMap.set(String(u.id), {
      id: String(u.id),
      username: String(u.username ?? 'user'),
      display_name: String(u.display_name ?? 'ผู้ใช้'),
      avatar_url: (u.avatar_url as string | null) ?? null,
      role: ((u.role_override as UserRole | null) ?? (u.role as UserRole) ?? 'student'),
      faculty_name: (u.faculty_name as string | null) ?? null,
      study_year: studyYear((u.entry_year_be as number | null) ?? null),
    });
  }

  return rows.map((r) => ({
    id: r.id,
    reason: r.reason,
    detail: r.detail,
    status: r.status,
    action: r.action,
    resolution_note: r.resolution_note,
    resolved_at: r.resolved_at,
    created_at: r.created_at,
    post_id: r.post_id,
    post_excerpt: r.post_excerpt,
    post_hidden: r.post_id ? hiddenIds.has(r.post_id) : false,
    post: r.post_id ? (postMap.get(r.post_id) ?? null) : null,
    reporter: reporterMap.get(r.reporter_id) ?? null,
  }));
}

export async function getPendingReportCount(): Promise<number> {
  const { count, error } = await db()
    .from('reports')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'pending');
  return error ? 0 : (count ?? 0);
}
