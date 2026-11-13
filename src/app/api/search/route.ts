
import { NextResponse } from 'next/server';
import { db } from '@/lib/supabase';
import { currentUserId } from '@/lib/session';
import { rateLimit, clientIp } from '@/lib/security';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const MAX_RESULTS = 50;
const MAX_QUERY_LENGTH = 100;

export async function GET(request: Request) {
  try {
    // 1. Read and validate keyword
    const url = new URL(request.url);
    const keyword = (url.searchParams.get('q') ?? '').trim();

    if (!keyword) {
      return NextResponse.json(
        { error: 'กรุณาระบุคำค้นหา' },
        { status: 400 },
      );
    }

    if (keyword.length > MAX_QUERY_LENGTH) {
      return NextResponse.json(
        { error: 'คำค้นหายาวเกินไป' },
        { status: 400 },
      );
    }

    // 2. Authentication and rate limiting
    const userId = await currentUserId();
    const ip = clientIp(request.headers);

    const gate = rateLimit(`search:${userId ?? ip}`, {
      limit: 60,
      windowMs: 60_000,
    });

    if (!gate.ok) {
      return NextResponse.json(
        { error: 'ค้นหาถี่เกินไป กรุณารอสักครู่' },
        {
          status: 429,
          headers: {
            'Retry-After': String(gate.retryAfterSeconds),
          },
        },
      );
    }

    const pattern = `%${keyword}%`;

    // 3. Search helper for visible posts
    async function searchPostIds(
      column: 'title' | 'body' | 'subject_code',
    ): Promise<string[]> {
      let query = db()
        .from('posts')
        .select('id')
        .eq('is_hidden', false);

      if (userId) {
        query = query.or(
          `visibility.eq.public,author_id.eq.${userId}`,
        );
      } else {
        query = query.eq('visibility', 'public');
      }

      const { data, error } = await query
        .ilike(column, pattern)
        .limit(MAX_RESULTS);

      if (error) throw error;

      return (data ?? []).map((row) => row.id);
    }

    // 4. Search course code, title and content
    const [titleIds, bodyIds, courseIds] = await Promise.all([
      searchPostIds('title'),
      searchPostIds('body'),
      searchPostIds('subject_code'),
    ]);

    // 5. Search summarizer / post author
    const [nameResult, usernameResult] = await Promise.all([
      db()
        .from('profiles')
        .select('id')
        .eq('is_suspended', false)
        .ilike('display_name', pattern)
        .limit(MAX_RESULTS),

      db()
        .from('profiles')
        .select('id')
        .eq('is_suspended', false)
        .ilike('username', pattern)
        .limit(MAX_RESULTS),
    ]);

    if (nameResult.error) throw nameResult.error;
    if (usernameResult.error) throw usernameResult.error;

    const authorIds = [
      ...new Set([
        ...(nameResult.data ?? []).map((p) => p.id),
        ...(usernameResult.data ?? []).map((p) => p.id),
      ]),
    ];

    // 6. Search study sheet attachment names
    const { data: attachmentMatches, error: attachmentError } =
      await db()
        .from('post_attachments')
        .select('post_id')
        .ilike('file_name', pattern)
        .limit(MAX_RESULTS);

    if (attachmentError) throw attachmentError;

    // 7. Combine matching post IDs
    let matchingIds = [
      ...new Set([
        ...titleIds,
        ...bodyIds,
        ...courseIds,
        ...(attachmentMatches ?? []).map((a) => a.post_id),
      ]),
    ];

    if (authorIds.length > 0) {
      let authorQuery = db()
        .from('posts')
        .select('id')
        .in('author_id', authorIds)
        .eq('is_hidden', false);

      if (userId) {
        authorQuery = authorQuery.or(
          `visibility.eq.public,author_id.eq.${userId}`,
        );
      } else {
        authorQuery = authorQuery.eq('visibility', 'public');
      }

      const { data, error } = await authorQuery.limit(MAX_RESULTS);

      if (error) throw error;

      matchingIds.push(...(data ?? []).map((p) => p.id));
    }

    matchingIds = [...new Set(matchingIds)];

    if (matchingIds.length === 0) {
      return NextResponse.json({
        query: keyword,
        total: 0,
        results: [],
      });
    }

    // 8. Load matching posts
    let postsQuery = db()
      .from('posts')
      .select(`
        id,
        author_id,
        tag,
        title,
        body,
        subject_code,
        created_at,
        like_count,
        comment_count,
        is_pinned
      `)
      .in('id', matchingIds)
      .eq('is_hidden', false);

    if (userId) {
      postsQuery = postsQuery.or(
        `visibility.eq.public,author_id.eq.${userId}`,
      );
    } else {
      postsQuery = postsQuery.eq('visibility', 'public');
    }

    const { data: posts, error: postsError } = await postsQuery
      .order('is_pinned', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(MAX_RESULTS);

    if (postsError) throw postsError;

    const results = posts ?? [];
    const postIds = results.map((p) => p.id);
    const resultAuthorIds = [
      ...new Set(results.map((p) => p.author_id)),
    ];

    // 9. Load author information and attachments
    const [profilesResult, attachmentsResult] = await Promise.all([
      resultAuthorIds.length
        ? db()
            .from('profiles')
            .select('id, username, display_name, avatar_url')
            .in('id', resultAuthorIds)
        : Promise.resolve({ data: [], error: null }),

      postIds.length
        ? db()
            .from('post_attachments')
            .select(
              'id, post_id, file_name, kind, mime_type, size_bytes',
            )
            .in('post_id', postIds)
            .order('sort_order', { ascending: true })
        : Promise.resolve({ data: [], error: null }),
    ]);

    if (profilesResult.error) throw profilesResult.error;
    if (attachmentsResult.error) throw attachmentsResult.error;

    const profiles = profilesResult.data ?? [];
    const attachments = attachmentsResult.data ?? [];

    // 10. Format response
    const formattedResults = results.map((post) => ({
      ...post,
      author:
        profiles.find((p) => p.id === post.author_id) ?? null,
      attachments: attachments.filter(
        (a) => a.post_id === post.id,
      ),
    }));

    return NextResponse.json({
      query: keyword,
      total: formattedResults.length,
      results: formattedResults,
    });
  } catch (error) {
    console.error('[api/search] Search failed:', error);

    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในการค้นหา' },
      { status: 500 },
    );
  }
}
