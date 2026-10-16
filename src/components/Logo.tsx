export function Logo({ size = 40 }: { size?: number }) {
  return (

    <img
      src="/logo.png"
      alt="BackHome TU"
      width={size}
      height={size}
      className="block select-none"
      style={{ width: size, height: size }}
      draggable={false}
    />
  );
}
