import { Star } from 'lucide-react';
import { compact } from '@/lib/utils';

export function Stars({ count, size = 13 }: { count: number; size?: number }) {
  return (
    <span className="inline-flex items-center gap-1 text-amber-600">
      <Star size={size} className="fill-amber-400 text-amber-400" />
      <span className="text-xs font-semibold tabular-nums">{compact(count)}</span>
    </span>
  );
}
