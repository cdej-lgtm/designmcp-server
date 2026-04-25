import {
  parseColor, generateColorScale, generateDarkScale, generateSemanticTokens,
  rgbToHex, hexToRgb, contrastRatio, makeAccessible,
  tokensToCSS, colorScaleToTailwind, rgbToOklch, oklchToRgb,
  generateComplementary,
} from "../lib/colors.js";
import {
  analyzeThemeWithAI,
  generateBrandIdentityWithAI,
  explainPaletteWithAI,
} from "../lib/ai.js";

// ─── Types ────────────────────────────────────────────────────────────────────

type Format    = "json" | "css" | "tailwind" | "all";
type TypoPersonality = "corporate" | "editorial" | "technical" | "humanist" | "geometric" | "luxury" | "playful";
type ScaleRatio = "minor-third" | "major-third" | "perfect-fourth" | "golden";
type ThemePersonality = "corporate" | "startup" | "creative" | "luxury" | "minimal" | "playful";

// ────────────────────────────────────────────────────────
// colorPalette — OKLCH-powered 11-step palette
// ────────────────────────────────────────────────────────

interface GenerateColorPaletteArgs {
  input: string;
  style: "professional" | "playful" | "minimal" | "bold" | "earthy" | "luxury";
  darkMode: boolean;
  format: Format;
}

export async function generateColorPalette({ input, darkMode, format }: GenerateColorPaletteArgs): Promise<string> {
  const baseRgb    = parseColor(input);
  const lightScale = generateColorScale(baseRgb);
  const darkScale  = generateDarkScale(lightScale);
  const lightTokens = generateSemanticTokens(lightScale, "light");
  const darkTokens  = generateSemanticTokens(darkScale, "dark");

  const sections: string[] = [];

  if (format === "css" || format === "all") {
    const primitives = Object.entries(lightScale)
      .map(([k, v]) => `  --color-scale-${k}: ${v};`).join("\n");
    let css = `:root {\n${primitives}\n}\n\n`;
    css += tokensToCSS(lightTokens as unknown as Record<string, string>);
    if (darkMode) {
      const darkPrimitives = Object.entries(darkScale)
        .map(([k, v]) => `  --color-scale-${k}: ${v};`).join("\n");
      css += `\n\n[data-theme='dark'], .dark {\n${darkPrimitives}\n}\n\n`;
      css += tokensToCSS(darkTokens as unknown as Record<string, string>, "", "[data-theme='dark'], .dark");
    }
    sections.push("### CSS Variables\n\n```css\n" + css + "\n```");
  }

  if (format === "tailwind" || format === "all") {
    sections.push(
      "### Tailwind Config\n\n```js\n// tailwind.config.js — theme.extend.colors\n{\n" +
      colorScaleToTailwind(lightScale, "primary") + "\n}\n```"
    );
  }

  if (format === "json" || format === "all") {
    sections.push(
      "### JSON\n\n```json\n" +
      JSON.stringify({ primitive: lightScale, semantic: { light: lightTokens, ...(darkMode ? { dark: darkTokens } : {}) } }, null, 2) +
      "\n```"
    );
  }

  return sections.join("\n\n");
}

// ────────────────────────────────────────────────────────
// typography — modular scale + Google Fonts per personality
// ────────────────────────────────────────────────────────

interface GenerateTypographyArgs {
  personality: TypoPersonality;
  baseSize: number;
  scaleRatio: ScaleRatio;
  brandName: string;
  format: Format;
}

const FONT_PAIRINGS: Record<TypoPersonality, { display: string; body: string; mono: string }> = {
  corporate: { display: "Inter",              body: "Inter",          mono: "JetBrains Mono" },
  editorial: { display: "Playfair Display",   body: "Source Serif 4", mono: "JetBrains Mono" },
  technical: { display: "Inter",              body: "Inter",          mono: "JetBrains Mono" },
  humanist:  { display: "Nunito Sans",        body: "Source Sans 3",  mono: "JetBrains Mono" },
  geometric: { display: "Outfit",             body: "DM Sans",        mono: "JetBrains Mono" },
  luxury:    { display: "Cormorant Garamond", body: "Cormorant",      mono: "JetBrains Mono" },
  playful:   { display: "Nunito",             body: "Nunito",         mono: "JetBrains Mono" },
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
    { name: "xs", exp: -2 }, { name: "sm", exp: -1 }, { name: "base", exp: 0 },
    { name: "md", exp: 1 },  { name: "lg", exp: 2 },  { name: "xl", exp: 3 },
    { name: "2xl", exp: 4 }, { name: "3xl", exp: 5 }, { name: "4xl", exp: 6 },
  ];

  const sizeTokens: Record<string, string> = {};
  for (const { name, exp } of steps) {
    const px = Math.round(baseSize * Math.pow(ratio, exp) * 10) / 10;
    sizeTokens[`font-size-${name}`] = `${(px / 16).toFixed(3)}rem`;
  }

  const weightTokens: Record<string, string> = {
    "font-weight-light": "300", "font-weight-regular": "400",
    "font-weight-medium": "500", "font-weight-semibold": "600", "font-weight-bold": "700",
  };

  const lineHeightTokens: Record<string, string> = {
    "line-height-tight": "1.25",   "line-height-snug": "1.375",
    "line-height-normal": "1.5",   "line-height-relaxed": "1.625",
    "line-height-loose": "2",
  };

  const letterSpacingTokens: Record<string, string> = {
    "letter-spacing-tighter": "-0.05em", "letter-spacing-tight": "-0.025em",
    "letter-spacing-normal": "0em",      "letter-spacing-wide": "0.025em",
    "letter-spacing-wider": "0.05em",    "letter-spacing-widest": "0.1em",
  };

  const fontFamilyTokens: Record<string, string> = {
    "font-family-display": `'${fonts.display}', system-ui, sans-serif`,
    "font-family-body":    `'${fonts.body}', system-ui, sans-serif`,
    "font-family-mono":    `'${fonts.mono}', 'Fira Code', monospace`,
  };

  const allTokens = { ...fontFamilyTokens, ...sizeTokens, ...weightTokens, ...lineHeightTokens, ...letterSpacingTokens };

  const uniqueFonts = [fonts.display, fonts.body, fonts.mono].filter((f, i, a) => a.indexOf(f) === i);
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
    const sizeEntries   = Object.entries(sizeTokens).map(([k, v]) => `      '${k.replace("font-size-", "")}': '${v}',`).join("\n");
    const weightEntries = Object.entries(weightTokens).map(([k, v]) => `      '${k.replace("font-weight-", "")}': '${v}',`).join("\n");
    sections.push(
      "### Tailwind Config\n\n```js\n" +
      `fontSize: {\n${sizeEntries}\n},\nfontWeight: {\n${weightEntries}\n},\n` +
      `fontFamily: {\n      display: ["'${fonts.display}'", "system-ui", "sans-serif"],\n` +
      `      body: ["'${fonts.body}'", "system-ui", "sans-serif"],\n` +
      `      mono: ["'${fonts.mono}'", "'Fira Code'", "monospace"],\n},\n` +
      "```"
    );
  }

  if (format === "json" || format === "all") {
    sections.push("### JSON\n\n```json\n" + JSON.stringify(allTokens, null, 2) + "\n```");
  }

  return sections.join("\n\n");
}

// ────────────────────────────────────────────────────────
// designTokens — full system combining all subsystems
// ────────────────────────────────────────────────────────

interface GenerateDesignTokensArgs {
  brandColor: string;
  brandName: string;
  secondaryColor?: string;
  personality: ThemePersonality;
  includeMotion: boolean;
  format: Format;
}

const PERSONALITY_TO_TYPO: Record<ThemePersonality, TypoPersonality> = {
  corporate: "corporate", startup: "geometric",  creative: "humanist",
  luxury:    "luxury",    minimal: "technical",  playful:  "playful",
};

export async function generateDesignTokens({
  brandColor, brandName, secondaryColor, personality, includeMotion, format,
}: GenerateDesignTokensArgs): Promise<string> {
  const colorSection = await generateColorPalette({ input: brandColor, style: "professional", darkMode: true, format });

  // Secondary color — use explicit or auto-generate complementary
  let secondarySection = "";
  const secColor = secondaryColor ?? rgbToHex(generateComplementary(parseColor(brandColor), "split-complement"));
  const secScale = generateColorScale(parseColor(secColor));
  if (format === "css" || format === "all") {
    const secEntries = Object.entries(secScale).map(([k, v]) => `  --color-secondary-${k}: ${v};`).join("\n");
    secondarySection = "\n\n### Secondary Color Scale\n\n```css\n:root {\n" + secEntries + "\n}\n```";
  }

  const typoSection   = await generateTypographySystem({ personality: PERSONALITY_TO_TYPO[personality], baseSize: 16, scaleRatio: "perfect-fourth", brandName, format });
  const spacingSection = await generateSpacingScale({ baseUnit: 4, steps: 16, naming: "numeric", format });
  const shadowSection  = await generateShadowSystem({ mode: "both", style: "soft", brandColor, format });

  const motionBlock = includeMotion ? `
## Motion & Border Radius Tokens

\`\`\`css
:root {
  /* Duration */
  --duration-instant:  50ms;
  --duration-fast:    100ms;
  --duration-normal:  200ms;
  --duration-slow:    300ms;
  --duration-slower:  500ms;

  /* Easing */
  --easing-linear:      linear;
  --easing-ease-in:     cubic-bezier(0.4, 0, 1, 1);
  --easing-ease-out:    cubic-bezier(0, 0, 0.2, 1);
  --easing-ease-in-out: cubic-bezier(0.4, 0, 0.2, 1);
  --easing-spring:      cubic-bezier(0.175, 0.885, 0.32, 1.275);
  --easing-bounce:      cubic-bezier(0.34, 1.56, 0.64, 1);
}
\`\`\`

\`\`\`css
:root {
  /* Border Radius */
  --radius-none: 0px;
  --radius-sm:   0.125rem;
  --radius-md:   0.375rem;
  --radius-lg:   0.5rem;
  --radius-xl:   0.75rem;
  --radius-2xl:  1rem;
  --radius-3xl:  1.5rem;
  --radius-full: 9999px;
}
\`\`\`
` : "";

  return [
    `# ${brandName.toUpperCase()} Design Token System`,
    `Generated by DesignMCP | Primary: \`${brandColor}\` | Secondary: \`${secColor}\` | Personality: \`${personality}\``,
    "---",
    "## Color System",
    colorSection + secondarySection,
    "---",
    "## Typography System",
    typoSection,
    "---",
    "## Spacing System",
    spacingSection,
    "---",
    "## Shadow System",
    shadowSection,
    motionBlock,
  ].join("\n\n");
}

// ────────────────────────────────────────────────────────
// shadows — per-style shadow scales (fixed)
// ────────────────────────────────────────────────────────

interface GenerateShadowSystemArgs {
  mode: "light" | "dark" | "both";
  style: "sharp" | "soft" | "diffuse" | "colored";
  brandColor?: string;
  format: Format;
}

function buildShadowScale(style: string, brandColor?: string) {
  const brand = brandColor ? hexToRgb(brandColor) : null;
  const bc = brand
    ? `rgb(${brand.r} ${brand.g} ${brand.b}`
    : "rgb(0 0 0";

  const scales: Record<string, Record<string, string>> = {
    soft: {
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
    },
    sharp: {
      light: {
        "shadow-xs":    "0 1px 0 0 rgb(0 0 0 / 0.08)",
        "shadow-sm":    "0 2px 0 0 rgb(0 0 0 / 0.10)",
        "shadow-md":    "0 3px 0 0 rgb(0 0 0 / 0.12)",
        "shadow-lg":    "0 5px 0 0 rgb(0 0 0 / 0.12)",
        "shadow-xl":    "0 8px 0 0 rgb(0 0 0 / 0.14)",
        "shadow-2xl":   "0 12px 0 0 rgb(0 0 0 / 0.18)",
        "shadow-inner": "inset 0 2px 0 0 rgb(0 0 0 / 0.06)",
        "shadow-none":  "0 0 #0000",
      },
      dark: {
        "shadow-xs":    "0 1px 0 0 rgb(0 0 0 / 0.40)",
        "shadow-sm":    "0 2px 0 0 rgb(0 0 0 / 0.50)",
        "shadow-md":    "0 3px 0 0 rgb(0 0 0 / 0.60)",
        "shadow-lg":    "0 5px 0 0 rgb(0 0 0 / 0.60)",
        "shadow-xl":    "0 8px 0 0 rgb(0 0 0 / 0.70)",
        "shadow-2xl":   "0 12px 0 0 rgb(0 0 0 / 0.80)",
        "shadow-inner": "inset 0 2px 0 0 rgb(0 0 0 / 0.40)",
        "shadow-none":  "0 0 #0000",
      },
    },
    diffuse: {
      light: {
        "shadow-xs":    "0 2px 8px 2px rgb(0 0 0 / 0.04)",
        "shadow-sm":    "0 4px 16px 4px rgb(0 0 0 / 0.06)",
        "shadow-md":    "0 8px 24px 6px rgb(0 0 0 / 0.08)",
        "shadow-lg":    "0 12px 40px 8px rgb(0 0 0 / 0.09)",
        "shadow-xl":    "0 20px 56px 12px rgb(0 0 0 / 0.10)",
        "shadow-2xl":   "0 32px 80px 16px rgb(0 0 0 / 0.14)",
        "shadow-inner": "inset 0 2px 12px 2px rgb(0 0 0 / 0.04)",
        "shadow-none":  "0 0 #0000",
      },
      dark: {
        "shadow-xs":    "0 2px 8px 2px rgb(0 0 0 / 0.30)",
        "shadow-sm":    "0 4px 16px 4px rgb(0 0 0 / 0.40)",
        "shadow-md":    "0 8px 24px 6px rgb(0 0 0 / 0.50)",
        "shadow-lg":    "0 12px 40px 8px rgb(0 0 0 / 0.55)",
        "shadow-xl":    "0 20px 56px 12px rgb(0 0 0 / 0.60)",
        "shadow-2xl":   "0 32px 80px 16px rgb(0 0 0 / 0.70)",
        "shadow-inner": "inset 0 2px 12px 2px rgb(0 0 0 / 0.30)",
        "shadow-none":  "0 0 #0000",
      },
    },
    colored: {
      light: {
        "shadow-xs":    `0 1px 3px 0 ${bc} / 0.12)`,
        "shadow-sm":    `0 2px 6px 0 ${bc} / 0.16)`,
        "shadow-md":    `0 4px 12px -1px ${bc} / 0.20)`,
        "shadow-lg":    `0 8px 20px -2px ${bc} / 0.22)`,
        "shadow-xl":    `0 16px 32px -4px ${bc} / 0.24)`,
        "shadow-2xl":   `0 24px 48px -8px ${bc} / 0.30)`,
        "shadow-inner": `inset 0 2px 6px 0 ${bc} / 0.10)`,
        "shadow-none":  "0 0 #0000",
      },
      dark: {
        "shadow-xs":    `0 1px 3px 0 ${bc} / 0.25)`,
        "shadow-sm":    `0 2px 6px 0 ${bc} / 0.35)`,
        "shadow-md":    `0 4px 12px -1px ${bc} / 0.40)`,
        "shadow-lg":    `0 8px 20px -2px ${bc} / 0.45)`,
        "shadow-xl":    `0 16px 32px -4px ${bc} / 0.50)`,
        "shadow-2xl":   `0 24px 48px -8px ${bc} / 0.60)`,
        "shadow-inner": `inset 0 2px 6px 0 ${bc} / 0.25)`,
        "shadow-none":  "0 0 #0000",
      },
    },
  };

  return scales[style] ?? scales.soft;
}

export async function generateShadowSystem({ mode, style, brandColor, format }: GenerateShadowSystemArgs): Promise<string> {
  const scale = buildShadowScale(style, brandColor);
  const light = scale.light;
  const dark  = scale.dark;
  const sections: string[] = [];

  if (format === "css" || format === "all") {
    let css = "";
    if (mode === "light" || mode === "both")
      css += ":root {\n" + Object.entries(light).map(([k, v]) => `  --${k}: ${v};`).join("\n") + "\n}";
    if (mode === "dark" || mode === "both")
      css += "\n\n[data-theme='dark'], .dark {\n" + Object.entries(dark).map(([k, v]) => `  --${k}: ${v};`).join("\n") + "\n}";
    sections.push("### Shadow CSS\n\n```css\n" + css + "\n```");
  }

  if (format === "tailwind" || format === "all") {
    const entries = Object.entries(light).map(([k, v]) => `      '${k.replace("shadow-", "")}': '${v}',`).join("\n");
    sections.push("### Tailwind Config\n\n```js\n// theme.extend.boxShadow\n{\n" + entries + "\n}\n```");
  }

  if (format === "json" || format === "all") {
    sections.push("### JSON\n\n```json\n" + JSON.stringify({ style, light, dark }, null, 2) + "\n```");
  }

  return sections.join("\n\n");
}

// ────────────────────────────────────────────────────────
// spacing — Tailwind-grade modular scale
// ────────────────────────────────────────────────────────

interface GenerateSpacingArgs {
  baseUnit: number;
  steps: number;
  naming: "numeric" | "t-shirt" | "descriptive";
  format: Format;
}

// Proper design-system spacing: small steps at small sizes, bigger jumps at large sizes
const TAILWIND_SPACING: Array<{ step: string; px: number }> = [
  { step: "px",  px: 1  }, { step: "0.5", px: 2  }, { step: "1",  px: 4  },
  { step: "1.5", px: 6  }, { step: "2",   px: 8  }, { step: "2.5",px: 10 },
  { step: "3",   px: 12 }, { step: "3.5", px: 14 }, { step: "4",  px: 16 },
  { step: "5",   px: 20 }, { step: "6",   px: 24 }, { step: "7",  px: 28 },
  { step: "8",   px: 32 }, { step: "9",   px: 36 }, { step: "10", px: 40 },
  { step: "11",  px: 44 }, { step: "12",  px: 48 }, { step: "14", px: 56 },
  { step: "16",  px: 64 }, { step: "20",  px: 80 }, { step: "24", px: 96 },
  { step: "28",  px: 112}, { step: "32",  px: 128}, { step: "36", px: 144},
  { step: "40",  px: 160}, { step: "44",  px: 176}, { step: "48", px: 192},
  { step: "52",  px: 208}, { step: "56",  px: 224}, { step: "60", px: 240},
  { step: "64",  px: 256}, { step: "72",  px: 288}, { step: "80", px: 320},
  { step: "96",  px: 384},
];

const T_SHIRT_NAMES   = ["3xs","2xs","xs","sm","md","lg","xl","2xl","3xl","4xl","5xl","6xl","7xl","8xl","9xl","10xl"];
const DESCRIPTIVE_NAMES = ["hairline","micro","tiny","compact","snug","normal","comfortable","loose","roomy","spacious","generous","vast","enormous","massive","huge","colossal"];

export async function generateSpacingScale({ baseUnit, steps, naming, format }: GenerateSpacingArgs): Promise<string> {
  const tokens: Record<string, string> = {};

  if (naming === "numeric" && baseUnit === 4) {
    // Use Tailwind-grade scale for the default case
    const slice = TAILWIND_SPACING.slice(0, Math.min(steps, TAILWIND_SPACING.length));
    for (const { step, px } of slice) {
      tokens[`space-${step}`] = `${(px / 16).toFixed(3)}rem`;
    }
  } else {
    for (let i = 0; i < steps; i++) {
      const px = baseUnit * (i + 1);
      const rem = (px / 16).toFixed(3) + "rem";
      let name: string;
      if (naming === "numeric")      name = `space-${i + 1}`;
      else if (naming === "t-shirt") name = `space-${T_SHIRT_NAMES[i] ?? i}`;
      else                           name = `space-${DESCRIPTIVE_NAMES[i] ?? i}`;
      tokens[name] = rem;
    }
  }

  const sections: string[] = [];

  if (format === "css" || format === "all") {
    const css = ":root {\n" + Object.entries(tokens).map(([k, v]) => `  --${k}: ${v};`).join("\n") + "\n}";
    sections.push("### Spacing CSS\n\n```css\n" + css + "\n```");
  }
  if (format === "json" || format === "all") {
    sections.push("### Spacing JSON\n\n```json\n" + JSON.stringify(tokens, null, 2) + "\n```");
  }
  if (format === "tailwind" || format === "all") {
    const entries = Object.entries(tokens).map(([k, v]) => `      '${k.replace("space-", "")}': '${v}',`).join("\n");
    sections.push("### Tailwind Spacing\n\n```js\n// theme.extend.spacing\n{\n" + entries + "\n}\n```");
  }

  return sections.join("\n\n");
}

// ────────────────────────────────────────────────────────
// componentTokens
// ────────────────────────────────────────────────────────

interface GenerateComponentTokensArgs {
  components: string[];
  brandColor: string;
  format: "json" | "css" | "all";
}

export async function generateComponentTokens({ components, brandColor, format }: GenerateComponentTokensArgs): Promise<string> {
  const scale = generateColorScale(parseColor(brandColor));

  const componentDefs: Record<string, Record<string, string>> = {
    button: {
      "btn-bg": scale[600],       "btn-bg-hover": scale[700],
      "btn-bg-active": scale[800],"btn-bg-disabled": "#e2e8f0",
      "btn-text": "#ffffff",      "btn-text-disabled": "#94a3b8",
      "btn-border": scale[600],   "btn-border-hover": scale[700],
      "btn-radius": "0.375rem",   "btn-padding-x": "1rem",
      "btn-padding-y": "0.5rem",  "btn-font-weight": "600",
      "btn-transition": "all 150ms cubic-bezier(0, 0, 0.2, 1)",
    },
    input: {
      "input-bg": "#ffffff",              "input-bg-focus": "#ffffff",
      "input-bg-disabled": "#f8fafc",     "input-border": "#e2e8f0",
      "input-border-hover": "#cbd5e1",    "input-border-focus": scale[500],
      "input-border-error": "#dc2626",    "input-text": "#0f172a",
      "input-text-placeholder": "#94a3b8","input-text-disabled": "#94a3b8",
      "input-ring": scale[200],           "input-ring-error": "#fecaca",
      "input-radius": "0.375rem",         "input-padding-x": "0.75rem",
      "input-padding-y": "0.5rem",
    },
    card: {
      "card-bg": "#ffffff",        "card-bg-hover": "#f8fafc",
      "card-border": "#e2e8f0",    "card-shadow": "0 1px 3px 0 rgb(0 0 0 / 0.10)",
      "card-shadow-hover": "0 4px 6px -1px rgb(0 0 0 / 0.10)",
      "card-radius": "0.75rem",    "card-padding": "1.5rem",
    },
    badge: {
      "badge-bg-primary": scale[100],   "badge-text-primary": scale[800],
      "badge-bg-success": "#dcfce7",    "badge-text-success": "#166534",
      "badge-bg-warning": "#fef9c3",    "badge-text-warning": "#854d0e",
      "badge-bg-error": "#fee2e2",      "badge-text-error": "#991b1b",
      "badge-bg-neutral": "#f1f5f9",    "badge-text-neutral": "#475569",
      "badge-radius": "9999px",         "badge-padding-x": "0.625rem",
      "badge-padding-y": "0.125rem",    "badge-font-size": "0.75rem",
      "badge-font-weight": "500",
    },
    modal: {
      "modal-bg": "#ffffff",        "modal-overlay": "rgb(0 0 0 / 0.50)",
      "modal-border": "#e2e8f0",    "modal-shadow": "0 25px 50px -12px rgb(0 0 0 / 0.25)",
      "modal-radius": "0.75rem",    "modal-padding": "1.5rem",
    },
    tooltip: {
      "tooltip-bg": "#0f172a",      "tooltip-text": "#f8fafc",
      "tooltip-radius": "0.25rem",  "tooltip-padding-x": "0.625rem",
      "tooltip-padding-y": "0.25rem","tooltip-font-size": "0.75rem",
    },
    navigation: {
      "nav-bg": "#ffffff",              "nav-border": "#e2e8f0",
      "nav-item-text": "#475569",       "nav-item-text-hover": "#0f172a",
      "nav-item-text-active": scale[700],"nav-item-bg-hover": "#f8fafc",
      "nav-item-bg-active": scale[50],  "nav-item-indicator": scale[600],
    },
    table: {
      "table-header-bg": "#f8fafc",         "table-header-text": "#475569",
      "table-row-bg": "#ffffff",            "table-row-bg-hover": "#f8fafc",
      "table-row-bg-selected": scale[50],   "table-border": "#e2e8f0",
      "table-cell-padding-x": "1rem",       "table-cell-padding-y": "0.75rem",
    },
    alert: {
      "alert-bg-info": scale[50],         "alert-border-info": scale[200],
      "alert-text-info": scale[800],      "alert-bg-success": "#f0fdf4",
      "alert-border-success": "#bbf7d0",  "alert-text-success": "#166534",
      "alert-bg-warning": "#fffbeb",      "alert-border-warning": "#fde68a",
      "alert-text-warning": "#92400e",    "alert-bg-error": "#fef2f2",
      "alert-border-error": "#fecaca",    "alert-text-error": "#991b1b",
      "alert-radius": "0.5rem",           "alert-padding": "1rem",
    },
    avatar: {
      "avatar-bg": scale[100],    "avatar-text": scale[700],
      "avatar-border": "#ffffff", "avatar-size-sm": "2rem",
      "avatar-size-md": "2.5rem","avatar-size-lg": "3rem",
      "avatar-size-xl": "4rem",
    },
    chip: {
      "chip-bg": "#f1f5f9",           "chip-bg-hover": "#e2e8f0",
      "chip-bg-selected": scale[100], "chip-text": "#475569",
      "chip-text-selected": scale[800],"chip-border": "#e2e8f0",
      "chip-border-selected": scale[300],"chip-radius": "9999px",
    },
    form: {
      "form-label-text": "#374151",     "form-label-font-weight": "500",
      "form-hint-text": "#6b7280",      "form-error-text": "#dc2626",
      "form-required-color": "#dc2626", "form-gap": "1.5rem",
      "form-label-gap": "0.375rem",
    },
  };

  const selected: Record<string, string> = {};
  for (const comp of components) {
    if (componentDefs[comp]) Object.assign(selected, componentDefs[comp]);
  }

  const sections: string[] = [];
  if (format === "css" || format === "all") {
    const css = ":root {\n" + Object.entries(selected).map(([k, v]) => `  --${k}: ${v};`).join("\n") + "\n}";
    sections.push("### Component CSS Variables\n\n```css\n" + css + "\n```");
  }
  if (format === "json" || format === "all") {
    sections.push("### Component JSON\n\n```json\n" + JSON.stringify(selected, null, 2) + "\n```");
  }
  return sections.join("\n\n");
}

// ────────────────────────────────────────────────────────
// accessibility — WCAG contrast checker
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
    const pass  = ratio >= target;
    const label = pair.label ?? `${pair.foreground} on ${pair.background}`;

    let entry = `### ${pass ? "✅" : "❌"} ${label}\n`;
    entry += `- Contrast ratio: **${rounded}:1** (target: ${target}:1 for WCAG ${level})\n`;
    entry += `- AA: ${ratio >= 4.5 ? "✅ Pass" : "❌ Fail"}  |  AAA: ${ratio >= 7 ? "✅ Pass" : "❌ Fail"}  |  AA Large Text: ${ratio >= 3 ? "✅ Pass" : "❌ Fail"}\n`;

    if (!pass && suggestFixes) {
      const fixed    = makeAccessible(fg, bg, target);
      const fixedHex = rgbToHex(fixed);
      const fixedRatio = Math.round(contrastRatio(fixed, bg) * 100) / 100;
      entry += `\n**Fix:** Use \`${fixedHex}\` as foreground → **${fixedRatio}:1** ✅\n`;
    }
    results.push(entry);
  }

  const passing = pairs.filter(pair =>
    contrastRatio(hexToRgb(pair.foreground), hexToRgb(pair.background)) >= target
  ).length;

  return [
    `## WCAG ${level} Accessibility Report`,
    `**${passing}/${pairs.length} pairs pass** WCAG ${level} (${target}:1)`,
    "",
    ...results,
  ].join("\n");
}

// ────────────────────────────────────────────────────────
// exportTokens — multi-platform token converter
// ────────────────────────────────────────────────────────

interface ExportTokensArgs {
  tokens: Record<string, unknown>;
  targetFormat: string;
  prefix?: string;
}

export async function exportTokens({ tokens, targetFormat, prefix }: ExportTokensArgs): Promise<string> {
  const pre  = prefix ? `${prefix}-` : "";
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
      return `## Tailwind v3 Config\n\n\`\`\`js\nmodule.exports = {\n  theme: { extend: {\n${entries}\n  } }\n}\n\`\`\``;
    }
    case "tailwind-v4": {
      const entries = Object.entries(flat).map(([k, v]) => `  --${pre}${k}: ${v};`).join("\n");
      return `## Tailwind v4 CSS Theme\n\n\`\`\`css\n@theme {\n${entries}\n}\n\`\`\``;
    }
    case "swift": {
      const entries = Object.entries(flat)
        .filter(([, v]) => typeof v === "string" && (v as string).startsWith("#"))
        .map(([k, v]) => `    static let ${toCamelCase(k)} = Color(hex: "${v}")`)
        .join("\n");
      return `## Swift (SwiftUI)\n\n\`\`\`swift\nimport SwiftUI\n\nextension Color {\n  struct ${prefix ?? "Brand"} {\n${entries}\n  }\n}\n\`\`\``;
    }
    case "kotlin": {
      const entries = Object.entries(flat)
        .filter(([, v]) => typeof v === "string" && (v as string).startsWith("#"))
        .map(([k, v]) => `    val ${toCamelCase(k)} = Color(${(v as string).replace("#", "0xFF")})`)
        .join("\n");
      const objName = prefix ? prefix.charAt(0).toUpperCase() + prefix.slice(1) : "Brand";
      return `## Kotlin (Compose)\n\n\`\`\`kotlin\nimport androidx.compose.ui.graphics.Color\n\nobject ${objName}Colors {\n${entries}\n}\n\`\`\``;
    }
    case "style-dictionary": {
      const sdTokens: Record<string, unknown> = {};
      for (const [k, v] of Object.entries(flat)) sdTokens[k] = { value: v };
      return `## Style Dictionary\n\n\`\`\`json\n${JSON.stringify(sdTokens, null, 2)}\n\`\`\``;
    }
    case "dtcg": {
      // W3C Design Tokens Community Group format (https://tr.designtokens.org/format/)
      function inferDTCGType(value: string): string {
        if (/^#[0-9a-f]{3,8}$/i.test(value) || value.startsWith("oklch") || value.startsWith("rgb")) return "color";
        if (value.endsWith("rem") || value.endsWith("px") || value.endsWith("em")) return "dimension";
        if (value.match(/^\d+(\.\d+)?(ms|s)$/)) return "duration";
        if (value.startsWith("cubic-bezier") || value === "linear") return "cubicBezier";
        if (value.match(/^\d+(\.\d+)?$/) && !value.includes(" ")) return "number";
        if (value.includes(",") || value.includes("px") && value.split(" ").length > 1) return "shadow";
        return "other";
      }
      // Build nested DTCG structure from flat tokens
      const dtcg: Record<string, unknown> = {};
      for (const [k, v] of Object.entries(flat)) {
        const parts = k.split("-");
        let node: Record<string, unknown> = dtcg;
        for (let i = 0; i < parts.length - 1; i++) {
          if (!node[parts[i]]) node[parts[i]] = {};
          node = node[parts[i]] as Record<string, unknown>;
        }
        node[parts[parts.length - 1]] = { $value: v, $type: inferDTCGType(v) };
      }
      return `## W3C DTCG Format\n\n> Compatible with Tokens Studio, Style Dictionary 4, and any W3C-compliant tool.\n\n\`\`\`json\n${JSON.stringify(dtcg, null, 2)}\n\`\`\``;
    }
    case "figma-variables": {
      // Figma Variables JSON import format
      const colorEntries = Object.entries(flat).filter(([, v]) =>
        /^#[0-9a-f]{6}$/i.test(v)
      );
      function hexToFigmaRgb(hex: string) {
        const r = parseInt(hex.slice(1, 3), 16) / 255;
        const g = parseInt(hex.slice(3, 5), 16) / 255;
        const b = parseInt(hex.slice(5, 7), 16) / 255;
        return { r: +r.toFixed(4), g: +g.toFixed(4), b: +b.toFixed(4), a: 1 };
      }
      const collection = {
        name: prefix ?? "Design Tokens",
        modes: [{
          name: "Default",
          variables: colorEntries.map(([k, v]) => ({
            name: k.replace(/-/g, "/"),
            resolvedType: "COLOR",
            value: hexToFigmaRgb(v),
          })),
        }],
      };
      const figmaJson = { collections: [collection] };
      return `## Figma Variables Import\n\n> Go to Figma → Variables panel → Import → paste this JSON.\n\n\`\`\`json\n${JSON.stringify(figmaJson, null, 2)}\n\`\`\``;
    }
    default:
      return `## Flat JSON\n\n\`\`\`json\n${JSON.stringify(flat, null, 2)}\n\`\`\``;
  }
}

function flattenTokens(obj: Record<string, unknown>, pfx = ""): Record<string, string> {
  const result: Record<string, string> = {};
  for (const [key, val] of Object.entries(obj)) {
    const newKey = pfx ? `${pfx}-${key}` : key;
    if (val && typeof val === "object" && !Array.isArray(val)) {
      Object.assign(result, flattenTokens(val as Record<string, unknown>, newKey));
    } else {
      result[newKey] = String(val);
    }
  }
  return result;
}

function toCamelCase(s: string): string {
  return s.replace(/-([a-z])/g, (_, c) => c.toUpperCase());
}

// ────────────────────────────────────────────────────────
// analyzeBrandURL — real CSS/color extraction via fetch
// ────────────────────────────────────────────────────────

interface BrandAnalyzerArgs {
  url: string;
  outputFormat: "tokens" | "analysis" | "both";
}

function extractColorsFromCSS(css: string): string[] {
  const colors = new Set<string>();

  // 6-digit hex
  for (const m of css.matchAll(/#([0-9a-fA-F]{6})(?![0-9a-fA-F])/g)) {
    colors.add(`#${m[1].toLowerCase()}`);
  }
  // 3-digit hex → expand
  for (const m of css.matchAll(/#([0-9a-fA-F]{3})(?![0-9a-fA-F])/g)) {
    const [r, g, b] = m[1].split("").map(c => c + c);
    colors.add(`#${r}${g}${b}`.toLowerCase());
  }
  // rgb(r, g, b)
  for (const m of css.matchAll(/rgb\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)/g)) {
    const hex = rgbToHex({ r: +m[1], g: +m[2], b: +m[3] });
    colors.add(hex);
  }
  return [...colors];
}

function extractFontsFromCSS(css: string): string[] {
  const skip = new Set(["sans-serif","serif","monospace","system-ui","inherit","initial","unset","cursive","fantasy","-apple-system","blinkmacsystemfont"]);
  const fonts = new Set<string>();
  for (const m of css.matchAll(/font-family\s*:\s*([^;{}]+)/gi)) {
    for (const part of m[1].split(",")) {
      const name = part.trim().replace(/['"]/g, "");
      if (name && !skip.has(name.toLowerCase())) fonts.add(name);
    }
  }
  return [...fonts].slice(0, 6);
}

function clusterColors(hexColors: string[]): {
  primary: string | null; secondary: string | null; accent: string | null;
  neutrals: string[]; all: string[];
} {
  const withOklch = hexColors.map(hex => ({ hex, ok: rgbToOklch(hexToRgb(hex)) }));
  const neutrals  = withOklch.filter(c => c.ok.C < 0.06 || c.ok.L < 0.12 || c.ok.L > 0.93);
  const colored   = withOklch.filter(c => c.ok.C >= 0.06 && c.ok.L >= 0.12 && c.ok.L <= 0.93);

  // Group chromatic colors by hue proximity (±25°)
  const groups: typeof colored[] = [];
  for (const color of colored.sort((a, b) => b.ok.C - a.ok.C)) {
    let placed = false;
    for (const g of groups) {
      const diff = Math.abs(g[0].ok.H - color.ok.H);
      if (diff <= 25 || diff >= 335) { g.push(color); placed = true; break; }
    }
    if (!placed) groups.push([color]);
  }

  const reps = groups.map(g => g[0].hex);
  return {
    primary:   reps[0] ?? null,
    secondary: reps[1] ?? null,
    accent:    reps[2] ?? null,
    neutrals:  neutrals.slice(0, 4).map(c => c.hex),
    all:       hexColors.slice(0, 30),
  };
}

export async function analyzeBrandURL({ url, outputFormat }: BrandAnalyzerArgs): Promise<string> {
  const domain = new URL(url).hostname.replace("www.", "");
  let allCss = "";

  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; DesignMCP/1.0; +https://designmcp.dev)" },
      signal: AbortSignal.timeout(8000),
    });

    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const html = await res.text();

    // Collect inline <style> blocks
    for (const m of html.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/gi)) {
      allCss += m[1] + "\n";
    }

    // Collect inline style attributes
    for (const m of html.matchAll(/style="([^"]+)"/gi)) {
      allCss += m[1] + " ";
    }

    // Fetch up to 3 linked stylesheets
    const base = new URL(url);
    const sheetUrls: string[] = [];
    for (const m of html.matchAll(/<link[^>]+rel=["']stylesheet["'][^>]*href=["']([^"']+)["']/gi)) {
      sheetUrls.push(m[1]);
    }
    for (const m of html.matchAll(/<link[^>]+href=["']([^"']+)["'][^>]+rel=["']stylesheet["']/gi)) {
      sheetUrls.push(m[1]);
    }

    for (const sheetUrl of [...new Set(sheetUrls)].slice(0, 3)) {
      try {
        const abs = new URL(sheetUrl, base).href;
        const sr  = await fetch(abs, { signal: AbortSignal.timeout(5000) });
        if (sr.ok) allCss += await sr.text() + "\n";
      } catch { /* skip inaccessible sheets */ }
    }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return `## Brand Analysis: ${domain}\n\n> ⚠️ Could not fetch ${url}: ${msg}\n\nTry \`generate_design_tokens\` with a manually observed brand color instead.`;
  }

  const rawColors = extractColorsFromCSS(allCss);
  const fonts     = extractFontsFromCSS(allCss);
  const clusters  = clusterColors(rawColors);

  // Build output
  const parts: string[] = [`## Brand Analysis: ${domain}`];
  parts.push(`> Extracted from live CSS — ${rawColors.length} unique colors found across ${allCss.length > 0 ? "page styles" : "no stylesheets"}`);

  if (outputFormat === "analysis" || outputFormat === "both") {
    parts.push("### Detected Colors\n" + [
      clusters.primary   && `- **Primary:**   \`${clusters.primary}\``,
      clusters.secondary && `- **Secondary:** \`${clusters.secondary}\``,
      clusters.accent    && `- **Accent:**    \`${clusters.accent}\``,
      clusters.neutrals.length && `- **Neutrals:**  ${clusters.neutrals.map(c => `\`${c}\``).join(", ")}`,
    ].filter(Boolean).join("\n"));

    parts.push("### Detected Fonts\n" + (fonts.length
      ? fonts.map(f => `- \`${f}\``).join("\n")
      : "- No custom fonts detected (uses system fonts)"));
  }

  if (outputFormat === "tokens" || outputFormat === "both") {
    if (clusters.primary) {
      const scale  = generateColorScale(parseColor(clusters.primary));
      const tokens = generateSemanticTokens(scale, "light");
      const css    = tokensToCSS(tokens as unknown as Record<string, string>);
      parts.push("### Generated Tokens (from detected primary color)\n\n```css\n" + css + "\n```");

      if (fonts.length) {
        parts.push("### Detected Font Tokens\n\n```css\n:root {\n" +
          `  --font-family-display: '${fonts[0]}', system-ui, sans-serif;\n` +
          `  --font-family-body: '${fonts[1] ?? fonts[0]}', system-ui, sans-serif;\n` +
          "}\n```");
      }
    } else {
      parts.push("### Tokens\n\n> No chromatic brand colors detected. The site may use inline styles or a JS-in-CSS approach. Try inspecting DevTools manually.");
    }
  }

  return parts.join("\n\n");
}

// ────────────────────────────────────────────────────────
// generateColorHarmony — NEW: multi-color palette from one base
// ────────────────────────────────────────────────────────

type HarmonyType = "complementary" | "analogous" | "triadic" | "split-complementary" | "tetradic" | "monochromatic";

interface GenerateColorHarmonyArgs {
  baseColor: string;
  harmony: HarmonyType;
  format: Format;
}

const HARMONY_OFFSETS: Record<HarmonyType, number[]> = {
  complementary:        [0, 180],
  analogous:            [0, 30, 60],
  triadic:              [0, 120, 240],
  "split-complementary":[0, 150, 210],
  tetradic:             [0, 90, 180, 270],
  monochromatic:        [0],
};

export async function generateColorHarmony({ baseColor, harmony, format }: GenerateColorHarmonyArgs): Promise<string> {
  const baseRgb = parseColor(baseColor);
  const { L, C, H } = rgbToOklch(baseRgb);

  let palette: Array<{ name: string; hex: string; scale: ReturnType<typeof generateColorScale> }>;

  if (harmony === "monochromatic") {
    // 5 lightness stops on the same hue
    const monoStops = [
      { name: "lightest", L: 0.92, C: C * 0.3 },
      { name: "light",    L: 0.72, C: C * 0.7 },
      { name: "base",     L,       C            },
      { name: "dark",     L: 0.38, C: C * 0.85  },
      { name: "darkest",  L: 0.22, C: C * 0.70  },
    ];
    palette = monoStops.map(s => {
      const hex = rgbToHex(oklchToRgb({ L: s.L, C: s.C, H }));
      return { name: s.name, hex, scale: generateColorScale(parseColor(hex)) };
    });
  } else {
    palette = HARMONY_OFFSETS[harmony].map((offset, i) => {
      const hex = rgbToHex(oklchToRgb({ L, C, H: (H + offset) % 360 }));
      const names = ["primary", "secondary", "tertiary", "quaternary"];
      return { name: names[i] ?? `color-${i + 1}`, hex, scale: generateColorScale(parseColor(hex)) };
    });
  }

  const sections: string[] = [
    `## ${harmony.charAt(0).toUpperCase() + harmony.slice(1)} Harmony`,
    `Base: \`${baseColor}\` → ${palette.length} colors`,
    palette.map(p => `- **${p.name}:** \`${p.hex}\``).join("\n"),
  ];

  if (format === "css" || format === "all") {
    let css = "";
    for (const p of palette) {
      const entries = Object.entries(p.scale)
        .map(([k, v]) => `  --color-${p.name}-${k}: ${v};`).join("\n");
      css += `/* ${p.name}: ${p.hex} */\n:root {\n${entries}\n}\n\n`;
    }
    sections.push("### CSS Variables\n\n```css\n" + css.trimEnd() + "\n```");
  }

  if (format === "tailwind" || format === "all") {
    const entries = palette.map(p => colorScaleToTailwind(p.scale, p.name)).join("\n");
    sections.push("### Tailwind Config\n\n```js\n// theme.extend.colors\n{\n" + entries + "\n}\n```");
  }

  if (format === "json" || format === "all") {
    const json: Record<string, unknown> = {};
    for (const p of palette) json[p.name] = { hex: p.hex, scale: p.scale };
    sections.push("### JSON\n\n```json\n" + JSON.stringify(json, null, 2) + "\n```");
  }

  return sections.join("\n\n");
}

// ────────────────────────────────────────────────────────
// auditBrandColors — NEW: design quality audit
// ────────────────────────────────────────────────────────

interface AuditBrandColorsArgs {
  colors: string[];
  brandName?: string;
}

export async function auditBrandColors({ colors, brandName }: AuditBrandColorsArgs): Promise<string> {
  const name = brandName ?? "Brand";
  const parsed = colors.map(c => ({ hex: c, rgb: hexToRgb(c), ok: rgbToOklch(hexToRgb(c)) }));

  // 1. Contrast matrix
  const matrixRows: string[] = [];
  matrixRows.push("| | " + colors.map(c => `\`${c}\``).join(" | ") + " |");
  matrixRows.push("| " + Array(colors.length + 1).fill("---").join(" | ") + " |");
  for (const fg of parsed) {
    const cells = parsed.map(bg => {
      const r = Math.round(contrastRatio(fg.rgb, bg.rgb) * 10) / 10;
      const icon = r >= 7 ? "✅✅" : r >= 4.5 ? "✅" : r >= 3 ? "⚠️" : "❌";
      return `${icon} ${r}`;
    });
    matrixRows.push(`| \`${fg.hex}\` | ${cells.join(" | ")} |`);
  }

  // 2. Harmony analysis using OKLCH hue distances
  let harmonyNote = "";
  if (parsed.length >= 2) {
    const hues = parsed.map(p => p.ok.H);
    const diffs = [];
    for (let i = 0; i < hues.length; i++) {
      for (let j = i + 1; j < hues.length; j++) {
        const d = Math.abs(hues[i] - hues[j]);
        diffs.push(Math.min(d, 360 - d));
      }
    }
    const avgDiff = diffs.reduce((a, b) => a + b, 0) / diffs.length;
    if (avgDiff < 20)       harmonyNote = "🎨 **Monochromatic** — all colors share a similar hue. Cohesive but may lack contrast.";
    else if (avgDiff < 50)  harmonyNote = "🎨 **Analogous** — colors are closely related on the hue wheel. Harmonious and natural.";
    else if (avgDiff < 100) harmonyNote = "🎨 **Split-complementary** — moderate hue variation. Good tension with visual harmony.";
    else if (avgDiff < 140) harmonyNote = "🎨 **Triadic/Tetradic** — strong hue variety. Dynamic but ensure one color leads.";
    else                    harmonyNote = "🎨 **Complementary** — high contrast between hues. Bold and attention-grabbing.";
  }

  // 3. Suggestions
  const suggestions: string[] = [];
  for (const c of parsed) {
    if (c.ok.C < 0.05) suggestions.push(`\`${c.hex}\` is nearly achromatic — consider whether this is intentional neutral or a washed-out brand color.`);
    const whiteContrast = contrastRatio(c.rgb, { r: 255, g: 255, b: 255 });
    const blackContrast = contrastRatio(c.rgb, { r: 0, g: 0, b: 0 });
    if (whiteContrast < 3 && blackContrast < 3) suggestions.push(`\`${c.hex}\` is a mid-tone that fails WCAG AA on both white and black — avoid using it as a text color.`);
  }

  // 4. Accessibility score
  const allPairs = [];
  for (let i = 0; i < parsed.length; i++) {
    for (let j = 0; j < parsed.length; j++) {
      if (i !== j) allPairs.push(contrastRatio(parsed[i].rgb, parsed[j].rgb));
    }
  }
  const passing = allPairs.filter(r => r >= 4.5).length;
  const score   = allPairs.length ? Math.round((passing / allPairs.length) * 100) : 0;

  return [
    `## ${name} Brand Color Audit`,
    `**${colors.length} colors analyzed** | Accessibility score: **${score}%** of pairs pass WCAG AA`,
    "",
    "### Contrast Matrix\n> ✅✅ AAA (7:1+) · ✅ AA (4.5:1+) · ⚠️ AA Large (3:1+) · ❌ Fail\n\n" + matrixRows.join("\n"),
    "### Harmony\n" + (harmonyNote || "Not enough colors to analyze harmony."),
    suggestions.length ? "### Suggestions\n" + suggestions.map(s => `- ${s}`).join("\n") : "### Suggestions\nNo major issues detected. ✅",
  ].join("\n\n");
}

// ────────────────────────────────────────────────────────
// generateDesignSystemFile — NEW: complete copy-paste files
// ────────────────────────────────────────────────────────

interface GenerateDesignSystemFileArgs {
  brandColor: string;
  brandName: string;
  secondaryColor?: string;
  personality?: ThemePersonality;
}

export async function generateDesignSystemFile({ brandColor, brandName, secondaryColor, personality = "startup" }: GenerateDesignSystemFileArgs): Promise<string> {
  const slug = brandName.toLowerCase().replace(/[^a-z0-9]/g, "-");
  const baseRgb    = parseColor(brandColor);
  const lightScale = generateColorScale(baseRgb);
  const darkScale  = generateDarkScale(lightScale);
  const lightTokens = generateSemanticTokens(lightScale, "light");
  const darkTokens  = generateSemanticTokens(darkScale, "dark");

  const secColor  = secondaryColor ?? rgbToHex(generateComplementary(baseRgb, "split-complement"));
  const secRgb    = parseColor(secColor);
  const secScale  = generateColorScale(secRgb);

  const typoPersonality = PERSONALITY_TO_TYPO[personality];
  const fonts = FONT_PAIRINGS[typoPersonality];

  // ── tokens.css ──
  const primEntries = Object.entries(lightScale).map(([k, v]) => `  --color-primary-${k}: ${v};`).join("\n");
  const secEntries  = Object.entries(secScale).map(([k, v]) => `  --color-secondary-${k}: ${v};`).join("\n");
  const semEntries  = Object.entries(lightTokens).map(([k, v]) => `  --${k}: ${v};`).join("\n");
  const darkPrimEntries = Object.entries(darkScale).map(([k, v]) => `  --color-primary-${k}: ${v};`).join("\n");
  const darkSemEntries  = Object.entries(darkTokens).map(([k, v]) => `  --${k}: ${v};`).join("\n");

  const spacingEntries = TAILWIND_SPACING.slice(0, 20)
    .map(({ step, px }) => `  --space-${step}: ${(px / 16).toFixed(3)}rem;`).join("\n");

  const tokensCss = `/* ============================================================
   ${brandName} Design System — tokens.css
   Generated by DesignMCP · designmcp.dev
   ============================================================ */

/* Google Fonts */
@import url('https://fonts.googleapis.com/css2?family=${[fonts.display, fonts.body, fonts.mono]
    .filter((f, i, a) => a.indexOf(f) === i)
    .map(f => f.replace(/ /g, "+") + ":wght@300;400;500;600;700")
    .join("&family=")}&display=swap');

:root {
  /* ── Brand Palette ── */
${primEntries}

  /* ── Secondary Palette ── */
${secEntries}

  /* ── Semantic Color Tokens ── */
${semEntries}

  /* ── Typography ── */
  --font-family-display: '${fonts.display}', system-ui, sans-serif;
  --font-family-body:    '${fonts.body}', system-ui, sans-serif;
  --font-family-mono:    '${fonts.mono}', 'Fira Code', monospace;

  --font-size-xs:   0.694rem;
  --font-size-sm:   0.833rem;
  --font-size-base: 1rem;
  --font-size-md:   1.333rem;
  --font-size-lg:   1.777rem;
  --font-size-xl:   2.369rem;
  --font-size-2xl:  3.157rem;
  --font-size-3xl:  4.209rem;

  --font-weight-light:    300;
  --font-weight-regular:  400;
  --font-weight-medium:   500;
  --font-weight-semibold: 600;
  --font-weight-bold:     700;

  --line-height-tight:   1.25;
  --line-height-normal:  1.5;
  --line-height-relaxed: 1.625;

  /* ── Spacing ── */
${spacingEntries}

  /* ── Border Radius ── */
  --radius-sm:   0.125rem;
  --radius-md:   0.375rem;
  --radius-lg:   0.5rem;
  --radius-xl:   0.75rem;
  --radius-2xl:  1rem;
  --radius-full: 9999px;

  /* ── Shadows ── */
  --shadow-sm: 0 1px 3px 0 rgb(0 0 0 / 0.10), 0 1px 2px -1px rgb(0 0 0 / 0.10);
  --shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.10), 0 2px 4px -2px rgb(0 0 0 / 0.10);
  --shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.10), 0 4px 6px -4px rgb(0 0 0 / 0.10);
  --shadow-xl: 0 20px 25px -5px rgb(0 0 0 / 0.10), 0 8px 10px -6px rgb(0 0 0 / 0.10);

  /* ── Motion ── */
  --duration-fast:    100ms;
  --duration-normal:  200ms;
  --duration-slow:    300ms;
  --easing-ease-out:  cubic-bezier(0, 0, 0.2, 1);
  --easing-spring:    cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

/* Dark mode */
[data-theme='dark'], .dark {
${darkPrimEntries}

${darkSemEntries}

  --shadow-sm: 0 1px 3px 0 rgb(0 0 0 / 0.60), 0 1px 2px -1px rgb(0 0 0 / 0.60);
  --shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.60), 0 2px 4px -2px rgb(0 0 0 / 0.60);
  --shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.60), 0 4px 6px -4px rgb(0 0 0 / 0.60);
  --shadow-xl: 0 20px 25px -5px rgb(0 0 0 / 0.60), 0 8px 10px -6px rgb(0 0 0 / 0.60);
}`;

  // ── tailwind.config.ts ──
  const twPrimary   = Object.entries(lightScale).map(([k, v]) => `      ${k}: '${v}',`).join("\n");
  const twSecondary = Object.entries(secScale).map(([k, v]) => `      ${k}: '${v}',`).join("\n");
  const twSpacing   = TAILWIND_SPACING.slice(0, 20)
    .map(({ step, px }) => `      '${step}': '${(px / 16).toFixed(3)}rem',`).join("\n");

  const tailwindConfig = `import type { Config } from 'tailwindcss'

// Generated by DesignMCP · designmcp.dev
const config: Config = {
  darkMode: ['class', '[data-theme="dark"]'],
  content: ['./src/**/*.{ts,tsx,js,jsx,astro,svelte,vue}'],
  theme: {
    extend: {
      colors: {
        primary: {
${twPrimary}
        },
        secondary: {
${twSecondary}
        },
      },
      fontFamily: {
        display: ["'${fonts.display}'", 'system-ui', 'sans-serif'],
        body:    ["'${fonts.body}'", 'system-ui', 'sans-serif'],
        mono:    ["'${fonts.mono}'", "'Fira Code'", 'monospace'],
      },
      spacing: {
${twSpacing}
      },
      borderRadius: {
        sm: 'var(--radius-sm)',
        md: 'var(--radius-md)',
        lg: 'var(--radius-lg)',
        xl: 'var(--radius-xl)',
        '2xl': 'var(--radius-2xl)',
      },
      boxShadow: {
        sm: 'var(--shadow-sm)',
        md: 'var(--shadow-md)',
        lg: 'var(--shadow-lg)',
        xl: 'var(--shadow-xl)',
      },
    },
  },
}

export default config`;

  // ── tokens.ts (TypeScript constants) ──
  const tsTokens = `// Generated by DesignMCP · designmcp.dev
// Drop into your project: import { tokens } from './${slug}.tokens'

export const tokens = {
  color: {
    primary: ${JSON.stringify(lightScale, null, 4).replace(/\n/g, "\n    ")},
    secondary: ${JSON.stringify(secScale, null, 4).replace(/\n/g, "\n    ")},
    semantic: ${JSON.stringify(lightTokens, null, 4).replace(/\n/g, "\n    ")},
  },
  font: {
    display: "'${fonts.display}', system-ui, sans-serif",
    body:    "'${fonts.body}', system-ui, sans-serif",
    mono:    "'${fonts.mono}', 'Fira Code', monospace",
  },
} as const

export type Tokens = typeof tokens`;

  // ── globals.css (Tailwind v4 + shadcn/ui compatible) ──
  const { L: pL, C: pC, H: pH } = rgbToOklch(baseRgb);
  const safeC   = Math.min(pC, 0.28);
  const fmt = (l: number, c: number, h: number) =>
    `oklch(${l.toFixed(3)} ${c.toFixed(3)} ${h.toFixed(1)})`;
  const darkPL  = Math.max(Math.min(pL < 0.50 ? pL + 0.35 : pL + 0.15, 0.88), 0.55);
  const semKeys = [
    "background","foreground","card","card-foreground","popover","popover-foreground",
    "primary","primary-foreground","secondary","secondary-foreground","muted",
    "muted-foreground","accent","accent-foreground","destructive","border","input",
    "ring","chart-1","chart-2","chart-3","chart-4","chart-5",
  ];
  const lightShadcn = [
    `  --background: oklch(1 0 0);`,
    `  --foreground: oklch(0.145 0 0);`,
    `  --card: oklch(1 0 0);`,
    `  --card-foreground: oklch(0.145 0 0);`,
    `  --popover: oklch(1 0 0);`,
    `  --popover-foreground: oklch(0.145 0 0);`,
    `  --primary: ${fmt(pL, safeC, pH)};`,
    `  --primary-foreground: ${pL > 0.60 ? "oklch(0.145 0 0)" : "oklch(0.985 0 0)"};`,
    `  --secondary: oklch(0.961 0 0);`,
    `  --secondary-foreground: oklch(0.205 0 0);`,
    `  --muted: oklch(0.961 0 0);`,
    `  --muted-foreground: oklch(0.556 0 0);`,
    `  --accent: ${fmt(0.961, safeC * 0.15, (pH + 30) % 360)};`,
    `  --accent-foreground: oklch(0.205 0 0);`,
    `  --destructive: oklch(0.577 0.245 27.3);`,
    `  --border: oklch(0.922 0 0);`,
    `  --input: oklch(0.922 0 0);`,
    `  --ring: ${fmt(pL * 0.90, safeC * 0.55, pH)};`,
    `  --radius: 0.625rem;`,
    `  --chart-1: ${fmt(0.646, Math.min(safeC, 0.222), pH)};`,
    `  --chart-2: ${fmt(0.600, Math.min(safeC * 0.77, 0.118), (pH + 60) % 360)};`,
    `  --chart-3: ${fmt(0.398, Math.min(safeC * 0.45, 0.070), (pH + 120) % 360)};`,
    `  --chart-4: ${fmt(0.828, Math.min(safeC * 0.85, 0.189), (pH + 180) % 360)};`,
    `  --chart-5: ${fmt(0.769, Math.min(safeC * 0.85, 0.188), (pH + 240) % 360)};`,
  ].join("\n");
  const darkShadcn = [
    `  --background: oklch(0.145 0 0);`,
    `  --foreground: oklch(0.985 0 0);`,
    `  --card: oklch(0.205 0 0);`,
    `  --card-foreground: oklch(0.985 0 0);`,
    `  --popover: oklch(0.205 0 0);`,
    `  --popover-foreground: oklch(0.985 0 0);`,
    `  --primary: ${fmt(darkPL, safeC, pH)};`,
    `  --primary-foreground: ${darkPL > 0.60 ? "oklch(0.145 0 0)" : "oklch(0.985 0 0)"};`,
    `  --secondary: oklch(0.269 0 0);`,
    `  --secondary-foreground: oklch(0.985 0 0);`,
    `  --muted: oklch(0.269 0 0);`,
    `  --muted-foreground: oklch(0.708 0 0);`,
    `  --accent: ${fmt(0.269, safeC * 0.15, (pH + 30) % 360)};`,
    `  --accent-foreground: oklch(0.985 0 0);`,
    `  --destructive: oklch(0.704 0.191 22.2);`,
    `  --border: oklch(1 0 0 / 10%);`,
    `  --input: oklch(1 0 0 / 15%);`,
    `  --ring: ${fmt(Math.min(darkPL + 0.08, 0.96), safeC * 0.45, pH)};`,
    `  --chart-1: ${fmt(0.488, Math.min(safeC, 0.243), pH)};`,
    `  --chart-2: ${fmt(0.696, Math.min(safeC * 0.77, 0.170), (pH + 60) % 360)};`,
    `  --chart-3: ${fmt(0.769, Math.min(safeC * 0.85, 0.188), (pH + 120) % 360)};`,
    `  --chart-4: ${fmt(0.627, Math.min(safeC, 0.265), (pH + 180) % 360)};`,
    `  --chart-5: ${fmt(0.645, Math.min(safeC, 0.246), (pH + 240) % 360)};`,
  ].join("\n");
  const themeInlineBlock = semKeys.map(k => `  --color-${k}: var(--${k});`).join("\n") +
    "\n  --radius-sm: calc(var(--radius) - 4px);\n" +
    "  --radius-md: calc(var(--radius) - 2px);\n" +
    "  --radius-lg: var(--radius);\n" +
    "  --radius-xl: calc(var(--radius) + 4px);";

  const globalsCssTailwindV4 =
`/* ════════════════════════════════════════════════════════
   ${brandName} · globals.css (Tailwind v4 + shadcn/ui)
   Generated by DesignMCP · designmcp.dev
   ════════════════════════════════════════════════════════ */

@import "tailwindcss";
@import "tw-animate-css";
@import url('https://fonts.googleapis.com/css2?family=${[fonts.display, fonts.body]
    .filter((f, i, a) => a.indexOf(f) === i)
    .map(f => f.replace(/ /g, "+") + ":wght@300;400;500;600;700")
    .join("&family=")}&display=swap');

@custom-variant dark (&:is(.dark *));

:root {
${lightShadcn}

  /* Typography */
  --font-display: '${fonts.display}', system-ui, sans-serif;
  --font-body:    '${fonts.body}', system-ui, sans-serif;
  --font-mono:    '${fonts.mono}', 'Fira Code', monospace;
}

.dark {
${darkShadcn}
}

@theme inline {
${themeInlineBlock}
  --font-sans:    var(--font-body);
  --font-display: var(--font-display);
  --font-mono:    var(--font-mono);
}

@layer base {
  * {
    @apply border-border outline-ring/50;
  }
  body {
    @apply bg-background text-foreground font-sans;
  }
}`;

  return [
    `# ${brandName} Design System Files`,
    `Primary: \`${brandColor}\` · Secondary: \`${secColor}\` · Personality: \`${personality}\``,
    "Four files. Drop them in and the design system is live — works with shadcn/ui, Tailwind v3, and Tailwind v4.",
    "---",
    "## File 1: `globals.css` (Tailwind v4 + shadcn/ui)\n\n```css\n" + globalsCssTailwindV4 + "\n```",
    "---",
    "## File 2: `tokens.css` (Tailwind v3 / vanilla CSS)\n\n```css\n" + tokensCss + "\n```",
    "---",
    "## File 3: `tailwind.config.ts` (Tailwind v3)\n\n```ts\n" + tailwindConfig + "\n```",
    "---",
    "## File 4: `tokens.ts` (TypeScript)\n\n```ts\n" + tsTokens + "\n```",
  ].join("\n\n");
}

// ────────────────────────────────────────────────────────
// generateShadcnTheme — exact shadcn/ui CSS variables [FREE]
// The most-searched design+dev task: getting shadcn working
// with a custom brand color in Tailwind v4 OKLCH format.
// ────────────────────────────────────────────────────────

interface GenerateShadcnThemeArgs {
  brandColor: string;
  radius?: number;  // border-radius base in rem, default 0.625
  accentColor?: string; // optional explicit accent, auto if omitted
}

export async function generateShadcnTheme({
  brandColor,
  radius = 0.625,
  accentColor,
}: GenerateShadcnThemeArgs): Promise<string> {
  const baseRgb = parseColor(brandColor);
  const { L, C, H } = rgbToOklch(baseRgb);
  const safeC = Math.min(C, 0.28);

  // Primary foreground: dark text on light/mid colours, white on dark ones
  const primaryFg = L > 0.60 ? "oklch(0.145 0 0)" : "oklch(0.985 0 0)";

  // For dark mode, lift the primary so it shows on near-black background
  const darkPrimaryL = Math.max(Math.min(L < 0.50 ? L + 0.35 : L + 0.15, 0.88), 0.55);
  const darkPrimaryFg = darkPrimaryL > 0.60 ? "oklch(0.145 0 0)" : "oklch(0.985 0 0)";

  // Accent hue: use explicit accentColor or analogous +30°
  let accentH = (H + 30) % 360;
  let accentC  = safeC * 0.15;
  if (accentColor) {
    const aRgb = parseColor(accentColor);
    const aOk  = rgbToOklch(aRgb);
    accentH = aOk.H;
    accentC = Math.min(aOk.C, 0.28) * 0.15;
  }

  const fmt = (l: number, c: number, h: number) =>
    `oklch(${l.toFixed(3)} ${c.toFixed(3)} ${h.toFixed(1)})`;

  const ring = fmt(L * 0.90, safeC * 0.55, H);

  // Light mode
  const light: Record<string, string> = {
    "--background":            "oklch(1 0 0)",
    "--foreground":            "oklch(0.145 0 0)",
    "--card":                  "oklch(1 0 0)",
    "--card-foreground":       "oklch(0.145 0 0)",
    "--popover":               "oklch(1 0 0)",
    "--popover-foreground":    "oklch(0.145 0 0)",
    "--primary":               fmt(L, safeC, H),
    "--primary-foreground":    primaryFg,
    "--secondary":             "oklch(0.961 0 0)",
    "--secondary-foreground":  "oklch(0.205 0 0)",
    "--muted":                 "oklch(0.961 0 0)",
    "--muted-foreground":      "oklch(0.556 0 0)",
    "--accent":                fmt(0.961, accentC, accentH),
    "--accent-foreground":     "oklch(0.205 0 0)",
    "--destructive":           "oklch(0.577 0.245 27.3)",
    "--border":                "oklch(0.922 0 0)",
    "--input":                 "oklch(0.922 0 0)",
    "--ring":                  ring,
    "--radius":                `${radius}rem`,
    "--chart-1":               fmt(0.646, Math.min(safeC, 0.222), H),
    "--chart-2":               fmt(0.600, Math.min(safeC * 0.77, 0.118), (H + 60) % 360),
    "--chart-3":               fmt(0.398, Math.min(safeC * 0.45, 0.070), (H + 120) % 360),
    "--chart-4":               fmt(0.828, Math.min(safeC * 0.85, 0.189), (H + 180) % 360),
    "--chart-5":               fmt(0.769, Math.min(safeC * 0.85, 0.188), (H + 240) % 360),
  };

  // Dark mode
  const darkRing = fmt(Math.min(darkPrimaryL + 0.08, 0.96), safeC * 0.45, H);
  const dark: Record<string, string> = {
    "--background":            "oklch(0.145 0 0)",
    "--foreground":            "oklch(0.985 0 0)",
    "--card":                  "oklch(0.205 0 0)",
    "--card-foreground":       "oklch(0.985 0 0)",
    "--popover":               "oklch(0.205 0 0)",
    "--popover-foreground":    "oklch(0.985 0 0)",
    "--primary":               fmt(darkPrimaryL, safeC, H),
    "--primary-foreground":    darkPrimaryFg,
    "--secondary":             "oklch(0.269 0 0)",
    "--secondary-foreground":  "oklch(0.985 0 0)",
    "--muted":                 "oklch(0.269 0 0)",
    "--muted-foreground":      "oklch(0.708 0 0)",
    "--accent":                fmt(0.269, accentC, accentH),
    "--accent-foreground":     "oklch(0.985 0 0)",
    "--destructive":           "oklch(0.704 0.191 22.2)",
    "--border":                "oklch(1 0 0 / 10%)",
    "--input":                 "oklch(1 0 0 / 15%)",
    "--ring":                  darkRing,
    "--chart-1":               fmt(0.488, Math.min(safeC, 0.243), H),
    "--chart-2":               fmt(0.696, Math.min(safeC * 0.77, 0.170), (H + 60) % 360),
    "--chart-3":               fmt(0.769, Math.min(safeC * 0.85, 0.188), (H + 120) % 360),
    "--chart-4":               fmt(0.627, Math.min(safeC, 0.265), (H + 180) % 360),
    "--chart-5":               fmt(0.645, Math.min(safeC, 0.246), (H + 240) % 360),
  };

  const entries = (obj: Record<string, string>) =>
    Object.entries(obj).map(([k, v]) => `  ${k}: ${v};`).join("\n");

  // @theme inline block — maps Tailwind v4 --color-* utilities to the CSS vars
  const semanticKeys = [
    "background", "foreground", "card", "card-foreground", "popover",
    "popover-foreground", "primary", "primary-foreground", "secondary",
    "secondary-foreground", "muted", "muted-foreground", "accent",
    "accent-foreground", "destructive", "border", "input", "ring",
    "chart-1", "chart-2", "chart-3", "chart-4", "chart-5",
  ];
  const themeInline = semanticKeys
    .map(k => `  --color-${k}: var(--${k});`)
    .join("\n") + "\n" +
    "  --radius-sm: calc(var(--radius) - 4px);\n" +
    "  --radius-md: calc(var(--radius) - 2px);\n" +
    "  --radius-lg: var(--radius);\n" +
    "  --radius-xl: calc(var(--radius) + 4px);";

  const globalsCss =
`/* ────────────────────────────────────────────────────────────
   globals.css — Generated by DesignMCP · designmcp.dev
   shadcn/ui + Tailwind CSS v4 · Primary: ${brandColor}
   ──────────────────────────────────────────────────────────── */

@import "tailwindcss";
@import "tw-animate-css";

@custom-variant dark (&:is(.dark *));

:root {
${entries(light)}
}

.dark {
${entries(dark)}
}

@theme inline {
${themeInline}
}

@layer base {
  * {
    @apply border-border outline-ring/50;
  }
  body {
    @apply bg-background text-foreground;
  }
}`;

  // Tailwind v3 equivalent (globals.css for older projects)
  const lightV3 = Object.entries(light)
    .filter(([k]) => k !== "--radius")
    .map(([k, v]) => `    ${k}: ${v};`).join("\n");
  const darkV3 = Object.entries(dark)
    .map(([k, v]) => `    ${k}: ${v};`).join("\n");

  const tailwindV3Css =
`/* globals.css — Tailwind CSS v3 variant */
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
${lightV3}
    --radius: ${radius}rem;
  }
  .dark {
${darkV3}
  }
}`;

  return [
    `## shadcn/ui Theme · \`${brandColor}\``,
    `Primary: \`${fmt(L, safeC, H)}\` · Radius: \`${radius}rem\` · Includes light + dark mode + 5 chart colors`,
    "Drop `globals.css` into your project and your shadcn/ui components will use your brand color immediately.",
    "---",
    `### \`globals.css\` (Tailwind v4 — recommended)\n\n\`\`\`css\n${globalsCss}\n\`\`\``,
    "---",
    `### \`globals.css\` (Tailwind v3)\n\n\`\`\`css\n${tailwindV3Css}\n\`\`\``,
    "---",
    `### Quick-start\n\`\`\`bash\n# Install shadcn/ui\nnpx shadcn@latest init\n\n# Replace src/app/globals.css with the file above, then add components:\nnpx shadcn@latest add button card input\n\`\`\``,
  ].join("\n\n");
}

// ────────────────────────────────────────────────────────
// themeGenerator — one-shot complete theme
// ────────────────────────────────────────────────────────

interface GenerateThemeArgs {
  description: string;
  format: Format;
  includeComponentTokens: boolean;
}

function inferPersonality(description: string): { color: string; personality: ThemePersonality } {
  const d = description.toLowerCase();
  if (d.match(/fintech|bank|finance|invest|enterprise|saas|b2b/))
    return { color: "#0ea5e9", personality: "corporate" };
  if (d.match(/gen z|youth|fun|energy|bold|vibrant|gaming/))
    return { color: "#8b5cf6", personality: "playful" };
  if (d.match(/luxury|premium|high.end|exclusive|elegant|couture/))
    return { color: "#b8860b", personality: "luxury" };
  if (d.match(/eco|green|sustainability|nature|organic|plant/))
    return { color: "#16a34a", personality: "creative" };
  if (d.match(/dev|developer|tech|code|open.source|terminal|dark/))
    return { color: "#6366f1", personality: "minimal" };
  if (d.match(/health|wellness|calm|mindful|meditation|spa/))
    return { color: "#0d9488", personality: "minimal" };
  if (d.match(/media|editorial|magazine|news|blog|publish/))
    return { color: "#dc2626", personality: "creative" };
  if (d.match(/creative|studio|agency|design|art|portfolio/))
    return { color: "#f59e0b", personality: "creative" };
  return { color: "#4f46e5", personality: "startup" };
}

export async function generateTheme({ description, format, includeComponentTokens }: GenerateThemeArgs): Promise<string> {
  // ── Try AI-powered personality inference first (Pro+AI tier users) ──────────
  const aiParams = await analyzeThemeWithAI(description);

  const color       = aiParams?.primaryColor     ?? inferPersonality(description).color;
  const personality = (aiParams?.personality     ?? inferPersonality(description).personality) as ThemePersonality;
  const brandName   = description.split(" ").slice(0, 2).join("-").toLowerCase().replace(/[^a-z-]/g, "");

  const aiNote = aiParams
    ? `**AI analysis:** ${aiParams.colorRationale}\n> *${aiParams.designDirection}*`
    : `**Inferred personality:** \`${personality}\` | **Base color:** \`${color}\``;

  const header = `# Generated Theme\n**Prompt:** "${description}"\n${aiNote}\n\n---\n`;

  const tokenSystem = await generateDesignTokens({
    brandColor: color, brandName, personality,
    secondaryColor: aiParams?.secondaryColor,
    includeMotion: true, format,
  });

  let componentSection = "";
  if (includeComponentTokens) {
    componentSection = "\n\n---\n\n## Component Tokens\n\n" + await generateComponentTokens({
      components: ["button", "input", "card", "badge"],
      brandColor: color,
      format: format === "tailwind" ? "css" : (format as "json" | "css" | "all"),
    });
  }

  // ── Optionally add AI color rationale ──────────────────────────────────────
  let colorStory = "";
  if (!aiParams) {
    // Only call explainPalette when AI wasn't already used above (avoid double-billing)
    const story = await explainPaletteWithAI(color, description);
    if (story) colorStory = `\n\n---\n\n## Color Rationale\n\n${story}`;
  }

  return header + tokenSystem + componentSection + colorStory;
}

// ────────────────────────────────────────────────────────
// generateBrandIdentity — AI-powered brand strategy doc [AI tier]
// ────────────────────────────────────────────────────────

interface GenerateBrandIdentityArgs {
  brandName: string;
  description: string;
}

/**
 * Calls Claude to produce a comprehensive 7-section brand identity document:
 * positioning, personality, visual direction, color strategy, typography,
 * design principles, and brand voice — in under 30 seconds.
 *
 * This is DesignMCP's highest-value output. Replaces 4–8 hours of brand
 * strategy work with a single tool call.
 */
export async function generateBrandIdentity({ brandName, description }: GenerateBrandIdentityArgs): Promise<string> {
  return generateBrandIdentityWithAI(brandName, description);
}
