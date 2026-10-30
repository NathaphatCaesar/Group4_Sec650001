import 'server-only';
import { db } from '@/lib/supabase';
import { currentUserId } from '@/lib/session';

type BookmarkResult =
	| { ok: true; bookmarked: boolean }
	| { ok: false; status: 400 | 401 | 404 | 502; error: string };

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function bookmark(postId: string): Promise<BookmarkResult> {
	return updateBookmark(postId, true);
}

export async function unbookmark(postId: string): Promise<BookmarkResult> {
	return updateBookmark(postId, false);
}

async function updateBookmark(postId: string, shouldBookmark: boolean): Promise<BookmarkResult> {
	const userId = await currentUserId();
	if (!userId) return { ok: false, status: 401, error: 'ยังไม่ได้ล็อกอิน' };
	if (!UUID_PATTERN.test(postId)) {
		return { ok: false, status: 400, error: 'รหัสโพสต์ไม่ถูกต้อง' };
	}

	// บันทึกได้เฉพาะโพสต์ที่ยังมองเห็นได้; ยกเลิกบันทึกได้เสมอ แม้โพสต์จะถูกซ่อนไปแล้ว
	if (shouldBookmark) {
		const { data: post, error: postError } = await db()
			.from('posts')
			.select('id, author_id, visibility, is_hidden')
			.eq('id', postId)
			.maybeSingle();

		if (postError) {
			console.error('[bookmark] post lookup failed', postError);
			return { ok: false, status: 502, error: 'ตรวจสอบโพสต์ไม่สำเร็จ' };
		}
		const visible = post && !post.is_hidden && (post.visibility === 'public' || post.author_id === userId);
		if (!visible) {
			return { ok: false, status: 404, error: 'ไม่พบโพสต์นี้ หรือถูกลบไปแล้ว' };
		}
	}

	const query = db().from('bookmarks');
	const { error } = shouldBookmark
		? await query.upsert(
				{ user_id: userId, post_id: postId },
				{ onConflict: 'user_id,post_id', ignoreDuplicates: true },
			)
		: await query.delete().eq('user_id', userId).eq('post_id', postId);

	if (error) {
		console.error('[bookmark] update failed', error);
		return { ok: false, status: 502, error: 'บันทึกโพสต์ไม่สำเร็จ' };
	}

	return { ok: true, bookmarked: shouldBookmark };
}
