export type UserRole = 'student' | 'instructor' | 'staff' | 'admin';
export type PostTag = 'sheet' | 'studybuddy' | 'qa' | 'poll' | 'announce' | 'general';
export type FeedScope = 'all' | 'following' | 'bookmarks';
export type FeedSort = 'new' | 'top';

export type FollowState = 'none' | 'requested' | 'following';
export type SignupStatus = 'none' | 'pending' | 'approved' | 'rejected';

export const ROLE_LABEL: Record<UserRole, string> = {
  student: 'นักศึกษา',
  instructor: 'อาจารย์',
  staff: 'เจ้าหน้าที่',
  admin: 'แอดมิน',
};

export type TagIconName =
  | 'FileText' | 'Users' | 'CircleHelp' | 'BarChart3' | 'Megaphone' | 'MessageCircle';

export const TAG_META: Record<PostTag, { label: string; hash: string; icon: TagIconName; tone: string }> = {
  sheet:      { label: 'ชีท',        hash: '#ชีท',        icon: 'FileText',      tone: 'tag-sheet' },
  studybuddy: { label: 'หาเพื่อนติว', hash: '#หาเพื่อนติว', icon: 'Users',         tone: 'tag-buddy' },
  qa:         { label: 'ถาม-ตอบ',    hash: '#ถาม-ตอบ',    icon: 'CircleHelp',    tone: 'tag-qa' },
  poll:       { label: 'โพลล์',       hash: '#โพลล์',      icon: 'BarChart3',     tone: 'tag-poll' },
  announce:   { label: 'ประกาศ',     hash: '#ประกาศ',     icon: 'Megaphone',     tone: 'tag-announce' },
  general:    { label: 'ทั่วไป',      hash: 'ทั่วไป',       icon: 'MessageCircle', tone: 'tag-general' },
};

export const TAG_ORDER: PostTag[] = ['sheet', 'studybuddy', 'qa', 'poll', 'announce', 'general'];

export const NOTE_MAX = 60;

export interface Author {
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
}

export interface Attachment {
  id: string;
  kind: 'file' | 'image';

  file_id: string | null;
  file_name: string;
  mime_type: string | null;
  size_bytes: number | null;
  url?: string | null;
}

export interface PollOption {
  id: string;
  label: string;
  votes: number;
}

export interface Poll {
  total: number;

  my_option: string | null;
  options: PollOption[];
}

export const POLL_MIN_OPTIONS = 2;
export const POLL_MAX_OPTIONS = 6;
export const POLL_OPTION_MAX = 80;

export interface Post {
  id: string;
  tag: PostTag;

  announce_until: string | null;
  title: string | null;
  body: string;
  subject_code: string | null;
  subject_name: string | null;
  faculty_id: string | null;
  meet_at: string | null;
  meet_place: string | null;
  capacity: number | null;
  requires_approval: boolean;

  signup_count: number;
  pending_count: number;
  my_signup_status: SignupStatus;

  ended_at: string | null;

  chat_expires_at: string | null;
  is_signed_up: boolean;

  conversation_id: string | null;
  accepted_comment_id: string | null;
  like_count: number;
  comment_count: number;
  share_count: number;
  is_pinned: boolean;
  created_at: string;
  liked: boolean;
  bookmarked: boolean;

  poll: Poll | null;
  author: Author;
  attachments: Attachment[];
}

export interface Comment {
  id: string;
  post_id: string;
  parent_id: string | null;
  body: string;
  like_count: number;
  created_at: string;
  liked: boolean;
  author: Pick<Author, 'id' | 'username' | 'display_name' | 'avatar_url' | 'equipped_frame' | 'role' | 'study_year' | 'faculty_name'>;
}

export interface ProfileView {
  id: string;
  username: string;
  display_name: string;
  real_name: string | null;
  avatar_url: string | null;
  equipped_frame: string | null;
  bio: string | null;
  role: UserRole;
  faculty_id: string | null;
  faculty_name: string | null;
  department: string | null;
  level_name: string | null;
  study_year: number | null;
  stars: number;
  created_at: string;
  post_count: number | null;
  sheet_count: number | null;
  follower_count: number;
  following_count: number;
  rank: number;
  is_following: boolean;
  is_me: boolean;

  is_private: boolean;

  can_view: boolean;
  follow_state: FollowState;
  is_close_friend: boolean;

  request_count: number | null;
}

export interface NotificationItem {
  id: string;
  type:
    | 'like' | 'comment' | 'reply' | 'follow' | 'mention'
    | 'answer_accepted' | 'study_reminder' | 'study_signup'
    | 'study_approved' | 'study_rejected' | 'study_ended'
    | 'report_resolved' | 'star_awarded' | 'message'
    | 'follow_request' | 'follow_accepted' | 'announce';
  post_id: string | null;
  comment_id: string | null;
  conversation_id: string | null;
  payload: Record<string, unknown>;
  read_at: string | null;
  created_at: string;
  post_title: string | null;
  actor: Pick<Author, 'id' | 'username' | 'display_name' | 'avatar_url' | 'role'> | null;
}

export interface ConversationItem {
  id: string;
  kind: 'direct' | 'group';
  post_id: string | null;

  locked: boolean;
  expires_at: string | null;
  title: string | null;
  avatar_url: string | null;
  member_count: number;
  last_message: string | null;
  last_message_at: string;
  unread: number;
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  body: string;
  file_id: string | null;
  attachment_name: string | null;
  created_at: string;
}

export interface LeaderRow {
  rank: number;
  id: string;
  username: string;
  display_name: string;
  avatar_url: string | null;
  stars: number;
  role: UserRole;
  faculty_name: string | null;
  study_year: number | null;
}

export interface Faculty {
  id: string;
  name_th: string;
  name_en: string | null;
  icon: string | null;
  sort_order: number;
}

export interface Subject {
  code: string;
  name_th: string;
  faculty_id: string | null;
  group_code: string | null;
}

export interface StudySignup {
  user_id: string;
  status: Exclude<SignupStatus, 'none'>;
  created_at: string;
  decided_at: string | null;
  user: Pick<Author, 'id' | 'username' | 'display_name' | 'avatar_url' | 'role' | 'study_year' | 'faculty_name' | 'stars'>;
}

export interface StudySession {
  id: string;
  title: string | null;
  body: string;
  subject_code: string | null;
  subject_name: string | null;
  meet_at: string | null;
  meet_place: string | null;
  capacity: number | null;
  requires_approval: boolean;
  ended_at: string | null;
  is_ended: boolean;
  chat_expires_at: string | null;
  is_owner: boolean;
  my_status: SignupStatus;
  signup_count: number;
  pending_count: number;
  conversation_id: string | null;
  is_past: boolean;
  author: Pick<Author, 'id' | 'username' | 'display_name' | 'avatar_url' | 'role' | 'study_year' | 'faculty_name'>;
}

export type PersonCard = Pick<
  Author, 'id' | 'username' | 'display_name' | 'avatar_url' | 'role' | 'faculty_name' | 'study_year'
>;

export interface CloseFriendCandidate extends PersonCard {
  is_close: boolean;
}

export interface FollowRequest extends PersonCard {
  created_at: string;
}

export type ReportReason = 'wrong_info' | 'copyright' | 'spam' | 'inappropriate' | 'privacy';
export type ReportStatus = 'pending' | 'actioned' | 'dismissed';
export type ReportAction = 'hide' | 'delete' | 'dismiss';

export const REPORT_REASONS: Record<ReportReason, { label: string; short: string }> = {
  wrong_info:    { label: 'ข้อมูลผิด / ทำให้เข้าใจผิด',     short: 'ข้อมูลผิด' },
  copyright:     { label: 'ละเมิดลิขสิทธิ์ (ชีท/ข้อสอบ)',   short: 'ละเมิดลิขสิทธิ์' },
  spam:          { label: 'สแปม / โฆษณา',                 short: 'สแปม' },
  inappropriate: { label: 'เนื้อหาไม่เหมาะสม / คุกคาม',     short: 'ไม่เหมาะสม' },
  privacy:       { label: 'เปิดเผยข้อมูลส่วนตัวผู้อื่น',      short: 'ข้อมูลส่วนตัว' },
};

export const REPORT_REASON_ORDER: ReportReason[] = ['inappropriate', 'spam', 'wrong_info', 'copyright', 'privacy'];

export const REPORT_DETAIL_MAX = 500;

export interface ReportItem {
  id: string;
  reason: ReportReason;
  detail: string | null;
  status: ReportStatus;
  action: ReportAction | null;
  resolution_note: string | null;
  resolved_at: string | null;
  created_at: string;
  post_id: string | null;
  post_excerpt: string | null;

  post_hidden: boolean;
  post: Post | null;
  reporter: PersonCard | null;
}
