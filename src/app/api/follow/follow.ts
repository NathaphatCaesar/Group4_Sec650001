import 'server-only';
import { db } from '@/lib/supabase';
import { currentUserId } from '@/lib/session';
import { notifySafely } from '@/lib/notifications';

type FollowResult =
	| { ok: true; following: boolean }
	| { ok: false; status: 400 | 401 | 404 | 409 | 502; error: string };

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function follow(targetUserId: string): Promise<FollowResult> {
	return updateFollow(targetUserId, true);
}

export async function unfollow(targetUserId: string): Promise<FollowResult> {
	return updateFollow(targetUserId, false);
}

async function updateFollow(targetUserId: string, shouldFollow: boolean): Promise<FollowResult> {
	const userId = await currentUserId();
	if (!userId) return { ok: false, status: 401, error: 'ยังไม่ได้ล็อกอิน' };
	if (!UUID_PATTERN.test(targetUserId)) {
		return { ok: false, status: 400, error: 'รหัสผู้ใช้ไม่ถูกต้อง' };
	}
	if (userId === targetUserId) {
		return { ok: false, status: 409, error: 'ติดตามตัวเองไม่ได้' };
	}

	const { data: target, error: targetError } = await db()
		.from('profiles')
		.select('id, is_suspended')
		.eq('id', targetUserId)
		.maybeSingle();

	if (targetError) {
		console.error('[follow] profile lookup failed', targetError);
		return { ok: false, status: 502, error: 'ตรวจสอบบัญชีไม่สำเร็จ' };
	}
	if (!target || target.is_suspended) {
		return { ok: false, status: 404, error: 'ไม่พบบัญชีนี้' };
	}

	const query = db().from('follows');
	const { data: changed, error } = shouldFollow
		? await query
				.upsert(
					{ follower_id: userId, following_id: targetUserId },
					{ onConflict: 'follower_id,following_id', ignoreDuplicates: true },
				)
				.select('follower_id')
		: await query.delete().eq('follower_id', userId).eq('following_id', targetUserId).select('follower_id');

	if (error) {
		console.error('[follow] relationship update failed', error);
		return { ok: false, status: 502, error: 'บันทึกการติดตามไม่สำเร็จ' };
	}

	// แจ้งเตือนเฉพาะตอนติดตามใหม่จริงๆ (ไม่แจ้งซ้ำถ้าติดตามอยู่แล้ว)
	if (shouldFollow && changed && changed.length > 0) {
		await notifySafely({ recipientId: targetUserId, actorId: userId, type: 'follow' });
	}

	return { ok: true, following: shouldFollow };
}
