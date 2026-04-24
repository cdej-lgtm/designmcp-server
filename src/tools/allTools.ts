import {
  parseColor,
  generateColorScale,
  generateDarkScale,
  generateSemanticTokens,
  generateComplementary,
  tokensToCSS,
  colorScaleToTailwind,
  rgbToHex,
  hexToRgb,
  contrastRatio,
  makeAccessible,
} from "../lib/colors.js";

// ── Color Palette ──────────────────────────────────────────

export async function generateColorPalette({ input, style, darkMode, format }: {
  input: string; style: string; darkMode: boolean; format: string;
}): Promise<string> {
  const baseRgb = parseColor(input);
  const scale = generateColorScale(baseRgb);
  const darkScale = darkMode ? generateDarkScale(scale) : null;
  const semanticLight = generateSemanticTokens(scale, "light");
  const semanticDark = darkMode ? generateSemanticTokens(darkScale ?? scale, "dark") : null;
  const accentRgb = generateComplementary(baseRgb, "split-complement");
  const accentScale = generateColorScale(accentRgb);

  const primitiveTokens: Record<string, string> = {};
  for (const [step, hex] of Object.entries(scale)) {
    primitiveTokens[`color-primary-${step}`] = hex;
  }
  for (const [step, hex] of Object.entries(accentScale)) {
    primitiveTokens[`color-accent-${step}`] = hex;
  }

  const sections: string[] = [];

  if (format === "json" || format === "all") {
    const json = {
      meta: { tool: "DesignMCP", input, style, baseColor: rgbToHex(baseRgb), generatedAt: new Date().toISOString() },
      tokens: {
        primitive: primitiveTokens,
        semantic: { light: semanticLight, ...(semanticDark ? { dark: semanticDark } : {}) },
      },
    };
    sections.push("## JSON Design Tokens\n\n```json\n" + JSON.stringify(json, null, 2) + "\n```");
  }

  if (format === "css" || format === "all") {
    const primitiveCss = tokensToCSS(primitiveTokens);
    const semanticLightCss = tokensToCSS(semanticLight as Record<string, string>);
    const semanticDarkCss = semanticDark
      ? tokensToCSS(semanticDark as Record<string, string>, "", "[data-theme='dark'], .dark")
      : "";
    sections.push("## CSS Custom Properties\n\n```css\n" + primitiveCss + "\n\n" + semanticLightCss + (semanticDarkCss ? "\n\n" + semanticDarkCss : "") + "\n```");
  }

  if (format === "tailwind" || format === "all") {
    const tw = `// tailwind.config.js\nmodule.exports = {\n  darkMode: 'class',\n  theme: {\n    extend: {\n      colors: {\n${colorScaleToTailwind(scale, "primary")}\n${colorScaleToTailwind(accentScale, "accent")}\n      },\n    },\n  },\n}`;
    sections.push("## Tailwind Config\n\n```js\n" + tw + "\n```");
  }

  return sections.join("\n\n---\n\n");
}

// ── Typography ─────────────────────────────────────────────

const FONT_PAIRINGS: Record<string, { display: string; body: string; mono: string; import: string }> = {
  corporate: { display: "'Inter', sans-serif", body: "'Inter', sans-serif", mono: "'JetBrains Mono', monospace", import: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" },
  editorial: { display: "'Playfair Display', serif", body: "'Source Serif 4', serif", mono: "'Fira Code', monospace", import: "https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700&family=Source+Serif+4:wght@400;600&display=swap" },
  technical: { display: "'IBM Plex Sans', sans-serif", body: "'IBM Plex Sans', sans-serif", mono: "'IBM Plex Mono', monospace", import: "https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;500;600;700&family=IBM+Plex+Mono&display=swap" },
  humanist: { display: "'DM Sans', sans-serif", body: "'Lato', sans-serif", mono: "'Source Code Pro', monospace", import: "https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Lato:wght@400;700&display=swap" },
  geometric: { display: "'Outfit', sans-serif", body: "'Outfit', sans-serif", mono: "'Space Mono', monospace", import: "https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&family=Space+Mono&display=swap" },
  luxury: { display: "'Cormorant Garamond', serif", body: "'Jost', sans-serif", mono: "'Courier Prime', monospace", import: "https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;500;600&family=Jost:wght@300;400;500&display=swap" },
  playful: { display: "'Nunito', sans-serif", body: "'Nunito', sans-serif", mono: "'Courier Prime', monospace", import: "https://fonts.googleapis.com/css2?family=Nunito:wght@400;500;600;700;800&display=swap" },
};

export async function generateTypographySystem({ personality, baseSize, scaleRatio, brandName, format }: {
  personality: string; baseSize: number; scaleRatio: string; brandName: string; format: string;
}): Promise<string> {
  const fonts = FONT_PAIRINGS[personality] ?? FONT_PAIRINGS.geometric;
  const ratios: Record<string, number> = { "minor-third": 1.2, "major-third": 1.25, "perfect-fourth": 1.333, "golden": 1.618 };
  const ratio = ratios[scaleRatio] ?? 1.333;
  const names = ["xs", "sm", "base", "lg", "xl", "2xl", "3xl", "4xl", "5xl"];
  const steps = [-2, -1, 0, 1, 2, 3, 4, 5, 6];
  const sizes: Record<string, string> = {};
  names.forEach((name, i) => {
    const px = Math.round(baseSize * Math.pow(ratio, steps[i]));
    sizes[`font-size-${name}`] = (px / 16).toFixed(3) + "rem";
  });

  const sections: string[] = [];
  if (format === "css" || format === "all") {
    const css = `@import url('${fonts.import}');\n\n:root {\n  --font-family-display: ${fonts.display};\n  --font-family-body: ${fonts.body};\n  --font-family-mono: ${fonts.mono};\n` +
      Object.entries(sizes).map(([k, v]) => `  --${k}: ${v};`).join("\n") + "\n}";
    sections.push("## Typography CSS\n\n```css\n" + css + "\n```");
  }
  if (format === "json" || format === "all") {
    sections.push("## Typography JSON\n\n```json\n" + JSON.stringify({ fonts, sizes }, null, 2) + "\n```");
  }
  return sections.join("\n\n---\n\n");
}

// ── Shadows ────────────────────────────────────────────────

export async function generateShadowSystem({ mode, style, brandColor, format }: {
  mode: string; style: string; brandColor?: string; format: string;
}): Promise<string> {
  const lightShadows: Record<string, string> = {
    "shadow-xs": "0 1px 2px 0 rgb(0 0 0 / 0.05)",
    "shadow-sm": "0 1px 3px 0 rgb(0 0 0 / 0.10), 0 1px 2px -1px rgb(0 0 0 / 0.10)",
    "shadow-md": "0 4px 6px -1px rgb(0 0 0 / 0.10), 0 2px 4px -2px rgb(0 0 0 / 0.10)",
    "shadow-lg": "0 10px 15px -3px rgb(0 0 0 / 0.10), 0 4px 6px -4px rgb(0 0 0 / 0.10)",
    "shadow-xl": "0 20px 25px -5px rgb(0 0 0 / 0.10), 0 8px 10px -6px rgb(0 0 0 / 0.10)",
    "shadow-2xl": "0 25px 50px -12px rgb(0 0 0 / 0.25)",
    "shadow-none": "0 0 #0000",
  };
  const darkShadows: Record<string, string> = {
    "shadow-xs": "0 1px 2px 0 rgb(0 0 0 / 0.40)",
    "shadow-sm": "0 1px 3px 0 rgb(0 0 0 / 0.60)",
    "shadow-md": "0 4px 6px -1px rgb(0 0 0 / 0.60)",
    "shadow-lg": "0 10px 15px -3px rgb(0 0 0 / 0.60)",
    "shadow-xl": "0 20px 25px -5px rgb(0 0 0 / 0.60)",
    "shadow-2xl": "0 25px 50px -12px rgb(0 0 0 / 0.80)",
    "shadow-none": "0 0 #0000",
  };
  const sections: string[] = [];
  if (format === "css" || format === "all") {
    let css = ":root {\n" + Object.entries(lightShadows).map(([k, v]) => `  --${k}: ${v};`).join("\n") + "\n}";
    if (mode === "both" || mode === "dark") {
      css += "\n\n[data-theme='dark'], .dark {\n" + Object.entries(darkShadows).map(([k, v]) => `  --${k}: ${v};`).join("\n") + "\n}";
    }
    sections.push("## Shadow CSS\n\n```css\n" + css + "\n```");
  }
  if (format === "json" || format === "all") {
    sections.push("## Shadow JSON\n\n```json\n" + JSON.stringify({ light: lightShadows, dark: darkShadows }, null, 2) + "\n```");
  }
  return sections.join("\n\n---\n\n");
}

// ── Spacing ────────────────────────────────────────────────

export async function generateSpacingScale({ baseUnit, steps, naming, format }: {
  baseUnit: number; steps: number; naming: string; format: string;
}): Promise<string> {
  const tokens: Record<string, string> = {};
  for (let i = 0; i < steps; i++) {
    const px = baseUnit * (i + 1);
    tokens[`space-${i + 1}`] = (px / 16).toFixed(3) + "rem";
  }
  const sections: string[] = [];
  if (format === "css" || format === "all") {
    const css = ":root {\n" + Object.entries(tokens).map(([k, v]) => `  --${k}: ${v};`).join("\n") + "\n}";
    sections.push("## Spacing CSS\n\n```css\n" + css + "\n```");
  }
  if (format === "json" || format === "all") {
    sections.push("## Spacing JSON\n\n```json\n" + JSON.stringify(tokens, null, 2) + "\n```");
  }
  return sections.join("\n\n---\n\n");
}

// ── Component Tokens ───────────────────────────────────────

export async function generateComponentTokens({ components, brandColor, format }: {
  components: string[]; brandColor: string; format: string;
}): Promise<string> {
  const baseRgb = parseColor(brandColor);
  const scale = generateColorScale(baseRgb);
  const defs: Record<string, Record<string, string>> = {
    button: {
      "btn-bg": scale[600], "btn-bg-hover": scale[700], "btn-bg-active": scale[800],
      "btn-bg-disabled": "#e2e8f0", "btn-text": "#ffffff", "btn-text-disabled": "#94a3b8",
      "btn-radius": "0.375rem", "btn-padding-x": "1rem", "btn-padding-y": "0.5rem",
    },
    input: {
      "input-bg": "#ffffff", "input-border": "#e2e8f0", "input-border-focus": scale[500],
      "input-border-error": "#dc2626", "input-text": "#0f172a", "input-radius": "0.375rem",
    },
    card: {
      "card-bg": "#ffffff", "card-border": "#e2e8f0",
      "card-shadow": "0 1px 3px 0 rgb(0 0 0 / 0.10)", "card-radius": "0.75rem", "card-padding": "1.5rem",
    },
    badge: {
      "badge-bg-primary": scale[100], "badge-text-primary": scale[800],
      "badge-bg-success": "#dcfce7", "badge-text-success": "#166534",
      "badge-bg-error": "#fee2e2", "badge-text-error": "#991b1b",
      "badge-radius": "9999px",
    },
    modal: {
      "modal-bg": "#ffffff", "modal-overlay": "rgb(0 0 0 / 0.50)",
      "modal-shadow": "0 25px 50px -12px rgb(0 0 0 / 0.25)", "modal-radius": "0.75rem",
    },
    alert: {
      "alert-bg-info": scale[50], "alert-border-info": scale[200], "alert-text-info": scale[800],
      "alert-bg-error": "#fef2f2", "alert-border-error": "#fecaca", "alert-text-error": "#991b1b",
      "alert-radius": "0.5rem",
    },
  };
  const selected: Record<string, string> = {};
  for (const comp of components) {
    if (defs[comp]) Object.assign(selected, defs[comp]);
  }
  const sections: string[] = [];
  if (format === "css" || format === "all") {
    const css = ":root {\n" + Object.entries(selected).map(([k, v]) => `  --${k}: ${v};`).join("\n") + "\n}";
    sections.push("## Component CSS\n\n```css\n" + css + "\n```");
  }
  if (format === "json" || format === "all") {
    sections.push("## Component JSON\n\n```json\n" + JSON.stringify(selected, null, 2) + "\n```");
  }
  return sections.join("\n\n---\n\n");
}

// ── Accessibility ──────────────────────────────────────────

export async function checkAccessibility({ pairs, level, suggestFixes }: {
  pairs: Array<{ foreground: string; background: string; label?: string }>; level: string; suggestFixes: boolean;
}): Promise<string> {
  const target = level === "AAA" ? 7 : 4.5;
  const results: string[] = [];
  for (const pair of pairs) {
    const fg = hexToRgb(pair.foreground);
    const bg = hexToRgb(pair.background);
    const ratio = Math.round(contrastRatio(fg, bg) * 100) / 100;
    const pass = ratio >= target;
    const label = pair.label ?? `${pair.foreground} on ${pair.background}`;
    let entry = `### ${pass ? "✅" : "❌"} ${label}\n- Ratio: **${ratio}:1** (needs ${target}:1)\n- AA: ${ratio >= 4.5 ? "✅" : "❌"}  AAA: ${ratio >= 7 ? "✅" : "❌"}`;
    if (!pass && suggestFixes) {
      const fixed = makeAccessible(fg, bg, target);
      const fixedHex = rgbToHex(fixed);
      const fixedRatio = Math.round(contrastRatio(fixed, bg) * 100) / 100;
      entry += `\n- **Fix:** Use \`${fixedHex}\` → ratio becomes **${fixedRatio}:1** ✅`;
    }
    results.push(entry);
  }
  return [`## WCAG ${level} Report`, ...results].join("\n\n");
}

// ── Export Tokens ──────────────────────────────────────────

export async function exportTokens({ tokens, targetFormat, prefix }: {
  tokens: Record<string, unknown>; targetFormat: string; prefix?: string;
}): Promise<string> {
  const pre = prefix ? `${prefix}-` : "";
  const flat = flattenTokens(tokens);
  switch (targetFormat) {
    case "css": return "```css\n:root {\n" + Object.entries(flat).map(([k, v]) => `  --${pre}${k}: ${v};`).join("\n") + "\n}\n```";
    case "scss": return "```scss\n" + Object.entries(flat).map(([k, v]) => `$${pre}${k.replace(/-/g, "_")}: ${v};`).join("\n") + "\n```";
    case "tailwind-v4": return "```css\n@theme {\n" + Object.entries(flat).map(([k, v]) => `  --${pre}${k}: ${v};`).join("\n") + "\n}\n```";
    case "swift": {
      const entries = Object.entries(flat).filter(([, v]) => String(v).startsWith("#"))
        .map(([k, v]) => `  static let ${k.replace(/-([a-z])/g, (_, c) => c.toUpperCase())} = Color(hex: "${v}")`).join("\n");
      return "```swift\nextension Color {\n" + entries + "\n}\n```";
    }
    default: return "```json\n" + JSON.stringify(flat, null, 2) + "\n```";
  }
}

function flattenTokens(obj: Record<string, unknown>, prefix = ""): Record<string, string> {
  const result: Record<string, string> = {};
  for (const [key, val] of Object.entries(obj)) {
    const newKey = prefix ? `${prefix}-${key}` : key;
    if (val && typeof val === "object" && !Array.isArray(val)) {
      Object.assign(result, flattenTokens(val as Record<string, unknown>, newKey));
    } else {
      result[newKey] = String(val);
    }
  }
  return result;
}

// ── Brand URL Analyzer ─────────────────────────────────────

export async function analyzeBrandURL({ url, outputFormat }: {
  url: string; outputFormat: string;
}): Promise<string> {
  const domain = new URL(url).hostname.replace("www.", "");
  return `## Brand Analysis: ${domain}\n\nLive URL analysis requires browser access. Deploy with --browser flag or use the hosted version.\n\n### Manual Workaround\n1. Open ${url} in DevTools\n2. Note primary colors and fonts\n3. Use generate_color_palette with those values`;
}

// ── Theme Generator ────────────────────────────────────────

function inferPersonality(description: string): { color: string; personality: string } {
  const d = description.toLowerCase();
  if (d.match(/fintech|bank|finance|enterprise|saas|b2b/)) return { color: "#0ea5e9", personality: "corporate" };
  if (d.match(/gen z|youth|fun|bold|vibrant|gaming/)) return { color: "#8b5cf6", personality: "playful" };
  if (d.match(/luxury|premium|elegant|couture/)) return { color: "#b8860b", personality: "luxury" };
  if (d.match(/eco|green|nature|organic/)) return { color: "#16a34a", personality: "humanist" };
  if (d.match(/dev|developer|tech|code|dark|terminal/)) return { color: "#6366f1", personality: "technical" };
  if (d.match(/health|wellness|calm|mindful/)) return { color: "#0d9488", personality: "humanist" };
  if (d.match(/media|editorial|magazine|news/)) return { color: "#dc2626", personality: "editorial" };
  return { color: "#4f46e5", personality: "geometric" };
}

export async function generateTheme({ description, format, includeComponentTokens }: {
  description: string; format: string; includeComponentTokens: boolean;
}): Promise<string> {
  const { color, personality } = inferPersonality(description);
  const colorSection = await generateColorPalette({ input: color, style: "professional", darkMode: true, format });
  const typoSection = await generateTypographySystem({ personality, baseSize: 16, scaleRatio: "perfect-fourth", brandName: "brand", format });
  const spacingSection = await generateSpacingScale({ baseUnit: 4, steps: 12, naming: "numeric", format });
  const shadowSection = await generateShadowSystem({ mode: "both", style: "soft", format });
  let componentSection = "";
  if (includeComponentTokens) {
    componentSection = "\n\n---\n\n## Component Tokens\n\n" + await generateComponentTokens({ components: ["button", "input", "card", "badge"], brandColor: color, format: "css" });
  }
  return `# Generated Theme\n**Prompt:** "${description}"\n**Color:** \`${color}\` | **Personality:** \`${personality}\`\n\n---\n\n## Colors\n${colorSection}\n\n---\n\n## Typography\n${typoSection}\n\n---\n\n## Spacing\n${spacingSection}\n\n---\n\n## Shadows\n${shadowSection}${componentSection}`;
}

export async function generateDesignTokens({ brandColor, brandName, secondaryColor, personality, includeMotion, format }: {
  brandColor: string; brandName: string; secondaryColor?: string; personality: string; includeMotion: boolean; format: string;
}): Promise<string> {
  const colorSection = await generateColorPalette({ input: brandColor, style: "professional", darkMode: true, format });
  const typoMap: Record<string, string> = { corporate: "corporate", startup: "geometric", creative: "humanist", luxury: "luxury", minimal: "technical", playful: "playful" };
  const typoSection = await generateTypographySystem({ personality: typoMap[personality] ?? "geometric", baseSize: 16, scaleRatio: "perfect-fourth", brandName, format });
  const spacingSection = await generateSpacingScale({ baseUnit: 4, steps: 16, naming: "numeric", format });
  const shadowSection = await generateShadowSystem({ mode: "both", style: "soft", brandColor, format });
  const motionTokens = includeMotion ? "\n\n## Motion Tokens\n\n```css\n:root {\n  --duration-fast: 100ms;\n  --duration-normal: 200ms;\n  --duration-slow: 300ms;\n  --easing-ease-out: cubic-bezier(0, 0, 0.2, 1);\n  --easing-spring: cubic-bezier(0.175, 0.885, 0.32, 1.275);\n  --radius-sm: 0.125rem;\n  --radius-md: 0.375rem;\n  --radius-lg: 0.5rem;\n  --radius-xl: 0.75rem;\n  --radius-full: 9999px;\n}\n```" : "";
  return `# ${brandName.toUpperCase()} Design Token System\n\n---\n\n## Colors\n${colorSection}\n\n---\n\n## Typography\n${typoSection}\n\n---\n\n## Spacing\n${spacingSection}\n\n---\n\n## Shadows\n${shadowSection}${motionTokens}`;
}
