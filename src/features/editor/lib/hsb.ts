import { normalizeHex } from "./pantone";

/** Hue 0–360, saturation and brightness 0–100. Grey keeps hue 0 until saturation returns. */
export function hexToHsb(hex: string): { h: number; s: number; b: number } {
  const colour = normalizeHex(hex);
  if (!colour) return { h: 0, s: 0, b: 0 };
  const red = parseInt(colour.slice(1, 3), 16) / 255;
  const green = parseInt(colour.slice(3, 5), 16) / 255;
  const blue = parseInt(colour.slice(5, 7), 16) / 255;
  const max = Math.max(red, green, blue);
  const min = Math.min(red, green, blue);
  const delta = max - min;
  let hue = 0;
  if (delta !== 0) {
    if (max === red) hue = ((green - blue) / delta) % 6;
    else if (max === green) hue = (blue - red) / delta + 2;
    else hue = (red - green) / delta + 4;
    hue *= 60;
    if (hue < 0) hue += 360;
  }
  return { h: Math.round(hue), s: max === 0 ? 0 : Math.round((delta / max) * 100), b: Math.round(max * 100) };
}

export function hsbToHex(hue: number, saturation: number, brightness: number): string {
  const h = ((hue % 360) + 360) % 360;
  const s = Math.max(0, Math.min(100, saturation)) / 100;
  const v = Math.max(0, Math.min(100, brightness)) / 100;
  const chroma = v * s;
  const x = chroma * (1 - Math.abs(((h / 60) % 2) - 1));
  const match = v - chroma;
  const [red, green, blue] = h < 60 ? [chroma, x, 0] : h < 120 ? [x, chroma, 0] : h < 180 ? [0, chroma, x] : h < 240 ? [0, x, chroma] : h < 300 ? [x, 0, chroma] : [chroma, 0, x];
  const byte = (channel: number) => Math.round((channel + match) * 255).toString(16).padStart(2, "0");
  return `#${byte(red)}${byte(green)}${byte(blue)}`.toUpperCase();
}
