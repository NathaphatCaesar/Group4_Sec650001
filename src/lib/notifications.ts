import 'server-only';
import { db } from '@/lib/supabase';

export const NOTIFICATION_TYPES = [
  'like',
  'comment',
  'reply',
  'follow',
  'mention',
  'answer_accepted',
  'study_reminder',
  'study_signup',
  'study_approved',
  'study_rejected',
  'study_ended',
  'report_resolved',
  'star_awarded',
  'message',
  'follow_request',
  'follow_accepted',
  'announce',
] as const;

export type NotificationType = (typeof NOTIFICATION_TYPES)[number];

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export interface CreateNotificationInput {
  recipientId: string;
  actorId?: string | null;
  type: NotificationType;
  postId?: string | null;
  commentId?: number | null;
  conversationId?: string | null;
  payload?: Record<string, unknown>;
}

/**
 * Create a notification from trusted server-side code only.
 * Do not call this with recipient/type values taken directly from a client request.
 */
export async function createNotification(input: CreateNotificationInput) {
  if (!UUID_PATTERN.test(input.recipientId)) {
    throw new Error('recipientId must be a valid UUID');
  }
  if (input.actorId && !UUID_PATTERN.test(input.actorId)) {
    throw new Error('actorId must be a valid UUID');
  }
  if (input.actorId && input.actorId === input.recipientId) {
    return { notification: null, skipped: true } as const;
  }
  if (input.postId && !UUID_PATTERN.test(input.postId)) {
    throw new Error('postId must be a valid UUID');
  }
  if (input.conversationId && !UUID_PATTERN.test(input.conversationId)) {
    throw new Error('conversationId must be a valid UUID');
  }
  if (!NOTIFICATION_TYPES.includes(input.type)) {
    throw new Error('Unsupported notification type');
  }

  const payload = input.payload && typeof input.payload === 'object'
    ? input.payload
    : {};

  const { data, error } = await db()
    .from('notifications')
    .insert({
      recipient_id: input.recipientId,
      actor_id: input.actorId ?? null,
      type: input.type,
      post_id: input.postId ?? null,
      comment_id: input.commentId ?? null,
      conversation_id: input.conversationId ?? null,
      payload,
    })
    .select('*')
    .single();

  if (error) {
    console.error('Create notification failed:', error.message);
    throw new Error('ไม่สามารถสร้างการแจ้งเตือนได้');
  }

  return { notification: data, skipped: false } as const;
}

/**
 * Fire-and-forget wrapper: a failed notification must never break the main action.
 */
export async function notifySafely(input: CreateNotificationInput) {
  try {
    await createNotification(input);
  } catch (error) {
    console.error('Notify failed:', error);
  }
}

/**
 * Same notification to many recipients (e.g. announce to all followers).
 */
export async function notifyManySafely(
  recipientIds: string[],
  input: Omit<CreateNotificationInput, 'recipientId'>,
) {
  const rows = [...new Set(recipientIds)]
    .filter((id) => UUID_PATTERN.test(id) && id !== input.actorId)
    .map((id) => ({
      recipient_id: id,
      actor_id: input.actorId ?? null,
      type: input.type,
      post_id: input.postId ?? null,
      comment_id: input.commentId ?? null,
      conversation_id: input.conversationId ?? null,
      payload: input.payload ?? {},
    }));
  if (rows.length === 0) return;

  const { error } = await db().from('notifications').insert(rows);
  if (error) console.error('Notify many failed:', error.message);
}

export async function getUnreadNotificationCount(userId: string): Promise<number> {
  const { count, error } = await db()
    .from('notifications')
    .select('id', { count: 'exact', head: true })
    .eq('recipient_id', userId)
    .is('read_at', null);
  return error ? 0 : (count ?? 0);
}
