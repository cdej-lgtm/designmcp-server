import {
  parseColor, generateColorScale, generateDarkScale, generateSemanticTokens,
  rgbToHex, hexToRgb, contrastRatio, makeAccessible,
  tokensToCSS, colorScaleToTailwind,
} from "../lib/colors.js";

// ────────────────────────────────────────────────────────
// colorPalette.ts
// ────────────────────────────────────────────────────────

interface GenerateColorPaletteArgs {
  input: string;
  style: "professional" | "playful" | "minimal" | "bold" | "earthy" | "luxury";
  darkMode: boolean;
  format: "json" | "css" | "tailwind" | "all";
}

export async function generateColorPalette({ input, darkMode, format }: GenerateColorPaletteArgs): Promise<string> {
  const baseRgb = parseColor(input);
  const lightScale = generateColorScale(baseRgb);
  const darkScale = generateDarkScale(lightScale);
  const lightTokens = generateSemanticTokens(lightScale, "light");
  const darkTokens = generateSemanticTokens(darkScale, "dark");

  const sections: string[] = [];

  if (format === "css" || format === "all") {
    const primitiveEntries = Object.entries(lightScale)
      .map(([k, v]) => `  --color-scale-${k}: ${v};`)
      .join("\n");
    let css = `:root {\n${primitiveEntries}\n}\n\n`;
    css += tokensToCSS(lightTokens as unknown as Record<string, string>);
    if (darkMode) {
      const darkPrimitiveEntries = Object.entries(darkScale)
        .map(([k, v]) => `  --color-scale-${k}: ${v};`)
        .join("\n");
      css += `\n\n[data-theme='dark'], .dark {\n${darkPrimitiveEntries}\n}\n\n`;
      css += tokensToCSS(darkTokens as unknown as Record<string, string>, "", "[data-theme='dark'], .dark");
    }
    sections.push("### CSS Variables\n\n```css\n" + css + "\n```");
  }

  if (format === "tailwind" || format === "all") {
    const tailwind = colorScaleToTailwind(lightScale, "primary");
    sections.push("### Tailwind Config\n\n```js\n// tailwind.config.js — theme.extend.colors\n{\n" + tailwind + "\n}\n```");
  }

  if (format === "json" || format === "all") {
    const json = {
      primitive: lightScale,
      semantic: {
        light: lightTokens,
        ...(darkMode ? { dark: darkTokens } : {}),
      },
    };
    sections.push("### JSON\n\n```json\n" + JSON.stringify(json, null, 2) + "\n```");
  }

  return sections.join("\n\n");
}

// ────────────────────────────────────────────────────────
// typography.ts
// ────────────────────────────────────────────────────────

type TypographyPersonality = "corporate" | "editorial" | "technical" | "humanist" | "geometric" | "luxury" | "playful";
type ScaleRatio = "minor-third" | "major-third" | "perfect-fourth" | "golden";

interface GenerateTypographyArgs {
  personality: TypographyPersonality;
  baseSize: number;
  scaleRatio: ScaleRatio;
  brandName: string;
  format: "json" | "css" | "tailwind" | "all";
}

const FONT_PAIRINGS: Record<TypographyPersonality, { display: string; body: string; mono: string }> = {
  corporate: { display: "Inter",              body: "Inter",           mono: "JetBrains Mono" },
  editorial: { display: "Playfair Display",   body: "Source Serif 4",  mono: "JetBrains Mono" },
  technical: { display: "Inter",              body: "Inter",           mono: "JetBrains Mono" },
  humanist:  { display: "Nunito Sans",        body: "Source Sans 3",   mono: "JetBrains Mono" },
  geometric: { display: "Outfit",             body: "DM Sans",         mono: "JetBrains Mono" },
  luxury:    { display: "Cormorant Garamond", body: "Cormorant",       mono: "JetBrains Mono" },
  playful:   { display: "Nunito",             body: "Nunito",          mono: "JetBrains Mono" },
};

const SCALE_RATIOS: Record<ScaleRatio, number> = {
  "minor-third":    1.200,
  "major-third":    1.250,
  "perfect-fourth": 1.333,
  "golden":         1.618,
};

export async function generateTypographySystem({ personality, baseSize, scaleRatio, format }: GenerateTypographyArgs): Promise<string> {
  const ratio = SCALE_RATIOS[scaleRatio];
  const fonts = FONT_PAIRINGS[personality];

  const steps = [
    { name: "xs",   exp: -2 },
    { name: "sm",   exp: -1 },
    { name: "base", exp:  0 },
    { name: "md",   exp:  1 },
    { name: "lg",   exp:  2 },
    { name: "xl",   exp:  3 },
    { name: "2xl",  exp:  4 },
    { name: "3xl",  exp:  5 },
    { name: "4xl",  exp:  6 },
  ];

  const sizeTokens: Record<string, string> = {};
  for (const { name, exp } of steps) {
    const px = Math.round(baseSize * Math.pow(ratio, exp) * 10) / 10;
    sizeTokens[`font-size-${name}`] = `${(px / 16).toFixed(3)}rem`;
  }

  const weightTokens: Record<string, string> = {
    "font-weight-light":    "300",
    "font-weight-regular":  "400",
    "font-weight-medium":   "500",
    "font-weight-semibold": "600",
    "font-weight-bold":     "700",
  };

  const lineHeightTokens: Record<string, string> = {
    "line-height-tight":   "1.25",
    "line-height-snug":    "1.375",
    "line-height-normal":  "1.5",
    "line-height-relaxed": "1.625",
    "line-height-loose":   "2",
  };

  const letterSpacingTokens: Record<string, string> = {
    "letter-spacing-tighter": "-0.05em",
    "letter-spacing-tight":   "-0.025em",
    "letter-spacing-normal":  "0em",
    "letter-spacing-wide":    "0.025em",
    "letter-spacing-wider":   "0.05em",
    "letter-spacing-widest":  "0.1em",
  };

  const fontFamilyTokens: Record<string, string> = {
    "font-family-display": `'${fonts.display}', system-ui, sans-serif`,
    "font-family-body":    `'${fonts.body}', system-ui, sans-serif`,
    "font-family-mono":    `'${fonts.mono}', 'Fira Code', monospace`,
  };

  const allTokens = { ...fontFamilyTokens, ...sizeTokens, ...weightTokens, ...lineHeightTokens, ...letterSpacingTokens };

  const uniqueFonts = [fonts.display, fonts.body, fonts.mono].filter((f, i, arr) => arr.indexOf(f) === i);
  const googleFontsUrl = `https://fonts.googleapis.com/css2?family=${uniqueFonts
    .map(f => f.replace(/ /g, "+") + ":wght@300;400;500;600;700")
    .join("&family=")}&display=swap`;

  const sections: string[] = [];
  sections.push(`### Google Fonts\n\n\`\`\`html\n<link href="${googleFontsUrl}" rel="stylesheet">\n\`\`\``);

  if (format === "css" || format === "all") {
    const css = ":root {\n" + Object.entries(allTokens).map(([k, v]) => `  --${k}: ${v};`).join("\n") + "\n}";
    sections.push("### CSS Variables\n\n```css\n" + css + "\n```");
  }

  if (format === "tailwind" || format === "all") {
    const sizeEntries = Object.entries(sizeTokens).map(([k, v]) => `      '${k.replace("font-size-", "")}': '${v}',`).join("\n");
    const weightEntries = Object.entries(weightTokens).map(([k, v]) => `      '${k.replace("font-weight-", "")}': '${v}',`).join("\n");
    const tailwind = [
      `// tailwind.config.js — theme.extend`,
      `fontSize: {\n${sizeEntries}\n},`,
      `fontWeight: {\n${weightEntries}\n},`,
      `fontFamily: {`,
      `      display: ["'${fonts.display}'", "system-ui", "sans-serif"],`,
      `      body: ["'${fonts.body}'", "system-ui", "sans-serif"],`,
      `      mono: ["'${fonts.mono}'", "'Fira Code'", "monospace"],`,
      `},`,
    ].join("\n");
    sections.push("### Tailwind Config\n\n```js\n" + tailwind + "\n```");
  }

  if (format === "json" || format === "all") {
    sections.push("### JSON\n\n```json\n" + JSON.stringify(allTokens, null, 2) + "\n```");
  }

  return sections.join("\n\n");
}

// ────────────────────────────────────────────────────────
// designTokens.ts
// ────────────────────────────────────────────────────────

interface GenerateDesignTokensArgs {
  brandColor: string;
  brandName: string;
  secondaryColor?: string;
  personality: "corporate" | "startup" | "creative" | "luxury" | "minimal" | "playful";
  includeMotion: boolean;
  format: "json" | "css" | "tailwind" | "all";
}

const PERSONALITY_MAP: Record<string, TypographyPersonality> = {
  corporate: "corporate",
  startup:   "geometric",
  creative:  "humanist",
  luxury:    "luxury",
  minimal:   "technical",
  playful:   "playful",
};

export async function generateDesignTokens({
  brandColor, brandName, secondaryColor, personality, includeMotion, format,
}: GenerateDesignTokensArgs): Promise<string> {
  const colorSection = await generateColorPalette({ input: brandColor, style: "professional", darkMode: true, format });
  const typoSection = await generateTypographySystem({ personality: PERSONALITY_MAP[personality], baseSize: 16, scaleRatio: "perfect-fourth", brandName, format });
  const spacingSection = await generateSpacingScale({ baseUnit: 4, steps: 16, naming: "numeric", format });
  const shadowSection = await generateShadowSystem({ mode: "both", style: "soft", brandColor, format });

  const motionTokens = includeMotion ? `
## Motion & Border Radius Tokens

\`\`\`css
:root {
  /* Duration */
  --duration-instant: 50ms;
  --duration-fast: 100ms;
  --duration-normal: 200ms;
  --duration-slow: 300ms;
  --duration-slower: 500ms;

  /* Easing */
  --easing-linear: linear;
  --easing-ease-in: cubic-bezier(0.4, 0, 1, 1);
  --easing-ease-out: cubic-bezier(0, 0, 0.2, 1);
  --easing-ease-in-out: cubic-bezier(0.4, 0, 0.2, 1);
  --easing-spring: cubic-bezier(0.175, 0.885, 0.32, 1.275);
  --easing-bounce: cubic-bezier(0.34, 1.56, 0.64, 1);

  /* Border Radius */
  --radius-none: 0px;
  --radius-sm: 0.125rem;
  --radius-md: 0.375rem;
  --radius-lg: 0.5rem;
  --radius-xl: 0.75rem;
  --radius-2xl: 1rem;
  --radius-3xl: 1.5rem;
  --radius-full: 9999px;
}
\`\`\`
` : "";

  return [
    `# ${brandName.toUpperCase()} Design Token System`,
    `Generated by DesignMCP | Base: \`${brandColor}\` | Personality: \`${personality}\``,
    "---",
    "## Color System",
    colorSection,
    "---",
    "## Typography System",
    typoSection,
    "---",
    "## Spacing System",
    spacingSection,
    "---",
    "## Shadow System",
    shadowSection,
    motionTokens,
  ].join("\n\n");
}

// ────────────────────────────────────────────────────────
// shadows.ts
// ────────────────────────────────────────────────────────

interface GenerateShadowSystemArgs {
  mode: "light" | "dark" | "both";
  style: "sharp" | "soft" | "diffuse" | "colored";
  brandColor?: string;
  format: "json" | "css" | "tailwind" | "all";
}

const SHADOW_SCALES = {
  light: {
    "shadow-xs":    "0 1px 2px 0 rgb(0 0 0 / 0.05)",
    "shadow-sm":    "0 1px 3px 0 rgb(0 0 0 / 0.10), 0 1px 2px -1px rgb(0 0 0 / 0.10)",
    "shadow-md":    "0 4px 6px -1px rgb(0 0 0 / 0.10), 0 2px 4px -2px rgb(0 0 0 / 0.10)",
    "shadow-lg":    "0 10px 15px -3px rgb(0 0 0 / 0.10), 0 4px 6px -4px rgb(0 0 0 / 0.10)",
    "shadow-xl":    "0 20px 25px -5px rgb(0 0 0 / 0.10), 0 8px 10px -6px rgb(0 0 0 / 0.10)",
    "shadow-2xl":   "0 25px 50px -12px rgb(0 0 0 / 0.25)",
    "shadow-inner": "inset 0 2px 4px 0 rgb(0 0 0 / 0.05)",
    "shadow-none":  "0 0 #0000",
  },
  dark: {
    "shadow-xs":    "0 1px 2px 0 rgb(0 0 0 / 0.40)",
    "shadow-sm":    "0 1px 3px 0 rgb(0 0 0 / 0.60), 0 1px 2px -1px rgb(0 0 0 / 0.60)",
    "shadow-md":    "0 4px 6px -1px rgb(0 0 0 / 0.60), 0 2px 4px -2px rgb(0 0 0 / 0.60)",
    "shadow-lg":    "0 10px 15px -3px rgb(0 0 0 / 0.60), 0 4px 6px -4px rgb(0 0 0 / 0.60)",
    "shadow-xl":    "0 20px 25px -5px rgb(0 0 0 / 0.60), 0 8px 10px -6px rgb(0 0 0 / 0.60)",
    "shadow-2xl":   "0 25px 50px -12px rgb(0 0 0 / 0.80)",
    "shadow-inner": "inset 0 2px 4px 0 rgb(0 0 0 / 0.40)",
    "shadow-none":  "0 0 #0000",
  },
};

export async function generateShadowSystem({ mode, style, brandColor, format }: GenerateShadowSystemArgs): Promise<string> {
  const sections: string[] = [];
  const lightShadows = SHADOW_SCALES.light;
  const darkShadows = SHADOW_SCALES.dark;

  if (format === "css" || format === "all") {
    let css = "";
    if (mode === "light" || mode === "both") {
      css += ":root {\n" + Object.entries(lightShadows).map(([k, v]) => `  --${k}: ${v};`).join("\n") + "\n}";
    }
    if (mode === "dark" || mode === "both") {
      css += "\n\n[data-theme='dark'], .dark {\n" + Object.entries(darkShadows).map(([k, v]) => `  --${k}: ${v};`).join("\n") + "\n}";
    }
    sections.push("### Shadow CSS\n\n```css\n" + css + "\n```");
  }

  if (format === "tailwind" || format === "all") {
    const entries = Object.entries(lightShadows)
      .map(([k, v]) => `      '${k.replace("shadow-", "")}': '${v}',`)
      .join("\n");
    sections.push("### Tailwind Config\n\n```js\n// theme.extend.boxShadow\n{\n" + entries + "\n}\n```");
  }

  if (format === "json" || format === "all") {
    sections.push("### JSON\n\n```json\n" + JSON.stringify({ light: lightShadows, dark: darkShadows }, null, 2) + "\n```");
  }

  return sections.join("\n\n");
}

// ────────────────────────────────────────────────────────
// spacing.ts
// ────────────────────────────────────────────────────────

interface GenerateSpacingArgs {
  baseUnit: number;
  steps: number;
  naming: "numeric" | "t-shirt" | "descriptive";
  format: "json" | "css" | "tailwind" | "all";
}

const T_SHIRT_NAMES = ["3xs", "2xs", "xs", "sm", "md", "lg", "xl", "2xl", "3xl", "4xl", "5xl", "6xl", "7xl", "8xl", "9xl", "10xl"];
const DESCRIPTIVE_NAMES = ["hairline", "micro", "tiny", "compact", "snug", "normal", "comfortable", "loose", "roomy", "spacious", "generous", "vast", "enormous", "massive", "huge", "colossal"];

export async function generateSpacingScale({ baseUnit, steps, naming, format }: GenerateSpacingArgs): Promise<string> {
  const tokens: Record<string, string> = {};

  for (let i = 0; i < steps; i++) {
    const px = baseUnit * (i + 1);
    const rem = (px / 16).toFixed(3) + "rem";
    let name: string;

    if (naming === "numeric") name = `space-${i + 1}`;
    else if (naming === "t-shirt") name = `space-${T_SHIRT_NAMES[i] ?? i}`;
    else name = `space-${DESCRIPTIVE_NAMES[i] ?? i}`;

    tokens[name] = rem;
  }

  const aliases: Record<string, string> = {
    "space-px":  "1px",
    "space-0":   "0px",
    "space-0-5": "0.125rem",
  };
  const allTokens = { ...aliases, ...tokens };

  const sections: string[] = [];
  if (format === "css" || format === "all") {
    const css = ":root {\n" + Object.entries(allTokens).map(([k, v]) => `  --${k}: ${v};`).join("\n") + "\n}";
    sections.push("### Spacing CSS\n\n```css\n" + css + "\n```");
  }
  if (format === "json" || format === "all") {
    sections.push("### Spacing JSON\n\n```json\n" + JSON.stringify(allTokens, null, 2) + "\n```");
  }
  if (format === "tailwind" || format === "all") {
    const entries = Object.entries(tokens).map(([k, v]) => `      '${k.replace("space-", "")}': '${v}',`).join("\n");
    sections.push("### Tailwind Spacing\n\n```js\n// theme.extend.spacing\n{\n" + entries + "\n}\n```");
  }

  return sections.join("\n\n");
}

// ────────────────────────────────────────────────────────
// componentTokens.ts
// ────────────────────────────────────────────────────────

interface GenerateComponentTokensArgs {
  components: string[];
  brandColor: string;
  format: "json" | "css" | "all";
}

export async function generateComponentTokens({ components, brandColor, format }: GenerateComponentTokensArgs): Promise<string> {
  const baseRgb = parseColor(brandColor);
  const scale = generateColorScale(baseRgb);

  const componentDefs: Record<string, Record<string, string>> = {
    button: {
      "btn-bg":           scale[600],
      "btn-bg-hover":     scale[700],
      "btn-bg-active":    scale[800],
      "btn-bg-disabled":  "#e2e8f0",
      "btn-text":         "#ffffff",
      "btn-text-disabled":"#94a3b8",
      "btn-border":       scale[600],
      "btn-border-hover": scale[700],
      "btn-radius":       "0.375rem",
      "btn-padding-x":    "1rem",
      "btn-padding-y":    "0.5rem",
      "btn-font-weight":  "600",
      "btn-transition":   "all 150ms cubic-bezier(0, 0, 0.2, 1)",
    },
    input: {
      "input-bg":                "#ffffff",
      "input-bg-focus":          "#ffffff",
      "input-bg-disabled":       "#f8fafc",
      "input-border":            "#e2e8f0",
      "input-border-hover":      "#cbd5e1",
      "input-border-focus":      scale[500],
      "input-border-error":      "#dc2626",
      "input-text":              "#0f172a",
      "input-text-placeholder":  "#94a3b8",
      "input-text-disabled":     "#94a3b8",
      "input-ring":              scale[200],
      "input-ring-error":        "#fecaca",
      "input-radius":            "0.375rem",
      "input-padding-x":         "0.75rem",
      "input-padding-y":         "0.5rem",
    },
    card: {
      "card-bg":           "#ffffff",
      "card-bg-hover":     "#f8fafc",
      "card-border":       "#e2e8f0",
      "card-shadow":       "0 1px 3px 0 rgb(0 0 0 / 0.10)",
      "card-shadow-hover": "0 4px 6px -1px rgb(0 0 0 / 0.10)",
      "card-radius":       "0.75rem",
      "card-padding":      "1.5rem",
    },
    badge: {
      "badge-bg-primary":     scale[100],
      "badge-text-primary":   scale[800],
      "badge-bg-success":     "#dcfce7",
      "badge-text-success":   "#166534",
      "badge-bg-warning":     "#fef9c3",
      "badge-text-warning":   "#854d0e",
      "badge-bg-error":       "#fee2e2",
      "badge-text-error":     "#991b1b",
      "badge-bg-neutral":     "#f1f5f9",
      "badge-text-neutral":   "#475569",
      "badge-radius":         "9999px",
      "badge-padding-x":      "0.625rem",
      "badge-padding-y":      "0.125rem",
      "badge-font-size":      "0.75rem",
      "badge-font-weight":    "500",
    },
    modal: {
      "modal-bg":      "#ffffff",
      "modal-overlay": "rgb(0 0 0 / 0.50)",
      "modal-border":  "#e2e8f0",
      "modal-shadow":  "0 25px 50px -12px rgb(0 0 0 / 0.25)",
      "modal-radius":  "0.75rem",
      "modal-padding": "1.5rem",
    },
    tooltip: {
      "tooltip-bg":        "#0f172a",
      "tooltip-text":      "#f8fafc",
      "tooltip-radius":    "0.25rem",
      "tooltip-padding-x": "0.625rem",
      "tooltip-padding-y": "0.25rem",
      "tooltip-font-size": "0.75rem",
    },
    navigation: {
      "nav-bg":                "#ffffff",
      "nav-border":            "#e2e8f0",
      "nav-item-text":         "#475569",
      "nav-item-text-hover":   "#0f172a",
      "nav-item-text-active":  scale[700],
      "nav-item-bg-hover":     "#f8fafc",
      "nav-item-bg-active":    scale[50],
      "nav-item-indicator":    scale[600],
    },
    table: {
      "table-header-bg":       "#f8fafc",
      "table-header-text":     "#475569",
      "table-row-bg":          "#ffffff",
      "table-row-bg-hover":    "#f8fafc",
      "table-row-bg-selected": scale[50],
      "table-border":          "#e2e8f0",
      "table-cell-padding-x":  "1rem",
      "table-cell-padding-y":  "0.75rem",
    },
    alert: {
      "alert-bg-info":        scale[50],
      "alert-border-info":    scale[200],
      "alert-text-info":      scale[800],
      "alert-bg-success":     "#f0fdf4",
      "alert-border-success": "#bbf7d0",
      "alert-text-success":   "#166534",
      "alert-bg-warning":     "#fffbeb",
      "alert-border-warning": "#fde68a",
      "alert-text-warning":   "#92400e",
      "alert-bg-error":       "#fef2f2",
      "alert-border-error":   "#fecaca",
      "alert-text-error":     "#991b1b",
      "alert-radius":         "0.5rem",
      "alert-padding":        "1rem",
    },
    avatar: {
      "avatar-bg":      scale[100],
      "avatar-text":    scale[700],
      "avatar-border":  "#ffffff",
      "avatar-size-sm": "2rem",
      "avatar-size-md": "2.5rem",
      "avatar-size-lg": "3rem",
      "avatar-size-xl": "4rem",
    },
    chip: {
      "chip-bg":              "#f1f5f9",
      "chip-bg-hover":        "#e2e8f0",
      "chip-bg-selected":     scale[100],
      "chip-text":            "#475569",
      "chip-text-selected":   scale[800],
      "chip-border":          "#e2e8f0",
      "chip-border-selected": scale[300],
      "chip-radius":          "9999px",
    },
    form: {
      "form-label-text":        "#374151",
      "form-label-font-weight": "500",
      "form-hint-text":         "#6b7280",
      "form-error-text":        "#dc2626",
      "form-required-color":    "#dc2626",
      "form-gap":               "1.5rem",
      "form-label-gap":         "0.375rem",
    },
  };

  const selectedTokens: Record<string, string> = {};
  for (const comp of components) {
    if (componentDefs[comp]) {
      Object.assign(selectedTokens, componentDefs[comp]);
    }
  }

  const sections: string[] = [];
  if (format === "css" || format === "all") {
    const css = ":root {\n" + Object.entries(selectedTokens).map(([k, v]) => `  --${k}: ${v};`).join("\n") + "\n}";
    sections.push("### Component CSS Variables\n\n```css\n" + css + "\n```");
  }
  if (format === "json" || format === "all") {
    sections.push("### Component JSON\n\n```json\n" + JSON.stringify(selectedTokens, null, 2) + "\n```");
  }

  return sections.join("\n\n");
}

// ────────────────────────────────────────────────────────
// accessibility.ts
// ────────────────────────────────────────────────────────

interface AccessibilityArgs {
  pairs: Array<{ foreground: string; background: string; label?: string }>;
  level: "AA" | "AAA";
  suggestFixes: boolean;
}

export async function checkAccessibility({ pairs, level, suggestFixes }: AccessibilityArgs): Promise<string> {
  const target = level === "AA" ? 4.5 : 7;
  const results: string[] = [];

  for (const pair of pairs) {
    const fg = hexToRgb(pair.foreground);
    const bg = hexToRgb(pair.background);
    const ratio = contrastRatio(fg, bg);
    const rounded = Math.round(ratio * 100) / 100;
    const pass = ratio >= target;
    const label = pair.label ?? `${pair.foreground} on ${pair.background}`;
    const icon = pass ? "✅" : "❌";

    let entry = `### ${icon} ${label}\n`;
    entry += `- Foreground: \`${pair.foreground}\`  Background: \`${pair.background}\`\n`;
    entry += `- Contrast ratio: **${rounded}:1** (requires ${target}:1 for WCAG ${level})\n`;
    entry += `- AA: ${ratio >= 4.5 ? "✅ Pass" : "❌ Fail"}  |  AAA: ${ratio >= 7 ? "✅ Pass" : "❌ Fail"}  |  AA Large Text: ${ratio >= 3 ? "✅ Pass" : "❌ Fail"}\n`;

    if (!pass && suggestFixes) {
      const fixed = makeAccessible(fg, bg, target);
      const fixedHex = rgbToHex(fixed);
      const fixedRatio = Math.round(contrastRatio(fixed, bg) * 100) / 100;
      entry += `\n**Suggested fix:** Change foreground to \`${fixedHex}\` → ratio becomes **${fixedRatio}:1** ✅\n`;
    }

    results.push(entry);
  }

  const passing = pairs.filter((pair) => {
    const fg = hexToRgb(pair.foreground);
    const bg = hexToRgb(pair.background);
    return contrastRatio(fg, bg) >= target;
  }).length;

  return [
    `## WCAG ${level} Accessibility Report`,
    `**${passing}/${pairs.length} pairs pass** WCAG ${level} (${target}:1 contrast ratio)`,
    "",
    ...results,
  ].join("\n");
}

// ────────────────────────────────────────────────────────
// exportTokens.ts
// ────────────────────────────────────────────────────────

interface ExportTokensArgs {
  tokens: Record<string, unknown>;
  targetFormat: string;
  prefix?: string;
}

export async function exportTokens({ tokens, targetFormat, prefix }: ExportTokensArgs): Promise<string> {
  const pre = prefix ? `${prefix}-` : "";
  const flat = flattenTokens(tokens);

  switch (targetFormat) {
    case "css": {
      const vars = Object.entries(flat).map(([k, v]) => `  --${pre}${k}: ${v};`).join("\n");
      return `## CSS Custom Properties\n\n\`\`\`css\n:root {\n${vars}\n}\n\`\`\``;
    }
    case "scss": {
      const vars = Object.entries(flat).map(([k, v]) => `$${pre}${k.replace(/-/g, "_")}: ${v};`).join("\n");
      return `## SCSS Variables\n\n\`\`\`scss\n${vars}\n\`\`\``;
    }
    case "tailwind-v3": {
      const entries = Object.entries(flat).map(([k, v]) => `  '${k}': '${v}',`).join("\n");
      return `## Tailwind v3 Config\n\n\`\`\`js\nmodule.exports = {\n  theme: {\n    extend: {\n      // paste under appropriate key\n${entries}\n    }\n  }\n}\n\`\`\``;
    }
    case "tailwind-v4": {
      const entries = Object.entries(flat).map(([k, v]) => `  --${pre}${k}: ${v};`).join("\n");
      return `## Tailwind v4 CSS Theme\n\n\`\`\`css\n@theme {\n${entries}\n}\n\`\`\``;
    }
    case "swift": {
      const entries = Object.entries(flat)
        .filter(([, v]) => typeof v === "string" && v.startsWith("#"))
        .map(([k, v]) => {
          const name = k.replace(/-([a-z])/g, (_: string, c: string) => c.toUpperCase());
          return `    static let ${name} = Color(hex: "${v}")`;
        }).join("\n");
      return `## Swift (SwiftUI)\n\n\`\`\`swift\nimport SwiftUI\n\nextension Color {\n  struct ${prefix ?? "Brand"} {\n${entries}\n  }\n}\n\`\`\``;
    }
    case "kotlin": {
      const entries = Object.entries(flat)
        .filter(([, v]) => typeof v === "string" && v.startsWith("#"))
        .map(([k, v]) => {
          const name = k.replace(/-([a-z])/g, (_: string, c: string) => c.toUpperCase());
          const hex = (v as string).replace("#", "0xFF");
          return `    val ${name} = Color(${hex})`;
        }).join("\n");
      return `## Kotlin (Compose)\n\n\`\`\`kotlin\nimport androidx.compose.ui.graphics.Color\n\nobject ${prefix ? prefix.charAt(0).toUpperCase() + prefix.slice(1) : "Brand"}Colors {\n${entries}\n}\n\`\`\``;
    }
    case "style-dictionary": {
      const sdTokens: Record<string, unknown> = {};
      for (const [k, v] of Object.entries(flat)) {
        sdTokens[k] = { value: v };
      }
      return `## Style Dictionary\n\n\`\`\`json\n${JSON.stringify(sdTokens, null, 2)}\n\`\`\``;
    }
    case "json-flat":
    default:
      return `## Flat JSON\n\n\`\`\`json\n${JSON.stringify(flat, null, 2)}\n\`\`\``;
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

// ────────────────────────────────────────────────────────
// brandAnalyzer.ts
// ────────────────────────────────────────────────────────

interface BrandAnalyzerArgs {
  url: string;
  outputFormat: "tokens" | "analysis" | "both";
}

export async function analyzeBrandURL({ url, outputFormat }: BrandAnalyzerArgs): Promise<string> {
  const domain = new URL(url).hostname.replace("www.", "");

  return `## Brand Analysis: ${domain}

> **Note:** Live URL analysis requires the server to run with browser access enabled.
> Deploy with the \`--browser\` flag or use the hosted version at designmcp.dev

### What This Tool Does

When deployed with browser access, \`analyze_brand_url\` will:

1. **Capture computed CSS** — Extract all CSS custom properties, color values, and font stacks from the live page
2. **Build color clusters** — Group similar colors and identify the primary/secondary/neutral palette
3. **Detect typography** — Identify font families, sizes, weights, and the apparent scale ratio
4. **Reverse-engineer spacing** — Detect the underlying grid unit from padding/margin patterns
5. **Generate token output** — Produce ready-to-use CSS variables and Tailwind config

### Workaround: Manual Analysis

For now, you can use \`generate_design_tokens\` with colors you observe from ${url}:

\`\`\`
// Example workflow:
1. Open ${url} in browser DevTools
2. Run in console: getComputedStyle(document.documentElement)
3. Note primary colors, font families
4. Pass to: generate_color_palette({ input: "#your-brand-color" })
\`\`\`
`;
}

// ────────────────────────────────────────────────────────
// themeGenerator.ts
// ────────────────────────────────────────────────────────

interface GenerateThemeArgs {
  description: string;
  format: "json" | "css" | "tailwind" | "all";
  includeComponentTokens: boolean;
}

type ThemePersonality = "corporate" | "startup" | "creative" | "luxury" | "minimal" | "playful";

function inferPersonality(description: string): { color: string; personality: ThemePersonality; style: string } {
  const d = description.toLowerCase();

  if (d.match(/fintech|bank|finance|invest|enterprise|saas|b2b/))
    return { color: "#0ea5e9", personality: "corporate", style: "professional" };
  if (d.match(/gen z|youth|fun|energy|bold|vibrant|gaming/))
    return { color: "#8b5cf6", personality: "playful", style: "bold" };
  if (d.match(/luxury|premium|high.end|exclusive|elegant|couture/))
    return { color: "#b8860b", personality: "luxury", style: "luxury" };
  if (d.match(/eco|green|sustainability|nature|organic|plant/))
    return { color: "#16a34a", personality: "creative", style: "earthy" };
  if (d.match(/dev|developer|tech|code|open.source|terminal|dark/))
    return { color: "#6366f1", personality: "minimal", style: "minimal" };
  if (d.match(/health|wellness|calm|mindful|meditation|spa/))
    return { color: "#0d9488", personality: "minimal", style: "minimal" };
  if (d.match(/media|editorial|magazine|news|blog|publish/))
    return { color: "#dc2626", personality: "creative", style: "bold" };
  if (d.match(/creative|studio|agency|design|art|portfolio/))
    return { color: "#f59e0b", personality: "creative", style: "bold" };

  return { color: "#4f46e5", personality: "startup", style: "professional" };
}

export async function generateTheme({ description, format, includeComponentTokens }: GenerateThemeArgs): Promise<string> {
  const { color, personality, style } = inferPersonality(description);

  const header = `# Generated Theme
**Prompt:** "${description}"
**Inferred personality:** \`${personality}\` | **Base color:** \`${color}\`

---
`;

  const tokenSystem = await generateDesignTokens({
    brandColor: color,
    brandName: description.split(" ").slice(0, 2).join("-").toLowerCase().replace(/[^a-z-]/g, ""),
    personality,
    includeMotion: true,
    format,
  });

  let componentSection = "";
  if (includeComponentTokens) {
    componentSection = "\n\n---\n\n## Component Tokens\n\n" + await generateComponentTokens({
      components: ["button", "input", "card", "badge"],
      brandColor: color,
      format: format === "tailwind" ? "css" : (format as "json" | "css" | "all"),
    });
  }

  return header + tokenSystem + componentSection;
}
