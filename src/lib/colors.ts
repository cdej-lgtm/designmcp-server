/**
 * Color Engine — OKLCH-based color math for DesignMCP
 *
 * Uses the OKLCH perceptual color space for palette generation —
 * the same approach as Radix UI, shadcn/ui, and Tailwind's palette tool.
 * OKLCH produces visually uniform steps across the scale that HSL cannot.
 */

// ─── Types ────────────────────────────────────────────────────────────────────

export interface RGB  { r: number; g: number; b: number }
export interface HSL  { h: number; s: number; l: number }
export interface OKLCH { L: number; C: number; H: number }
export interface ColorScale {
  50: string; 100: string; 200: string; 300: string; 400: string;
  500: string; 600: string; 700: string; 800: string; 900: string; 950: string;
}
export interface ContrastResult {
  ratio: number; aa: boolean; aaa: boolean; aaLarge: boolean; aaaLarge: boolean;
}

// ─── Named Color Map ──────────────────────────────────────────────────────────

const NAMED_COLORS: Record<string, string> = {
  "midnight blue": "#0f172a",   "navy": "#1e3a5f",          "cobalt": "#0047AB",
  "royal blue": "#4169E1",      "sky blue": "#87CEEB",       "teal": "#008080",
  "forest green": "#228B22",    "sage": "#8FBC8F",           "olive": "#808000",
  "emerald": "#50C878",         "mint": "#98FF98",           "lime": "#00FF00",
  "yellow": "#FFD700",          "amber": "#FFBF00",          "orange": "#FFA500",
  "coral": "#FF7F50",           "red": "#DC2626",            "rose": "#F43F5E",
  "pink": "#EC4899",            "fuchsia": "#C026D3",        "purple": "#7C3AED",
  "violet": "#8B5CF6",          "indigo": "#4F46E5",         "slate": "#64748B",
  "gray": "#6B7280",            "zinc": "#71717A",           "stone": "#78716C",
  "warm white": "#FAF9F6",      "cream": "#FFFDD0",          "black": "#09090B",
  "warm forest green": "#2D6A4F", "eco brand": "#40916C",
  "luxury gold": "#B8960C",     "tech blue": "#0EA5E9",
};

// ─── Parsing ──────────────────────────────────────────────────────────────────

export function parseColor(input: string): RGB {
  const clean = input.trim().toLowerCase();
  for (const [name, hex] of Object.entries(NAMED_COLORS)) {
    if (clean.includes(name)) return hexToRgb(hex);
  }
  const hex6 = clean.match(/^#?([a-f0-9]{6})$/i);
  if (hex6) return hexToRgb(`#${hex6[1]}`);
  const hex3 = clean.match(/^#?([a-f0-9]{3})$/i);
  if (hex3) {
    const [r, g, b] = hex3[1].split("").map(c => parseInt(c + c, 16));
    return { r, g, b };
  }
  const rgb = clean.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
  if (rgb) return { r: +rgb[1], g: +rgb[2], b: +rgb[3] };
  const hsl = clean.match(/hsl\((\d+),\s*(\d+)%?,\s*(\d+)%?\)/);
  if (hsl) return hslToRgb({ h: +hsl[1], s: +hsl[2] / 100, l: +hsl[3] / 100 });
  const hash = Array.from(clean).reduce((acc, c) => acc + c.charCodeAt(0), 0);
  return hslToRgb({ h: hash % 360, s: 0.65, l: 0.45 });
}

export function hexToRgb(hex: string): RGB {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return { r: 99, g: 102, b: 241 };
  return {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16),
  };
}

export function rgbToHex({ r, g, b }: RGB): string {
  return "#" + [r, g, b]
    .map(v => Math.round(Math.min(255, Math.max(0, v))).toString(16).padStart(2, "0"))
    .join("");
}

// ─── HSL (kept for backward compatibility) ────────────────────────────────────

export function rgbToHsl({ r, g, b }: RGB): HSL {
  const rn = r / 255, gn = g / 255, bn = b / 255;
  const max = Math.max(rn, gn, bn), min = Math.min(rn, gn, bn);
  let h = 0, s = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case rn: h = ((gn - bn) / d + (gn < bn ? 6 : 0)) / 6; break;
      case gn: h = ((bn - rn) / d + 2) / 6; break;
      case bn: h = ((rn - gn) / d + 4) / 6; break;
    }
  }
  return { h: Math.round(h * 360), s: Math.round(s * 100) / 100, l: Math.round(l * 100) / 100 };
}

export function hslToRgb({ h, s, l }: HSL): RGB {
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs((h / 60) % 2 - 1));
  const m = l - c / 2;
  let r = 0, g = 0, b = 0;
  if      (h < 60)  { r = c; g = x; }
  else if (h < 120) { r = x; g = c; }
  else if (h < 180) { g = c; b = x; }
  else if (h < 240) { g = x; b = c; }
  else if (h < 300) { r = x; b = c; }
  else              { r = c; b = x; }
  return {
    r: Math.round((r + m) * 255),
    g: Math.round((g + m) * 255),
    b: Math.round((b + m) * 255),
  };
}

export function hslToHex(hsl: HSL): string { return rgbToHex(hslToRgb(hsl)); }

// ─── OKLCH Color Space ────────────────────────────────────────────────────────
// Pipeline: sRGB ↔ Linear sRGB ↔ OKLab ↔ OKLCH

function srgbToLinear(c: number): number {
  const abs = Math.abs(c);
  return abs <= 0.04045
    ? c / 12.92
    : Math.sign(c) * Math.pow((abs + 0.055) / 1.055, 2.4);
}

function linearToSrgb(c: number): number {
  const abs = Math.abs(c);
  return abs <= 0.0031308
    ? c * 12.92
    : Math.sign(c) * (1.055 * Math.pow(abs, 1 / 2.4) - 0.055);
}

function rgbToOklab(rgb: RGB): { L: number; a: number; b: number } {
  const r = srgbToLinear(rgb.r / 255);
  const g = srgbToLinear(rgb.g / 255);
  const b = srgbToLinear(rgb.b / 255);

  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);

  return {
    L: 0.2104542553 * l + 0.7936177850 * m - 0.0040720468 * s,
    a: 1.9779984951 * l - 2.4285922050 * m + 0.4505937099 * s,
    b: 0.0259040371 * l + 0.7827717662 * m - 0.8086757660 * s,
  };
}

function oklabToRgb(lab: { L: number; a: number; b: number }): RGB {
  const l = Math.pow(lab.L + 0.3963377774 * lab.a + 0.2158037573 * lab.b, 3);
  const m = Math.pow(lab.L - 0.1055613458 * lab.a - 0.0638541728 * lab.b, 3);
  const s = Math.pow(lab.L - 0.0894841775 * lab.a - 1.2914855480 * lab.b, 3);

  const r = linearToSrgb(+4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s);
  const g = linearToSrgb(-1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s);
  const b = linearToSrgb(-0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s);

  return {
    r: Math.round(Math.min(1, Math.max(0, r)) * 255),
    g: Math.round(Math.min(1, Math.max(0, g)) * 255),
    b: Math.round(Math.min(1, Math.max(0, b)) * 255),
  };
}

export function rgbToOklch(rgb: RGB): OKLCH {
  const lab = rgbToOklab(rgb);
  return {
    L: lab.L,
    C: Math.sqrt(lab.a * lab.a + lab.b * lab.b),
    H: ((Math.atan2(lab.b, lab.a) * 180) / Math.PI + 360) % 360,
  };
}

export function oklchToRgb({ L, C, H }: OKLCH): RGB {
  const hRad = (H * Math.PI) / 180;
  return oklabToRgb({ L, a: C * Math.cos(hRad), b: C * Math.sin(hRad) });
}

// ─── Palette Generation (OKLCH) ───────────────────────────────────────────────

/**
 * Generate an 11-step perceptually uniform color scale.
 * Uses OKLCH: lightness varies uniformly, chroma is modulated at extremes
 * to produce naturalistic light/dark ends — the same quality as Radix/shadcn.
 */
export function generateColorScale(baseRgb: RGB): ColorScale {
  const { C, H } = rgbToOklch(baseRgb);

  const stops: Array<[keyof ColorScale, number]> = [
    [50, 0.975], [100, 0.950], [200, 0.900], [300, 0.815],
    [400, 0.700], [500, 0.580], [600, 0.480], [700, 0.385],
    [800, 0.295], [900, 0.210], [950, 0.145],
  ];

  const chromaAt = (L: number): number => {
    if (L >= 0.94) return C * 0.12;
    if (L >= 0.87) return C * 0.30;
    if (L >= 0.78) return C * 0.60;
    if (L <= 0.18) return C * 0.70;
    return Math.min(C, 0.38);
  };

  const scale: Partial<ColorScale> = {};
  for (const [step, L] of stops) {
    scale[step] = rgbToHex(oklchToRgb({ L, C: chromaAt(L), H }));
  }
  return scale as ColorScale;
}

/**
 * Generate a complementary/analogous color using OKLCH hue rotation.
 */
export function generateComplementary(
  baseRgb: RGB,
  type: "complement" | "split-complement" | "analogous" = "complement"
): RGB {
  const { L, C, H } = rgbToOklch(baseRgb);
  const offsets = { complement: 180, "split-complement": 150, analogous: 30 };
  return oklchToRgb({ L, C, H: (H + offsets[type]) % 360 });
}

export function generateDarkScale(lightScale: ColorScale): ColorScale {
  return {
    50: lightScale[950], 100: lightScale[900], 200: lightScale[800],
    300: lightScale[700], 400: lightScale[600], 500: lightScale[400],
    600: lightScale[300], 700: lightScale[200], 800: lightScale[100],
    900: lightScale[50],  950: "#09090b",
  };
}

// ─── WCAG Contrast ────────────────────────────────────────────────────────────

export function relativeLuminance({ r, g, b }: RGB): number {
  const [rs, gs, bs] = [r, g, b].map(c => {
    const srgb = c / 255;
    return srgb <= 0.03928 ? srgb / 12.92 : Math.pow((srgb + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

export function contrastRatio(fg: RGB, bg: RGB): number {
  const l1 = relativeLuminance(fg), l2 = relativeLuminance(bg);
  return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
}

export function checkContrast(fg: RGB, bg: RGB): ContrastResult {
  const ratio = contrastRatio(fg, bg);
  return {
    ratio: Math.round(ratio * 100) / 100,
    aa: ratio >= 4.5, aaa: ratio >= 7,
    aaLarge: ratio >= 3, aaaLarge: ratio >= 4.5,
  };
}

/**
 * Find the nearest accessible color to fg on bg.
 * Direction-aware: darkens for light backgrounds, lightens for dark ones.
 */
export function makeAccessible(fg: RGB, bg: RGB, targetRatio = 4.5): RGB {
  const { H, C } = rgbToOklch(fg);
  const bgLum = relativeLuminance(bg);
  const safeC = Math.min(C, 0.25);

  if (bgLum > 0.18) {
    // Light background → darken
    for (let L = 0.85; L >= 0; L -= 0.01) {
      const candidate = oklchToRgb({ L, C: safeC, H });
      if (contrastRatio(candidate, bg) >= targetRatio) return candidate;
    }
  } else {
    // Dark background → lighten
    for (let L = 0.20; L <= 1; L += 0.01) {
      const candidate = oklchToRgb({ L, C: safeC, H });
      if (contrastRatio(candidate, bg) >= targetRatio) return candidate;
    }
  }
  return bgLum > 0.18 ? { r: 9, g: 9, b: 11 } : { r: 250, g: 249, b: 246 };
}

// ─── Semantic Token Mapping ───────────────────────────────────────────────────

export interface SemanticColorTokens {
  "color-primary": string;          "color-primary-hover": string;
  "color-primary-subtle": string;   "color-primary-emphasis": string;
  "color-surface": string;          "color-surface-raised": string;
  "color-surface-overlay": string;  "color-border": string;
  "color-border-strong": string;    "color-text-primary": string;
  "color-text-secondary": string;   "color-text-disabled": string;
  "color-text-on-primary": string;  "color-success": string;
  "color-success-subtle": string;   "color-warning": string;
  "color-warning-subtle": string;   "color-error": string;
  "color-error-subtle": string;     "color-info": string;
  "color-info-subtle": string;
}

export function generateSemanticTokens(scale: ColorScale, mode: "light" | "dark" = "light"): SemanticColorTokens {
  if (mode === "light") {
    return {
      "color-primary": scale[600],          "color-primary-hover": scale[700],
      "color-primary-subtle": scale[50],    "color-primary-emphasis": scale[800],
      "color-surface": "#ffffff",           "color-surface-raised": "#f8fafc",
      "color-surface-overlay": "#f1f5f9",   "color-border": "#e2e8f0",
      "color-border-strong": "#cbd5e1",     "color-text-primary": "#0f172a",
      "color-text-secondary": "#475569",    "color-text-disabled": "#94a3b8",
      "color-text-on-primary": "#ffffff",   "color-success": "#16a34a",
      "color-success-subtle": "#f0fdf4",    "color-warning": "#d97706",
      "color-warning-subtle": "#fffbeb",    "color-error": "#dc2626",
      "color-error-subtle": "#fef2f2",      "color-info": scale[600],
      "color-info-subtle": scale[50],
    };
  }
  return {
    "color-primary": scale[400],            "color-primary-hover": scale[300],
    "color-primary-subtle": scale[950],     "color-primary-emphasis": scale[200],
    "color-surface": "#09090b",             "color-surface-raised": "#18181b",
    "color-surface-overlay": "#27272a",     "color-border": "#3f3f46",
    "color-border-strong": "#52525b",       "color-text-primary": "#fafafa",
    "color-text-secondary": "#a1a1aa",      "color-text-disabled": "#52525b",
    "color-text-on-primary": "#09090b",     "color-success": "#4ade80",
    "color-success-subtle": "#052e16",      "color-warning": "#fbbf24",
    "color-warning-subtle": "#1c1400",      "color-error": "#f87171",
    "color-error-subtle": "#2d0707",        "color-info": scale[400],
    "color-info-subtle": scale[950],
  };
}

// ─── Format Utilities ─────────────────────────────────────────────────────────

export function tokensToCSS(tokens: Record<string, string>, prefix = "", selector = ":root"): string {
  const vars = Object.entries(tokens)
    .map(([k, v]) => `  --${prefix ? prefix + "-" : ""}${k}: ${v};`)
    .join("\n");
  return `${selector} {\n${vars}\n}`;
}

export function tokensToJSON(tokens: Record<string, unknown>): string {
  return JSON.stringify(tokens, null, 2);
}

export function colorScaleToTailwind(scale: ColorScale, name: string): string {
  const entries = Object.entries(scale).map(([k, v]) => `      ${k}: '${v}',`).join("\n");
  return `    ${name}: {\n${entries}\n    },`;
}
