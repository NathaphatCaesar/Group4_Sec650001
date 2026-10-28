import { searchPosts } from '@/lib/data';
import { FeedList } from '@/components/FeedList';

export const dynamic = 'force-dynamic';

type SearchPageProps = {
  searchParams: Promise<{
    q?: string | string[];
  }>;
};

export default async function SearchPage({
  searchParams,
}: SearchPageProps) {
  const params = await searchParams;
  const value = params.q;

  const query = (
    Array.isArray(value) ? value[0] : value ?? ''
  ).trim();

  const posts = query ? await searchPosts(query) : [];

  return (
    <main className="mx-auto w-full max-w-[640px] space-y-6 px-4 py-6">
      <h1 className="text-xl font-bold">Search</h1>

      {!query ? (
        <p className="text-sm text-white/60">
          Enter a keyword in the search bar to find posts.
        </p>
      ) : (
        <>
          <p className="text-sm text-white/60">
            Results for:{' '}
            <span className="font-semibold">{query}</span>
          </p>

          <FeedList
            initial={posts}
            meId={null}
            isAdmin={false}
            emptyTitle="No results found"
            emptyHint="Try another keyword."
          />
        </>
      )}
    </main>
  );
}