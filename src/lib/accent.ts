export interface Accent { from: string; to: string }

export const ACCENT_PRESETS: Array<{ id: string; name: string; accent: Accent | null }> = [
  { id: 'tu', name: 'ส้ม-เหลือง มธ.', accent: null },
  { id: 'tu-red', name: 'แดง-เหลือง มธ.', accent: { from: '#c11b32', to: '#f6a623' } },
  { id: 'green', name: 'เขียว', accent: { from: '#1d9257', to: '#3fb376' } },
  { id: 'sky', name: 'ฟ้า', accent: { from: '#1d6fd9', to: '#4fb3f0' } },
  { id: 'violet', name: 'ม่วง', accent: { from: '#6d42d6', to: '#b28cf5' } },
  { id: 'pink', name: 'ชมพู', accent: { from: '#e84f72', to: '#fb9ab0' } },
];

export const DEFAULT_ACCENT: Accent = { from: '#ee7a12', to: '#fbcb47' };

const HEX = /^#[0-9a-f]{6}$/i;
export const isHex = (s: unknown): s is string => typeof s === 'string' && HEX.test(s);

export function parseAccent(v: unknown): Accent | null {
  if (!v || typeof v !== 'object') return null;
  const { from, to } = v as Record<string, unknown>;
  return isHex(from) && isHex(to) ? { from: from.toLowerCase(), to: to.toLowerCase() } : null;
}

type RGB = [number, number, number];
const toRgb = (h: string): RGB => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16)) as RGB;
const toHex = (c: RGB) => '#' + c.map((x) => Math.round(Math.max(0, Math.min(255, x))).toString(16).padStart(2, '0')).join('');
const mix = (a: string, b: string, t: number) => {
  const x = toRgb(a), y = toRgb(b);
  return toHex([0, 1, 2].map((i) => x[i] + (y[i] - x[i]) * t) as RGB);
};
function luminance(h: string) {
  const [r, g, b] = toRgb(h).map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
export function contrast(a: string, b: string) {
  const [x, y] = [luminance(a), luminance(b)].sort((p, q) => q - p);
  return (x + 0.05) / (y + 0.05);
}
function ensureContrast(color: string, bg: string, target: string, min = 4.5) {
  let c = color;
  for (let t = 0; t <= 1 && contrast(c, bg) < min; t += 0.05) c = mix(color, target, t);
  return c;
}

const DARK_ON = '#2b1a00';
const DARK_SURFACE = '#1c1a19';
const DARK_CANVAS = '#141312';

export interface AccentVars {
  light: Record<string, string>;
  dark: Record<string, string>;
  gradient: string;
  gradientStrong: string;
  onBrand: string;
}

export function accentVars(a: Accent): AccentVars {
  const base = mix(a.from, a.to, 0.5);
  const worst = (fg: string) => Math.min(contrast(fg, a.from), contrast(fg, a.to));
  const onBrand = worst('#ffffff') >= worst(DARK_ON) ? '#ffffff' : DARK_ON;

  return {
    onBrand,
    gradient: `linear-gradient(120deg, ${a.from} 0%, ${base} 55%, ${a.to} 100%)`,
    gradientStrong: `linear-gradient(120deg, ${mix(a.from, '#000000', 0.1)} 0%, ${mix(base, '#000000', 0.1)} 55%, ${mix(a.to, '#000000', 0.1)} 100%)`,
    light: {
      '--color-brand-50': mix(base, '#ffffff', 0.92),
      '--color-brand-100': mix(base, '#ffffff', 0.84),
      '--color-brand-200': mix(base, '#ffffff', 0.66),
      '--color-brand-300': mix(base, '#ffffff', 0.42),
      '--color-brand-400': mix(base, '#ffffff', 0.18),
      '--color-brand-500': base,
      '--color-brand-600': mix(base, '#000000', 0.15),
      '--color-brand-700': ensureContrast(mix(base, '#000000', 0.3), '#ffffff', '#000000'),
      '--color-on-brand': onBrand,
    },
    dark: {
      '--color-brand-50': mix(base, DARK_CANVAS, 0.84),
      '--color-brand-100': mix(base, DARK_CANVAS, 0.76),
      '--color-brand-200': mix(base, DARK_CANVAS, 0.64),
      '--color-brand-700': ensureContrast(mix(base, '#ffffff', 0.3), DARK_SURFACE, '#ffffff'),
    },
  };
}

const decl = (o: Record<string, string>) => Object.entries(o).map(([k, v]) => `${k}:${v}`).join(';');

export function accentCss(a: Accent): string {
  const v = accentVars(a);
  const root = `${decl(v.light)};--brand-gradient:${v.gradient};--brand-gradient-strong:${v.gradientStrong}`;
  return `:root{${root}}`
    + `@media (prefers-color-scheme: dark){:root:not([data-theme='light']){${decl(v.dark)}}}`
    + `:root[data-theme='dark']{${decl(v.dark)}}`;
}
