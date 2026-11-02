// Small color helpers so themes can derive a palette from the brand colors.
type RGB = [number, number, number];

export function parseHex(hex: string): RGB {
  let h = hex.trim().replace('#', '');
  if (h.length === 3)
    h = h
      .split('')
      .map(c => c + c)
      .join('');
  if (!/^[0-9a-f]{6}$/i.test(h)) throw new Error(`Invalid color: ${hex}`);
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
}

const toHex = (rgb: RGB) =>
  '#' +
  rgb
    .map(v =>
      Math.round(Math.min(255, Math.max(0, v)))
        .toString(16)
        .padStart(2, '0'),
    )
    .join('');

export function mix(a: string, b: string, t: number): string {
  const x = parseHex(a);
  const y = parseHex(b);
  return toHex([x[0] + (y[0] - x[0]) * t, x[1] + (y[1] - x[1]) * t, x[2] + (y[2] - x[2]) * t]);
}

export const lighten = (c: string, t: number) => mix(c, '#ffffff', t);
export const darken = (c: string, t: number) => mix(c, '#000000', t);

export function alpha(c: string, a: number): string {
  const [r, g, b] = parseHex(c);
  return `rgba(${r},${g},${b},${a})`;
}

// WCAG relative luminance, used to pick black or white text on a colored background.
export function luminance(c: string): number {
  const [r, g, b] = parseHex(c).map(v => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export const onColor = (bg: string) => (luminance(bg) > 0.45 ? '#111111' : '#ffffff');
