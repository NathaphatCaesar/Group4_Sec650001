'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { MessageCircle, Send, Trash2 } from 'lucide-react';
import { Avatar } from '@/components/Avatar';
import { RoleBadge } from '@/components/RoleBadge';
import { timeAgo } from '@/lib/utils';
import type { Comment } from '@/lib/types';

export default function CommentsSection({
  postId,
  meId,
  isAdmin,
}: {
  postId: string;
  meId: string;
  isAdmin: boolean;
}) {
  const router = useRouter();
  const [comments, setComments] = useState<Comment[]>([]);
  const [body, setBody] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [deletingCommentId, setDeletingCommentId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const loadComments = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const res = await fetch(`/api/posts/${postId}/comments`);
      if (!res.ok) throw new Error('ไม่สามารถโหลดความคิดเห็นได้');

      const data = await res.json();
      setComments(data.comments ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'เกิดข้อผิดพลาด');
    } finally {
      setLoading(false);
    }
  }, [postId]);

  useEffect(() => {
    void loadComments();
  }, [loadComments]);

  async function submitComment(e: React.FormEvent) {
    e.preventDefault();

    const text = body.trim();
    if (!text || sending) return;

    setSending(true);
    setError('');

    try {
      const res = await fetch(`/api/posts/${postId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ body: text }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error ?? 'ส่งความคิดเห็นไม่สำเร็จ');
      }

      setBody('');
      await loadComments();
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'เกิดข้อผิดพลาด');
    } finally {
      setSending(false);
    }
  }

  async function deleteComment() {
  if (!deletingCommentId || deleting) return;

  setDeleting(true);
  setError('');

  try {
    const res = await fetch(`/api/comments/${deletingCommentId}`, {
      method: 'DELETE',
    });

    if (!res.ok) throw new Error('ลบความคิดเห็นไม่สำเร็จ');

    setComments((current) =>
      current.filter((c) => c.id !== deletingCommentId)
    );

    setDeletingCommentId(null);
    router.refresh();
  } catch (err) {
    setError(err instanceof Error ? err.message : 'เกิดข้อผิดพลาด');
  } finally {
    setDeleting(false);
  }
}

  return (
    <>
    
    {deletingCommentId && (
      <div
        className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4"
        onClick={() => {
          if (!deleting) setDeletingCommentId(null);
        }}
      >
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-comment-title"
          className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex justify-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-50 text-red-600">
              <Trash2 size={22} />
            </div>
          </div>

          <h2
            id="delete-comment-title"
            className="mt-4 text-center text-lg font-bold"
          >
            ยืนยันการลบความคิดเห็น?
          </h2>

          <p className="mt-2 text-center text-sm text-ink-soft">
            คุณต้องการลบความคิดเห็นนี้ใช่หรือไม่?
            การดำเนินการนี้ไม่สามารถย้อนกลับได้
          </p>

          <div className="mt-6 flex gap-3">
            <button
              type="button"
              disabled={deleting}
              onClick={() => setDeletingCommentId(null)}
              className="btn-ghost flex-1 justify-center border border-[color:var(--color-line)] py-2.5"
            >
              ยกเลิก
            </button>

            <button
              type="button"
              disabled={deleting}
              onClick={deleteComment}
              className="flex-1 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-red-700 disabled:opacity-50"
            >
              {deleting ? 'กำลังลบ...' : 'ยืนยันการลบ'}
            </button>
          </div>
        </div>
      </div>
    )}
    
      <form onSubmit={submitComment} className="card p-4">
        <label htmlFor="comment" className="mb-2 block text-sm font-semibold">
          เขียนความคิดเห็น
        </label>

        <textarea
          id="comment"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="แสดงความคิดเห็นของคุณ..."
          maxLength={2000}
          rows={3}
          className="input min-h-24 w-full resize-y"
        />

        <div className="mt-3 flex items-center justify-between gap-3">
          <span className="text-xs text-ink-soft">
            {body.length}/2000
          </span>

          <button
            type="submit"
            disabled={!body.trim() || sending}
            className="btn-primary px-4 py-2 text-sm disabled:opacity-50"
          >
            <Send size={15} />
            {sending ? 'กำลังส่ง...' : 'ส่งความคิดเห็น'}
          </button>
        </div>
      </form>

      <section className="card overflow-hidden">
        <div className="flex items-center gap-2 border-b border-[color:var(--color-line)] px-5 py-4">
          <MessageCircle size={18} className="text-brand-600" />
          <h2 className="font-semibold">ความคิดเห็น</h2>
          <span className="text-sm text-ink-soft">({comments.length})</span>
        </div>

        {error ? (
          <p className="px-5 py-3 text-sm text-brand-700">{error}</p>
        ) : null}

        {loading ? (
          <div className="space-y-3 p-5">
            <div className="skeleton h-14 w-full" />
            <div className="skeleton h-14 w-full" />
          </div>
        ) : comments.length === 0 ? (
          <div className="flex flex-col items-center px-5 py-12 text-center">
            <MessageCircle size={30} className="text-ink-soft/50" />
            <p className="mt-3 text-sm font-medium">ยังไม่มีความคิดเห็น</p>
            <p className="mt-1 text-xs text-ink-soft">
              เริ่มแสดงความคิดเห็นเป็นคนแรกได้เลย
            </p>
          </div>
        ) : (
          <div className="divide-y divide-[color:var(--color-line)]">
            {comments.map((comment) => (
              <article key={comment.id} className="flex gap-3 px-5 py-4">
                <Link
                  href={`/u/${comment.author.username}`}
                  className="shrink-0"
                >
                  <Avatar
                    name={comment.author.display_name}
                    src={comment.author.avatar_url}
                    size={40}
                  />
                </Link>

                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <Link
                        href={`/u/${comment.author.username}`}
                        className="text-sm font-semibold hover:underline"
                      >
                        {comment.author.display_name}
                      </Link>

                      <RoleBadge
                        role={comment.author.role}
                        studyYear={comment.author.study_year}
                        faculty={comment.author.faculty_name}
                        className="mt-0.5"
                      />
                    </div>

                    {(comment.author.id === meId || isAdmin) && (
                      <button
                        type="button"
                        onClick={() => setDeletingCommentId(comment.id)}
                        aria-label="ลบความคิดเห็น"
                        title="ลบความคิดเห็น"
                        className="rounded-full p-2 text-ink-soft transition-colors hover:bg-brand-50 hover:text-brand-700"
                      >
                        <Trash2 size={15} />
                      </button>
                    )}
                  </div>

                  <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-relaxed">
                    {comment.body}
                  </p>

                  <p className="mt-2 text-xs text-ink-soft">
                    {timeAgo(comment.created_at)}
                  </p>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </>
  );
}