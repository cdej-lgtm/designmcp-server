export interface RGB { r: number; g: number; b: number }
export interface HSL { h: number; s: number; l: number }
export interface ColorScale {
  50: string; 100: string; 200: string; 300: string; 400: string;
  500: string; 600: string; 700: string; 800: string; 900: string; 950: string;
}

const NAMED_COLORS: Record<string, string> = {
  "midnight blue": "#0f172a", "navy": "#1e3a5f", "cobalt": "#0047AB",
  "royal blue": "#4169E1", "sky blue": "#87CEEB", "teal": "#008080",
  "forest green": "#228B22", "sage": "#8FBC8F", "olive": "#808000",
  "emerald": "#50C878", "mint": "#98FF98", "lime": "#00FF00",
  "yellow": "#FFD700", "amber": "#FFBF00", "orange": "#FFA500",
  "coral": "#FF7F50", "red": "#DC2626", "rose": "#F43F5E",
  "pink": "#EC4899", "fuchsia": "#C026D3", "purple": "#7C3AED",
  "violet": "#8B5CF6", "indigo": "#4F46E5", "slate": "#64748B",
  "gray": "#6B7280", "zinc": "#71717A", "stone": "#78716C",
  "warm white": "#FAF9F6", "cream": "#FFFDD0", "black": "#09090B",
  "warm forest green": "#2D6A4F", "eco brand": "#40916C",
  "luxury gold": "#B8960C", "tech blue": "#0EA5E9",
};

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
  return "#" + [r, g, b].map(v => Math.round(v).toString(16).padStart(2, "0")).join("");
}

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
  if (h < 60) { r = c; g = x; }
  else if (h < 120) { r = x; g = c; }
  else if (h < 180) { g = c; b = x; }
  else if (h < 240) { g = x; b = c; }
  else if (h < 300) { r = x; b = c; }
  else { r = c; b = x; }
  return {
    r: Math.round((r + m) * 255),
    g: Math.round((g + m) * 255),
    b: Math.round((b + m) * 255),
  };
}

export function hslToHex(hsl: HSL): string {
  return rgbToHex(hslToRgb(hsl));
}

export function generateColorScale(baseRgb: RGB): ColorScale {
  const { h, s } = rgbToHsl(baseRgb);
  const stops: Record<string, number> = {
    50: 0.97, 100: 0.94, 200: 0.88, 300: 0.77,
    400: 0.63, 500: 0.50, 600: 0.40, 700: 0.30,
    800: 0.22, 900: 0.15, 950: 0.09,
  };
  const satMod = (l: number) => {
    if (l > 0.85) return Math.max(s * 0.4, 0.08);
    if (l > 0.7) return s * 0.7;
    if (l < 0.2) return s * 0.8;
    return s;
  };
  const scale: Partial<ColorScale> = {};
  for (const [step, lightness] of Object.entries(stops)) {
    scale[step as unknown as keyof ColorScale] = hslToHex({ h, s: satMod(lightness), l: lightness });
  }
  return scale as ColorScale;
}

export function generateComplementary(baseRgb: RGB, type: "complement" | "split-complement" | "analogous" = "complement"): RGB {
  const { h, s, l } = rgbToHsl(baseRgb);
  const offsets = { complement: 180, "split-complement": 150, analogous: 30 };
  return hslToRgb({ h: (h + offsets[type]) % 360, s, l });
}

export function relativeLuminance({ r, g, b }: RGB): number {
  const [rs, gs, bs] = [r, g, b].map(c => {
    const srgb = c / 255;
    return srgb <= 0.03928 ? srgb / 12.92 : Math.pow((srgb + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

export function contrastRatio(fg: RGB, bg: RGB): number {
  const l1 = relativeLuminance(fg);
  const l2 = relativeLuminance(bg);
  return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
}

export function makeAccessible(fg: RGB, bg: RGB, targetRatio = 4.5): RGB {
  const { h, s } = rgbToHsl(fg);
  for (let l = 0; l <= 1; l += 0.01) {
    const candidate = hslToRgb({ h, s, l });
    if (contrastRatio(candidate, bg) >= targetRatio) return candidate;
  }
  return { r: 9, g: 9, b: 11 };
}

export function generateDarkScale(lightScale: ColorScale): ColorScale {
  return {
    50: lightScale[950], 100: lightScale[900], 200: lightScale[800],
    300: lightScale[700], 400: lightScale[600], 500: lightScale[400],
    600: lightScale[300], 700: lightScale[200], 800: lightScale[100],
    900: lightScale[50], 950: "#09090b",
  };
}

export interface SemanticColorTokens {
  "color-primary": string;
  "color-primary-hover": string;
  "color-primary-subtle": string;
  "color-surface": string;
  "color-surface-raised": string;
  "color-border": string;
  "color-text-primary": string;
  "color-text-secondary": string;
  "color-text-on-primary": string;
  "color-success": string;
  "color-warning": string;
  "color-error": string;
}

export function generateSemanticTokens(scale: ColorScale, mode: "light" | "dark" = "light"): SemanticColorTokens {
  if (mode === "light") {
    return {
      "color-primary": scale[600],
      "color-primary-hover": scale[700],
      "color-primary-subtle": scale[50],
      "color-surface": "#ffffff",
      "color-surface-raised": "#f8fafc",
      "color-border": "#e2e8f0",
      "color-text-primary": "#0f172a",
      "color-text-secondary": "#475569",
      "color-text-on-primary": "#ffffff",
      "color-success": "#16a34a",
      "color-warning": "#d97706",
      "color-error": "#dc2626",
    };
  }
  return {
    "color-primary": scale[400],
    "color-primary-hover": scale[300],
    "color-primary-subtle": scale[950],
    "color-surface": "#09090b",
    "color-surface-raised": "#18181b",
    "color-border": "#3f3f46",
    "color-text-primary": "#fafafa",
    "color-text-secondary": "#a1a1aa",
    "color-text-on-primary": "#09090b",
    "color-success": "#4ade80",
    "color-warning": "#fbbf24",
    "color-error": "#f87171",
  };
}

export function tokensToCSS(tokens: Record<string, string>, prefix = "", selector = ":root"): string {
  const vars = Object.entries(tokens)
    .map(([k, v]) => `  --${prefix ? prefix + "-" : ""}${k}: ${v};`)
    .join("\n");
  return `${selector} {\n${vars}\n}`;
}

export function colorScaleToTailwind(scale: ColorScale, name: string): string {
  const entries = Object.entries(scale)
    .map(([k, v]) => `      ${k}: '${v}',`)
    .join("\n");
  return `    ${name}: {\n${entries}\n    },`;
}
