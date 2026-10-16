import { avatarTint, initials } from '@/lib/utils';
import clsx from 'clsx';

export function Avatar({
  name, src, size = 40, className,
}: {
  name: string;
  src?: string | null;
  size?: number;
  className?: string;

  frame?: string | null;
}) {
  const inner = src ? (

    <img
      src={src}
      alt={name}
      width={size}
      height={size}
      className={clsx('block shrink-0 rounded-full object-cover', className)}
      style={{ width: size, height: size }}
    />
  ) : (
    <span
      className={clsx('grid shrink-0 place-items-center rounded-full font-semibold text-ink/70', className)}
      style={{ width: size, height: size, background: avatarTint(name), fontSize: size * 0.42 }}
      aria-hidden
    >
      {initials(name)}
    </span>
  );

  return inner;
}
