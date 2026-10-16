function Bar({ w = 'w-full', h = 'h-4' }: { w?: string; h?: string }) {
  return <div className={`skeleton ${h} ${w}`} />;
}

export function PostCardSkeleton() {
  return (
    <div className="card p-4">
      <div className="flex items-center gap-3">
        <div className="skeleton h-10 w-10 rounded-full" />
        <div className="flex-1 space-y-2">
          <Bar w="w-32" h="h-3.5" />
          <Bar w="w-20" h="h-3" />
        </div>
      </div>
      <div className="mt-3 space-y-2">
        <Bar w="w-3/4" />
        <Bar />
        <Bar w="w-5/6" />
      </div>
      <div className="mt-4 flex gap-3">
        <Bar w="w-12" h="h-6" />
        <Bar w="w-12" h="h-6" />
        <Bar w="w-12" h="h-6" />
      </div>
    </div>
  );
}

export function FeedSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="mx-auto flex w-full max-w-[680px] flex-col gap-3">
      {Array.from({ length: count }).map((_, i) => <PostCardSkeleton key={i} />)}
    </div>
  );
}

export function ListSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="mx-auto flex w-full max-w-[680px] flex-col gap-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="card flex items-center gap-3 p-4">
          <div className="skeleton h-11 w-11 rounded-full" />
          <div className="flex-1 space-y-2">
            <Bar w="w-40" h="h-3.5" />
            <Bar w="w-24" h="h-3" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function ProfileSkeleton() {
  return (
    <div className="mx-auto flex w-full max-w-[680px] flex-col gap-3">
      <div className="card p-5">
        <div className="flex items-center gap-4">
          <div className="skeleton h-20 w-20 rounded-full" />
          <div className="flex-1 space-y-2.5">
            <Bar w="w-44" h="h-5" />
            <Bar w="w-28" h="h-3.5" />
            <Bar w="w-36" h="h-3.5" />
          </div>
        </div>
      </div>
      <FeedSkeleton count={3} />
    </div>
  );
}
