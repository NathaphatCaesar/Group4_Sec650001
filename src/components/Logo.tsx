// variant 'full' = สัญลักษณ์ BH + ชื่อ BACKHOME TU แนวนอน, 'mark' = สัญลักษณ์ BH อย่างเดียว
// แบบ full มีไฟล์ธีมมืดแยก (ตัวหนังสือสีอ่อน) สลับด้วยคลาส logo-light / logo-dark ใน globals.css
const SRC = {
  full: { src: '/logo-full.png', dark: '/logo-full-dark.png', ratio: 640 / 155 },
  mark: { src: '/logo-mark.png', dark: null, ratio: 200 / 155 },
} as const;

export function Logo({
  height = 40, variant = 'full',
}: { height?: number; variant?: keyof typeof SRC }) {
  const { src, dark, ratio } = SRC[variant];
  const width = Math.round(height * ratio);
  const img = (url: string, cls: string, alt: string) => (
    <img
      src={url}
      alt={alt}
      width={width}
      height={height}
      className={`select-none ${cls}`}
      style={{ width, height }}
      draggable={false}
    />
  );

  if (!dark) return img(src, 'block', 'BackHome TU');
  return (
    <>
      {img(src, 'logo-light', 'BackHome TU')}
      {img(dark, 'logo-dark', '')}
    </>
  );
}
