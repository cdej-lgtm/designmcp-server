#!/usr/bin/env node
/**
 * DesignMCP — Brand Intelligence & Design Token Server
 * @version 2.0.0
 * @license MIT
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

import {
  generateColorPalette,
  generateDesignTokens,
  analyzeBrandURL,
  generateTypographySystem,
  generateShadowSystem,
  generateSpacingScale,
  generateComponentTokens,
  exportTokens,
  checkAccessibility,
  generateTheme,
  generateColorHarmony,
  auditBrandColors,
  generateDesignSystemFile,
} from "./tools/allTools.js";
import { SERVER_INFO } from "./lib/constants.js";
import { logger } from "./lib/logger.js";

const server = new McpServer({
  name: SERVER_INFO.name,
  version: "2.0.0",
});

// ─── 1. Generate Color Palette ────────────────────────────────────────────────

server.tool(
  "generate_color_palette",
  "Generates an 11-step (50–950) perceptually-uniform color scale using the OKLCH color space — the same algorithm used by Radix UI and shadcn/ui. Input any hex color, color name, or natural language description ('warm coral for a food brand'). Returns CSS custom properties, Tailwind config, and semantic tokens (primary, surface, error, success) in a single call. Includes automatic dark-mode variants.",
  {
    input: z.string().describe(
      "Brand color as hex (#4F46E5), RGB, color name ('midnight blue'), or description ('a warm forest green for an eco brand')"
    ),
    style: z.enum(["professional", "playful", "minimal", "bold", "earthy", "luxury"]).optional()
      .describe("Brand personality influencing tonal balance. Default: professional"),
    darkMode: z.boolean().optional().describe("Include dark-mode token variants. Default: true"),
    format: z.enum(["json", "css", "tailwind", "all"]).optional()
      .describe("Output format. 'all' returns CSS, Tailwind, and JSON together. Default: all"),
  },
  async ({ input, style = "professional", darkMode = true, format = "all" }) => {
    logger.info({ tool: "generate_color_palette", input });
    const result = await generateColorPalette({ input, style, darkMode, format });
    return { content: [{ type: "text" as const, text: result }] };
  }
);

// ─── 2. Generate Design Tokens ────────────────────────────────────────────────

server.tool(
  "generate_design_tokens",
  "Generates a complete, production-ready design token system in one call: OKLCH color scale + auto-generated secondary/complementary color + typography with Google Fonts pairings + Tailwind-grade spacing scale + shadow system + motion/easing + border radius tokens. Ideal for bootstrapping a new product's design system. Output as CSS variables, Tailwind config, or JSON.",
  {
    brandColor: z.string().describe("Primary brand color as hex, RGB, or descriptive name"),
    brandName: z.string().optional().describe("Brand name for labelling output. Default: 'brand'"),
    secondaryColor: z.string().optional().describe("Secondary color. Auto-generated as split-complementary if omitted."),
    personality: z.enum(["corporate", "startup", "creative", "luxury", "minimal", "playful"]).optional()
      .describe("Personality influences font pairing, spacing density, and shadow style. Default: startup"),
    includeMotion: z.boolean().optional().describe("Include easing and duration tokens. Default: true"),
    format: z.enum(["json", "css", "tailwind", "all"]).optional().describe("Output format. Default: all"),
  },
  async ({ brandColor, brandName = "brand", secondaryColor, personality = "startup", includeMotion = true, format = "all" }) => {
    logger.info({ tool: "generate_design_tokens", brandColor });
    const result = await generateDesignTokens({ brandColor, brandName, secondaryColor, personality, includeMotion, format });
    return { content: [{ type: "text" as const, text: result }] };
  }
);

// ─── 3. Analyze Brand URL ─────────────────────────────────────────────────────

server.tool(
  "analyze_brand_url",
  "Fetches a live website URL, extracts all CSS colors and font-families from inline styles, <style> tags, and linked stylesheets, then clusters them by hue to identify the primary/secondary/accent colors. Returns the detected palette as ready-to-use design tokens (CSS variables and semantic mappings). Use this for competitive analysis, matching a client's existing brand, or reverse-engineering a design system.",
  {
    url: z.string().url().describe("Full URL to analyze, e.g. https://stripe.com"),
    outputFormat: z.enum(["tokens", "analysis", "both"]).optional()
      .describe("'tokens' = code-ready CSS variables. 'analysis' = human-readable color/font breakdown. 'both' = everything. Default: both"),
  },
  async ({ url, outputFormat = "both" }) => {
    logger.info({ tool: "analyze_brand_url", url });
    const result = await analyzeBrandURL({ url, outputFormat });
    return { content: [{ type: "text" as const, text: result }] };
  }
);

// ─── 4. Generate Typography System ───────────────────────────────────────────

server.tool(
  "generate_typography_system",
  "Generates a complete typography token system: display/body/mono font pairings from Google Fonts matched to the brand personality, a 9-step modular type scale (xs → 4xl) calculated from the chosen ratio, plus weight, line-height, and letter-spacing tokens. Returns a Google Fonts <link> tag, CSS variables, Tailwind config, and JSON.",
  {
    personality: z.enum(["corporate", "editorial", "technical", "humanist", "geometric", "luxury", "playful"])
      .describe("Determines font pairing: geometric→Outfit+DM Sans, luxury→Cormorant Garamond, editorial→Playfair+Source Serif, etc."),
    baseSize: z.number().optional().describe("Base font size in px. Default: 16"),
    scaleRatio: z.enum(["minor-third", "major-third", "perfect-fourth", "golden"]).optional()
      .describe("Modular scale ratio. 'perfect-fourth' (1.333) for UI, 'golden' (1.618) for editorial. Default: perfect-fourth"),
    brandName: z.string().optional().describe("Brand namespace for token naming"),
    format: z.enum(["json", "css", "tailwind", "all"]).optional().describe("Output format. Default: all"),
  },
  async ({ personality, baseSize = 16, scaleRatio = "perfect-fourth", brandName = "brand", format = "all" }) => {
    logger.info({ tool: "generate_typography_system", personality });
    const result = await generateTypographySystem({ personality, baseSize, scaleRatio, brandName, format });
    return { content: [{ type: "text" as const, text: result }] };
  }
);

// ─── 5. Generate Shadow System ────────────────────────────────────────────────

server.tool(
  "generate_shadow_system",
  "Generates an elevation shadow scale (xs → 2xl + inner) in four distinct styles: 'soft' (standard diffused), 'sharp' (hard-edge, like Figma/Notion components), 'diffuse' (large spread, minimal offset), or 'colored' (brand-tinted shadows like Vercel and Linear use). Returns CSS custom properties and Tailwind boxShadow config for light and/or dark mode.",
  {
    mode: z.enum(["light", "dark", "both"]).optional().describe("Theme mode to generate. Default: both"),
    style: z.enum(["sharp", "soft", "diffuse", "colored"]).optional()
      .describe("Shadow style. 'colored' tints shadows with the brand color. Default: soft"),
    brandColor: z.string().optional().describe("Brand color for 'colored' style shadows."),
    format: z.enum(["json", "css", "tailwind", "all"]).optional().describe("Output format. Default: all"),
  },
  async ({ mode = "both", style = "soft", brandColor, format = "all" }) => {
    logger.info({ tool: "generate_shadow_system", style });
    const result = await generateShadowSystem({ mode, style, brandColor, format });
    return { content: [{ type: "text" as const, text: result }] };
  }
);

// ─── 6. Generate Spacing Scale ────────────────────────────────────────────────

server.tool(
  "generate_spacing_scale",
  "Generates a spacing token system. The default (4px base, numeric naming) produces a Tailwind-compatible scale with fine-grained steps at small sizes and larger jumps at bigger sizes (4px→8px→12px…→96px→128px…→384px) — matching how real design systems handle space. Supports custom base units and t-shirt or descriptive naming conventions.",
  {
    baseUnit: z.number().optional().describe("Base unit in px. Default: 4 (4px grid)"),
    steps: z.number().optional().describe("Number of scale steps. Default: 16"),
    naming: z.enum(["numeric", "t-shirt", "descriptive"]).optional()
      .describe("Token naming: 'numeric' (space-4), 't-shirt' (space-sm), 'descriptive' (space-comfortable). Default: numeric"),
    format: z.enum(["json", "css", "tailwind", "all"]).optional().describe("Output format. Default: all"),
  },
  async ({ baseUnit = 4, steps = 16, naming = "numeric", format = "all" }) => {
    logger.info({ tool: "generate_spacing_scale", baseUnit });
    const result = await generateSpacingScale({ baseUnit, steps, naming, format });
    return { content: [{ type: "text" as const, text: result }] };
  }
);

// ─── 7. Generate Component Tokens ────────────────────────────────────────────

server.tool(
  "generate_component_tokens",
  "Generates semantic design tokens for specific UI components — Button, Input, Card, Badge, Modal, Tooltip, Navigation, Table, Alert, Avatar, Chip, Form. Covers all interactive states (default, hover, active, focus, disabled, error). Colors are derived from your brand color using the full OKLCH scale. Output as CSS custom properties or JSON.",
  {
    components: z.array(z.enum([
      "button", "input", "card", "badge", "modal", "tooltip",
      "navigation", "table", "form", "alert", "avatar", "chip",
    ])).describe("Components to generate tokens for"),
    brandColor: z.string().describe("Primary brand color as hex or name"),
    format: z.enum(["json", "css", "all"]).optional().describe("Output format. Default: all"),
  },
  async ({ components, brandColor, format = "all" }) => {
    logger.info({ tool: "generate_component_tokens", components });
    const result = await generateComponentTokens({ components, brandColor, format });
    return { content: [{ type: "text" as const, text: result }] };
  }
);

// ─── 8. Check Accessibility ───────────────────────────────────────────────────

server.tool(
  "check_accessibility",
  "Checks WCAG 2.1 contrast compliance for any number of color pairs in one call. Returns the exact contrast ratio, AA/AAA/AA-Large pass/fail for each pair, and — when a pair fails — automatically suggests the nearest accessible alternative color using direction-aware OKLCH adjustment (darkens for light backgrounds, lightens for dark ones).",
  {
    pairs: z.array(z.object({
      foreground: z.string().describe("Foreground (text/icon) color as hex"),
      background: z.string().describe("Background color as hex"),
      label: z.string().optional().describe("Optional label, e.g. 'CTA button text on brand bg'"),
    })).describe("Color pairs to check"),
    level: z.enum(["AA", "AAA"]).optional().describe("WCAG target level. Default: AA"),
    suggestFixes: z.boolean().optional().describe("Suggest accessible alternatives for failing pairs. Default: true"),
  },
  async ({ pairs, level = "AA", suggestFixes = true }) => {
    logger.info({ tool: "check_accessibility", pairCount: pairs.length });
    const result = await checkAccessibility({ pairs, level, suggestFixes });
    return { content: [{ type: "text" as const, text: result }] };
  }
);

// ─── 9. Export Tokens ─────────────────────────────────────────────────────────

server.tool(
  "export_tokens",
  "Converts a design token JSON object into any target platform format: CSS custom properties, SCSS variables, Tailwind v3 config (module.exports), Tailwind v4 @theme block, Style Dictionary JSON, Swift Color extensions (SwiftUI), or Kotlin Color objects (Jetpack Compose). Accepts flat or nested token objects.",
  {
    tokens: z.record(z.any()).describe("Token object — flat key/value or nested (W3C Design Token format)"),
    targetFormat: z.enum(["css", "scss", "tailwind-v3", "tailwind-v4", "style-dictionary", "swift", "kotlin", "json-flat"])
      .describe("Target output format"),
    prefix: z.string().optional().describe("Variable prefix, e.g. 'app' → --app-color-primary"),
  },
  async ({ tokens, targetFormat, prefix }) => {
    logger.info({ tool: "export_tokens", targetFormat });
    const result = await exportTokens({ tokens, targetFormat, prefix });
    return { content: [{ type: "text" as const, text: result }] };
  }
);

// ─── 10. Generate Theme ───────────────────────────────────────────────────────

server.tool(
  "generate_theme",
  "One-shot: infers a complete brand personality from a natural language description and returns a full design system — OKLCH color scale, complementary secondary color, typography with Google Fonts, Tailwind-grade spacing, shadows, motion tokens, border radius, and component tokens — all in a single response. The fastest path from a product idea to a production design system.",
  {
    description: z.string().describe(
      "Brand/product description. Examples: 'a fintech app for Gen Z investors', 'luxury skincare inspired by Japanese minimalism', 'open-source developer tool, dark and focused'"
    ),
    format: z.enum(["json", "css", "tailwind", "all"]).optional().describe("Output format. Default: all"),
    includeComponentTokens: z.boolean().optional()
      .describe("Include Button, Input, Card, Badge component tokens. Default: true"),
  },
  async ({ description, format = "all", includeComponentTokens = true }) => {
    logger.info({ tool: "generate_theme", description: description.slice(0, 80) });
    const result = await generateTheme({ description, format, includeComponentTokens });
    return { content: [{ type: "text" as const, text: result }] };
  }
);

// ─── 11. Generate Color Harmony ───────────────────────────────────────────────

server.tool(
  "generate_color_harmony",
  "Generates a mathematically harmonious multi-color palette from a single base color using OKLCH hue rotation. Choose from: complementary (2 colors, maximum contrast), analogous (3 colors, natural cohesion), triadic (3 colors, vibrant balance), split-complementary (3 colors, softer than complementary), tetradic (4 colors, rich variety), or monochromatic (5 lightness variations of the same hue). Each color in the set comes with its full 11-step scale.",
  {
    baseColor: z.string().describe("Base brand color as hex or name"),
    harmony: z.enum(["complementary", "analogous", "triadic", "split-complementary", "tetradic", "monochromatic"])
      .describe("Harmony type to generate"),
    format: z.enum(["json", "css", "tailwind", "all"]).optional().describe("Output format. Default: all"),
  },
  async ({ baseColor, harmony, format = "all" }) => {
    logger.info({ tool: "generate_color_harmony", harmony, baseColor });
    const result = await generateColorHarmony({ baseColor, harmony, format });
    return { content: [{ type: "text" as const, text: result }] };
  }
);

// ─── 12. Audit Brand Colors ───────────────────────────────────────────────────

server.tool(
  "audit_brand_colors",
  "Runs a professional design audit on a set of brand colors. Returns: a full WCAG contrast matrix (every color on every other color, AA/AAA rated), a color harmony classification (complementary, analogous, triadic, etc.) derived from OKLCH hue distances, an accessibility score (% of pairs passing AA), and specific actionable improvement suggestions. Use this when reviewing a client's existing palette or before shipping a design system.",
  {
    colors: z.array(z.string()).min(2).describe("Array of hex colors to audit, e.g. ['#4f46e5', '#ffffff', '#0f172a']"),
    brandName: z.string().optional().describe("Brand name for the report heading"),
  },
  async ({ colors, brandName }) => {
    logger.info({ tool: "audit_brand_colors", count: colors.length });
    const result = await auditBrandColors({ colors, brandName });
    return { content: [{ type: "text" as const, text: result }] };
  }
);

// ─── 13. Generate Design System File ─────────────────────────────────────────

server.tool(
  "generate_design_system_file",
  "Generates three complete, copy-paste-ready files for a full design system: (1) tokens.css — a single CSS file with every token: OKLCH color scales, semantic tokens, dark mode, typography, spacing, shadows, motion, and border radius; (2) tailwind.config.ts — a complete Tailwind v3 config wired to those tokens; (3) tokens.ts — a typed TypeScript constants file for use in React/Vue/Svelte. Drop all three files into any project and the design system is live immediately.",
  {
    brandColor: z.string().describe("Primary brand color as hex or name"),
    brandName: z.string().describe("Brand/project name, used in file comments and token namespacing"),
    secondaryColor: z.string().optional().describe("Secondary color. Auto-generated as split-complementary if omitted."),
    personality: z.enum(["corporate", "startup", "creative", "luxury", "minimal", "playful"]).optional()
      .describe("Influences font pairing and token values. Default: startup"),
  },
  async ({ brandColor, brandName, secondaryColor, personality = "startup" }) => {
    logger.info({ tool: "generate_design_system_file", brandColor, brandName });
    const result = await generateDesignSystemFile({ brandColor, brandName, secondaryColor, personality });
    return { content: [{ type: "text" as const, text: result }] };
  }
);

// ─── Start ────────────────────────────────────────────────────────────────────

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  logger.info("DesignMCP v2.0.0 running on stdio — 13 tools active");
}

main().catch((err) => {
  logger.error({ err }, "Fatal error starting DesignMCP server");
  process.exit(1);
});
