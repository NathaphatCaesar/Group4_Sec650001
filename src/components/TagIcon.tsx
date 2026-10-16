import { FileText, Users, CircleHelp, BarChart3, Megaphone, MessageCircle, type LucideProps } from 'lucide-react';
import { TAG_META, type PostTag } from '@/lib/types';

const ICONS = { FileText, Users, CircleHelp, BarChart3, Megaphone, MessageCircle } as const;

export function TagIcon({ tag, size = 14, ...rest }: { tag: PostTag } & LucideProps) {
  const Icon = ICONS[TAG_META[tag].icon];
  return <Icon size={size} aria-hidden {...rest} />;
}
