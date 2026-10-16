import 'server-only';
import { cache } from 'react';
import { db } from '@/lib/supabase';
import { currentUserId } from '@/lib/session';
import { studyYear } from '@/lib/tu-api';
import type { Faculty, Post, PostTag, FeedScope, FeedSort, Subject, UserRole } from '@/lib/types';

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
    .select('id, username, display_name, avatar_url, role, role_override, faculty_id, faculty_name, entry_year_be, is_suspended')
    .eq('id', userId)
    .maybeSingle();
  if (!data) return null;

  const row = data as {
    id: string; username: string; display_name: string; avatar_url: string | null;
    role: UserRole; role_override: UserRole | null; faculty_id: string | null; faculty_name: string | null;
    entry_year_be: number | null; is_suspended: boolean;
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
    stars: 0,
    is_suspended: row.is_suspended,
  };
});

export const getFaculties = cache(async (): Promise<Faculty[]> => {
  const { data } = await db().from('faculties').select('*').order('sort_order');
  return (data ?? []) as Faculty[];
});

const SEED_SUBJECTS: Subject[] = [
  ['MATH101', 'แคลคูลัสพื้นฐาน', 'sci', 'MATH'], ['MATH102', 'แคลคูลัส 1', 'sci', 'MATH'],
  ['MATH103', 'แคลคูลัส 2', 'sci', 'MATH'], ['MATH216', 'พีชคณิตเชิงเส้น', 'sci', 'MATH'],
  ['MA211', 'สถิติเบื้องต้น', 'sci', 'MATH'], ['PHY101', 'ฟิสิกส์ 1', 'sci', 'SCI'],
  ['PHY102', 'ฟิสิกส์ 2', 'sci', 'SCI'], ['CHM103', 'เคมีพื้นฐาน', 'sci', 'SCI'],
  ['BIO101', 'ชีววิทยาทั่วไป', 'sci', 'SCI'], ['CS101', 'ความรู้พื้นฐานคอมพิวเตอร์', 'sci', 'CS'],
  ['CS102', 'การเขียนโปรแกรมเบื้องต้น', 'sci', 'CS'], ['CS213', 'โครงสร้างข้อมูล', 'sci', 'CS'],
  ['CS284', 'ระบบฐานข้อมูล', 'sci', 'CS'], ['TU100', 'พลเมืองกับความรับผิดชอบต่อสังคม', null, 'GEN'],
  ['TU101', 'โลก อาเซียน และไทย', null, 'GEN'], ['TU102', 'ทักษะชีวิตทางสังคม', null, 'GEN'],
  ['TU103', 'ชีวิตกับความยั่งยืน', null, 'GEN'], ['TU104', 'สังคมกับการใช้เหตุผล', null, 'GEN'],
  ['TU105', 'ทักษะการสื่อสารด้วยภาษาอังกฤษ', null, 'ENG'], ['TU106', 'ความคิดสร้างสรรค์และการสื่อสาร', null, 'GEN'],
  ['EL070', 'ภาษาอังกฤษพื้นฐาน 1', 'arts', 'ENG'], ['EL171', 'ภาษาอังกฤษ 1', 'arts', 'ENG'],
  ['EL172', 'ภาษาอังกฤษ 2', 'arts', 'ENG'], ['ENG230', 'การอ่านเชิงวิชาการ', 'arts', 'ENG'],
  ['AC201', 'การบัญชีชั้นต้น', 'comm', 'BUS'], ['FN201', 'การเงินธุรกิจ', 'comm', 'BUS'],
  ['MK201', 'หลักการตลาด', 'comm', 'BUS'], ['EC210', 'เศรษฐศาสตร์จุลภาค', 'econ', 'ECON'],
  ['EC211', 'เศรษฐศาสตร์มหภาค', 'econ', 'ECON'], ['LA200', 'กฎหมายแพ่งหลักทั่วไป', 'law', 'LAW'],
  ['LA201', 'กฎหมายอาญาภาคทั่วไป', 'law', 'LAW'], ['EG101', 'กลศาสตร์วิศวกรรม', 'engr', 'ENGR'],
  ['EG102', 'เขียนแบบวิศวกรรม', 'engr', 'ENGR'],
].map(([code, name_th, faculty_id, group_code]) => ({
  code: code as string, name_th: name_th as string, faculty_id, group_code,
}));

export const getSubjects = cache(async (): Promise<Subject[]> => {
  const { data, error } = await db().from('subjects').select('code, name_th, faculty_id, group_code').order('code');
  if (error || !data?.length) return SEED_SUBJECTS;
  return data as Subject[];
});

export async function getFeed(_params: FeedParams): Promise<Post[]> {
  return [];
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
