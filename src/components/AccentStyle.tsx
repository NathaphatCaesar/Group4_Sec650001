import { accentCss, type Accent } from '@/lib/accent';

export function AccentStyle({ accent }: { accent: Accent | null }) {
  if (!accent) return null;
  return <style id="bh-accent" dangerouslySetInnerHTML={{ __html: accentCss(accent) }} />;
}
