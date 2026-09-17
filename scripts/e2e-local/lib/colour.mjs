// Colour maths for render calibration: sRGB ↔ linear ↔ CIELAB (D65),
// CIEDE2000, and three.js r162's NeutralToneMapping (Khronos PBR Neutral)
// forward and inverse.

export const srgbToLinear = (c) => (c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4));
export const linearToSrgb = (c) => {
  const v = Math.min(1, Math.max(0, c));
  return v <= 0.0031308 ? 12.92 * v : 1.055 * Math.pow(v, 1 / 2.4) - 0.055;
};

export const hexToRgb255 = (hex) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
export const rgb255ToHex = (rgb) => "#" + rgb.map((c) => Math.round(Math.min(255, Math.max(0, c))).toString(16).padStart(2, "0")).join("").toUpperCase();
export const rgb255ToLinear = (rgb) => rgb.map((c) => srgbToLinear(c / 255));
export const linearToRgb255 = (lin) => lin.map((c) => linearToSrgb(c) * 255);

export function linearToLab([r, g, b]) {
  const X = 0.4124564 * r + 0.3575761 * g + 0.1804375 * b;
  const Y = 0.2126729 * r + 0.7151522 * g + 0.072175 * b;
  const Z = 0.0193339 * r + 0.119192 * g + 0.9503041 * b;
  const f = (t) => (t > 216 / 24389 ? Math.cbrt(t) : (24389 / 27 * t + 16) / 116);
  const fx = f(X / 0.95047);
  const fy = f(Y / 1.0);
  const fz = f(Z / 1.08883);
  return [116 * fy - 16, 500 * (fx - fy), 200 * (fy - fz)];
}

export const hexToLab = (hex) => linearToLab(rgb255ToLinear(hexToRgb255(hex)));

/** CIEDE2000 (Sharma, Wu, Dalal 2005). */
export function deltaE2000([L1, a1, b1], [L2, a2, b2]) {
  const rad = Math.PI / 180;
  const C1 = Math.hypot(a1, b1);
  const C2 = Math.hypot(a2, b2);
  const Cb = (C1 + C2) / 2;
  const G = 0.5 * (1 - Math.sqrt(Cb ** 7 / (Cb ** 7 + 25 ** 7)));
  const a1p = (1 + G) * a1;
  const a2p = (1 + G) * a2;
  const C1p = Math.hypot(a1p, b1);
  const C2p = Math.hypot(a2p, b2);
  const h = (a, b) => {
    if (a === 0 && b === 0) return 0;
    const d = Math.atan2(b, a) / rad;
    return d < 0 ? d + 360 : d;
  };
  const h1p = h(a1p, b1);
  const h2p = h(a2p, b2);
  const dLp = L2 - L1;
  const dCp = C2p - C1p;
  let dhp = 0;
  if (C1p * C2p !== 0) {
    dhp = h2p - h1p;
    if (dhp > 180) dhp -= 360;
    else if (dhp < -180) dhp += 360;
  }
  const dHp = 2 * Math.sqrt(C1p * C2p) * Math.sin((dhp / 2) * rad);
  const Lbp = (L1 + L2) / 2;
  const Cbp = (C1p + C2p) / 2;
  let hbp = h1p + h2p;
  if (C1p * C2p !== 0) {
    if (Math.abs(h1p - h2p) > 180) hbp = h1p + h2p < 360 ? (h1p + h2p + 360) / 2 : (h1p + h2p - 360) / 2;
    else hbp = (h1p + h2p) / 2;
  }
  const T = 1 - 0.17 * Math.cos((hbp - 30) * rad) + 0.24 * Math.cos(2 * hbp * rad) + 0.32 * Math.cos((3 * hbp + 6) * rad) - 0.2 * Math.cos((4 * hbp - 63) * rad);
  const dTheta = 30 * Math.exp(-(((hbp - 275) / 25) ** 2));
  const RC = 2 * Math.sqrt(Cbp ** 7 / (Cbp ** 7 + 25 ** 7));
  const SL = 1 + (0.015 * (Lbp - 50) ** 2) / Math.sqrt(20 + (Lbp - 50) ** 2);
  const SC = 1 + 0.045 * Cbp;
  const SH = 1 + 0.015 * Cbp * T;
  const RT = -Math.sin(2 * dTheta * rad) * RC;
  return Math.sqrt((dLp / SL) ** 2 + (dCp / SC) ** 2 + (dHp / SH) ** 2 + RT * (dCp / SC) * (dHp / SH));
}

/** three.js NeutralToneMapping, applied after exposure. Linear in, linear out. */
export function neutralToneMap([r, g, b]) {
  const startCompression = 0.8 - 0.04;
  const desaturation = 0.15;
  const x = Math.min(r, g, b);
  const offset = x < 0.08 ? x - 6.25 * x * x : 0.04;
  let c = [r - offset, g - offset, b - offset];
  const peak = Math.max(...c);
  if (peak < startCompression) return c;
  const d = 1 - startCompression;
  const newPeak = 1 - (d * d) / (peak + d - startCompression);
  c = c.map((v) => (v * newPeak) / peak);
  const t = 1 - 1 / (desaturation * (peak - newPeak) + 1);
  return c.map((v) => v + (newPeak - v) * t);
}

/** Numeric inverse of neutralToneMap (monotone), fixed-point iteration. */
export function inverseNeutralToneMap(out) {
  let x = [...out];
  for (let i = 0; i < 60; i++) {
    const f = neutralToneMap(x);
    x = x.map((v, c) => Math.max(0, v + (out[c] - f[c])));
  }
  return x;
}

export const median = (values) => {
  const s = [...values].sort((a, b) => a - b);
  const m = s.length >> 1;
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
};

export const medianLab = (labs) => [0, 1, 2].map((i) => median(labs.map((l) => l[i])));

/** CIELAB hue angle in degrees, [0, 360). */
export const hueOf = ([, a, b]) => {
  const d = (Math.atan2(b, a) * 180) / Math.PI;
  return d < 0 ? d + 360 : d;
};

/** Smallest absolute difference between two hue angles, degrees. */
export const hueDifference = (h1, h2) => {
  const d = Math.abs(h1 - h2) % 360;
  return d > 180 ? 360 - d : d;
};
