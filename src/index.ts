/**
 * DesignMCP — Brand Intelligence & Design Token Server
 * @version 2.2.0
 * @license MIT
 *
 * Transport: Streamable HTTP when PORT env var is set (MCPize hosting),
 *            stdio otherwise (local Claude Desktop / npx use)
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import express from "express";
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
  generateBrandIdentity,
  generateShadcnTheme,
} from "./tools/allTools.js";
import { requirePro, requireAI, getTier } from "./lib/auth.js";
import { SERVER_INFO } from "./lib/constants.js";
import { logger } from "./lib/logger.js";

const server = new McpServer({
  name: SERVER_INFO.name,
  version: "2.2.0",
});

// ─── 1. Generate Color Palette [FREE] ─────────────────────────────────────────

server.tool(
  "generate_color_palette",
  "FREE · Generates an 11-step (50–950) perceptually-uniform color scale using the OKLCH color space — the same algorithm used by Radix UI and shadcn/ui. Input any hex color, color name, or natural language description ('warm coral for a food brand'). Returns CSS custom properties, Tailwind config, and semantic tokens (primary, surface, error, success) in a single call. Includes automatic dark-mode variants.",
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

// ─── 2. Generate Design Tokens [PRO] ─────────────────────────────────────────

server.tool(
  "generate_design_tokens",
  "PRO · Generates a complete, production-ready design token system in one call: OKLCH color scale + auto-generated secondary/complementary color + typography with Google Fonts pairings + Tailwind-grade spacing scale + shadow system + motion/easing + border radius tokens. Ideal for bootstrapping a new product's design system. Output as CSS variables, Tailwind config, or JSON. Requires DESIGNMCP_KEY.",
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
    requirePro();
    logger.info({ tool: "generate_design_tokens", brandColor });
    const result = await generateDesignTokens({ brandColor, brandName, secondaryColor, personality, includeMotion, format });
    return { content: [{ type: "text" as const, text: result }] };
  }
);

// ─── 3. Analyze Brand URL [PRO] ───────────────────────────────────────────────

server.tool(
  "analyze_brand_url",
  "PRO · Fetches a live website URL, extracts all CSS colors and font-families from inline styles, <style> tags, and linked stylesheets, then clusters them by OKLCH hue to identify primary/secondary/accent colors. Returns the detected palette as ready-to-use design tokens (CSS variables and semantic mappings). Use this for competitive analysis, matching a client's existing brand, or reverse-engineering a design system. Requires DESIGNMCP_KEY.",
  {
    url: z.string().url().describe("Full URL to analyze, e.g. https://stripe.com"),
    outputFormat: z.enum(["tokens", "analysis", "both"]).optional()
      .describe("'tokens' = code-ready CSS variables. 'analysis' = human-readable color/font breakdown. 'both' = everything. Default: both"),
  },
  async ({ url, outputFormat = "both" }) => {
    requirePro();
    logger.info({ tool: "analyze_brand_url", url });
    const result = await analyzeBrandURL({ url, outputFormat });
    return { content: [{ type: "text" as const, text: result }] };
  }
);

// ─── 4. Generate Typography System [FREE] ────────────────────────────────────

server.tool(
  "generate_typography_system",
  "FREE · Generates a complete typography token system: display/body/mono font pairings from Google Fonts matched to the brand personality, a 9-step modular type scale (xs → 4xl) calculated from the chosen ratio, plus weight, line-height, and letter-spacing tokens. Returns a Google Fonts <link> tag, CSS variables, Tailwind config, and JSON.",
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

// ─── 5. Generate Shadow System [FREE] ────────────────────────────────────────

server.tool(
  "generate_shadow_system",
  "FREE · Generates an elevation shadow scale (xs → 2xl + inner) in four distinct styles: 'soft' (standard diffused), 'sharp' (hard-edge, like Figma/Notion components), 'diffuse' (large spread, minimal offset), or 'colored' (brand-tinted shadows like Vercel and Linear use). Returns CSS custom properties and Tailwind boxShadow config for light and/or dark mode.",
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

// ─── 6. Generate Spacing Scale [FREE] ────────────────────────────────────────

server.tool(
  "generate_spacing_scale",
  "FREE · Generates a spacing token system. The default (4px base, numeric naming) produces a Tailwind-compatible scale with fine-grained steps at small sizes and larger jumps at bigger sizes (4px→8px→12px…→96px→128px…→384px) — matching how real design systems handle space. Supports custom base units and t-shirt or descriptive naming conventions.",
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

// ─── 7. Generate Component Tokens [PRO] ───────────────────────────────────────

server.tool(
  "generate_component_tokens",
  "PRO · Generates semantic design tokens for specific UI components — Button, Input, Card, Badge, Modal, Tooltip, Navigation, Table, Alert, Avatar, Chip, Form. Covers all interactive states (default, hover, active, focus, disabled, error). Colors are derived from your brand color using the full OKLCH scale. Output as CSS custom properties or JSON. Requires DESIGNMCP_KEY.",
  {
    components: z.array(z.enum([
      "button", "input", "card", "badge", "modal", "tooltip",
      "navigation", "table", "form", "alert", "avatar", "chip",
    ])).describe("Components to generate tokens for"),
    brandColor: z.string().describe("Primary brand color as hex or name"),
    format: z.enum(["json", "css", "all"]).optional().describe("Output format. Default: all"),
  },
  async ({ components, brandColor, format = "all" }) => {
    requirePro();
    logger.info({ tool: "generate_component_tokens", components });
    const result = await generateComponentTokens({ components, brandColor, format });
    return { content: [{ type: "text" as const, text: result }] };
  }
);

// ─── 8. Check Accessibility [FREE] ───────────────────────────────────────────

server.tool(
  "check_accessibility",
  "FREE · Checks WCAG 2.1 contrast compliance for any number of color pairs in one call. Returns the exact contrast ratio, AA/AAA/AA-Large pass/fail for each pair, and — when a pair fails — automatically suggests the nearest accessible alternative color using direction-aware OKLCH adjustment (darkens for light backgrounds, lightens for dark ones).",
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

// ─── 9. Export Tokens [PRO] ───────────────────────────────────────────────────

server.tool(
  "export_tokens",
  "PRO · Converts a design token JSON object into any target platform format: CSS custom properties, SCSS variables, Tailwind v3 config (module.exports), Tailwind v4 @theme block, W3C DTCG format (compatible with Tokens Studio and Style Dictionary 4), Figma Variables import JSON, Swift Color extensions (SwiftUI), or Kotlin Color objects (Jetpack Compose). Accepts flat or nested token objects. Requires DESIGNMCP_KEY.",
  {
    tokens: z.record(z.any()).describe("Token object — flat key/value or nested"),
    targetFormat: z.enum(["css", "scss", "tailwind-v3", "tailwind-v4", "dtcg", "figma-variables", "style-dictionary", "swift", "kotlin", "json-flat"])
      .describe("Target output format. 'dtcg' = W3C Design Tokens Community Group format. 'figma-variables' = importable into Figma Variables panel."),
    prefix: z.string().optional().describe("Variable prefix, e.g. 'app' → --app-color-primary"),
  },
  async ({ tokens, targetFormat, prefix }) => {
    requirePro();
    logger.info({ tool: "export_tokens", targetFormat });
    const result = await exportTokens({ tokens, targetFormat, prefix });
    return { content: [{ type: "text" as const, text: result }] };
  }
);

// ─── 10. Generate Theme [PRO, AI-enhanced] ────────────────────────────────────

server.tool(
  "generate_theme",
  "PRO · One-shot: infers a complete brand personality from a natural language description and returns a full design system — OKLCH color scale, complementary secondary color, typography with Google Fonts, Tailwind-grade spacing, shadows, motion tokens, border radius, and component tokens — all in a single response. When ANTHROPIC_API_KEY is also set (AI tier), Claude selects the colors and personality with full design rationale instead of using keyword matching. Requires DESIGNMCP_KEY.",
  {
    description: z.string().describe(
      "Brand/product description. Examples: 'a fintech app for Gen Z investors', 'luxury skincare inspired by Japanese minimalism', 'open-source developer tool, dark and focused'"
    ),
    format: z.enum(["json", "css", "tailwind", "all"]).optional().describe("Output format. Default: all"),
    includeComponentTokens: z.boolean().optional()
      .describe("Include Button, Input, Card, Badge component tokens. Default: true"),
  },
  async ({ description, format = "all", includeComponentTokens = true }) => {
    requirePro();
    logger.info({ tool: "generate_theme", description: description.slice(0, 80), tier: getTier() });
    const result = await generateTheme({ description, format, includeComponentTokens });
    return { content: [{ type: "text" as const, text: result }] };
  }
);

// ─── 11. Generate Color Harmony [FREE] ───────────────────────────────────────

server.tool(
  "generate_color_harmony",
  "FREE · Generates a mathematically harmonious multi-color palette from a single base color using OKLCH hue rotation. Choose from: complementary (2 colors, maximum contrast), analogous (3 colors, natural cohesion), triadic (3 colors, vibrant balance), split-complementary (3 colors, softer than complementary), tetradic (4 colors, rich variety), or monochromatic (5 lightness variations of the same hue). Each color in the set comes with its full 11-step scale.",
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

// ─── 12. Audit Brand Colors [FREE] ───────────────────────────────────────────

server.tool(
  "audit_brand_colors",
  "FREE · Runs a professional design audit on a set of brand colors. Returns: a full WCAG contrast matrix (every color on every other color, AA/AAA rated), a color harmony classification (complementary, analogous, triadic, etc.) derived from OKLCH hue distances, an accessibility score (% of pairs passing AA), and specific actionable improvement suggestions. Use this when reviewing a client's existing palette or before shipping a design system.",
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

// ─── 13. Generate Design System File [PRO] ───────────────────────────────────

server.tool(
  "generate_design_system_file",
  "PRO · Generates four complete, copy-paste-ready files for a production design system: (1) globals.css — Tailwind v4 + shadcn/ui compatible file with OKLCH color variables, @theme inline block, dark mode, Google Fonts, and @layer base reset; (2) tokens.css — vanilla CSS with every token for Tailwind v3 projects; (3) tailwind.config.ts — Tailwind v3 config wired to those tokens; (4) tokens.ts — typed TypeScript constants for React/Vue/Svelte. Drop all four files into any project and the design system is live immediately. Requires DESIGNMCP_KEY.",
  {
    brandColor: z.string().describe("Primary brand color as hex or name"),
    brandName: z.string().describe("Brand/project name, used in file comments and token namespacing"),
    secondaryColor: z.string().optional().describe("Secondary color. Auto-generated as split-complementary if omitted."),
    personality: z.enum(["corporate", "startup", "creative", "luxury", "minimal", "playful"]).optional()
      .describe("Influences font pairing and token values. Default: startup"),
  },
  async ({ brandColor, brandName, secondaryColor, personality = "startup" }) => {
    requirePro();
    logger.info({ tool: "generate_design_system_file", brandColor, brandName });
    const result = await generateDesignSystemFile({ brandColor, brandName, secondaryColor, personality });
    return { content: [{ type: "text" as const, text: result }] };
  }
);

// ─── 14. Generate shadcn/ui Theme [FREE] ─────────────────────────────────────

server.tool(
  "generate_shadcn_theme",
  "FREE · Generates a complete shadcn/ui + Tailwind CSS v4 theme from any brand color. Outputs a drop-in globals.css with all shadcn CSS variables (--primary, --secondary, --muted, --accent, --destructive, --border, --input, --ring, --background, --foreground, plus 5 chart colors and border-radius scale) in perceptually-accurate OKLCH format, light AND dark mode, and the @theme inline block that wires them to Tailwind v4 utilities. Also includes a Tailwind v3 fallback. This is the fastest way to brand a shadcn/ui project — one tool call replaces an hour of manual theming work.",
  {
    brandColor: z.string().describe(
      "Your brand's primary color as hex (#6366f1), RGB, or description ('a warm coral'). This becomes --primary in the shadcn theme."
    ),
    radius: z.number().optional().describe(
      "Border radius base in rem. 0 = sharp (brutalist), 0.375 = tight, 0.625 = default shadcn, 1.0 = rounded, 1.5 = pill-heavy. Default: 0.625"
    ),
    accentColor: z.string().optional().describe(
      "Explicit accent color for the --accent variable. Auto-derived as analogous +30° if omitted."
    ),
  },
  async ({ brandColor, radius = 0.625, accentColor }) => {
    logger.info({ tool: "generate_shadcn_theme", brandColor });
    const result = await generateShadcnTheme({ brandColor, radius, accentColor });
    return { content: [{ type: "text" as const, text: result }] };
  }
);

// ─── 15. Generate Brand Identity [AI] ────────────────────────────────────────

server.tool(
  "generate_brand_identity",
  "AI · The highest-value tool in DesignMCP. Uses Claude to generate a comprehensive, immediately-actionable brand identity document in under 30 seconds — replacing 4–8 hours of brand strategy work. Output includes: (1) Brand Positioning — one-sentence statement, target audience, 3 differentiators, brand promise; (2) Brand Personality — 5 traits, archetype, tone of voice pairs; (3) Visual Direction — aesthetic description, 3 visual references, things to avoid; (4) Color Strategy — primary/secondary hex with full psychology rationale; (5) Typography Strategy — specific Google Font recommendations with hierarchy guidance; (6) Design Principles — 3–5 named principles with concrete examples; (7) Brand Voice — 3 taglines, do/don't word choices, microcopy samples. Requires DESIGNMCP_KEY + ANTHROPIC_API_KEY.",
  {
    brandName: z.string().describe("The brand or product name"),
    description: z.string().describe(
      "Detailed description of the product, audience, and goals. The more specific, the better the output. Examples: 'A B2B SaaS platform for construction project managers that replaces spreadsheets. Enterprise deals, $50k+ ACV. Audience: skeptical ops directors who hate change.' or 'A direct-to-consumer sleep supplement brand targeting burnt-out millennials in urban areas. Premium price point, science-backed positioning.'"
    ),
  },
  async ({ brandName, description }) => {
    requireAI();
    logger.info({ tool: "generate_brand_identity", brandName });
    const result = await generateBrandIdentity({ brandName, description });
    return { content: [{ type: "text" as const, text: result }] };
  }
);

// ─── Start ────────────────────────────────────────────────────────────────────

async function main() {
  try {
    if (process.env.PORT) {
      // MCPize / hosted: Streamable HTTP transport via Express
      const port = parseInt(process.env.PORT, 10);

      const transport = new StreamableHTTPServerTransport({
        sessionIdGenerator: undefined, // stateless — required for scale-to-zero hosting
      });

      await server.connect(transport);

      const app = express();
      // NOTE: Do NOT add express.json() — StreamableHTTPServerTransport reads the raw body stream itself

      // Single catch-all for MCP (POST/GET/DELETE) — no req.body pre-parsing
      app.all("/mcp", (req, res) => { transport.handleRequest(req, res); });

      // Health-check endpoint for MCPize infrastructure probes
      app.get("/health", (_req, res) => { res.json({ status: "ok", version: "2.2.0" }); });

      app.listen(port, () => {
        logger.info({ msg: `DesignMCP v2.2.0 running on HTTP :${port}`, tier: getTier() });
      });
    } else {
      // Local / npx / Claude Desktop: stdio transport
      const transport = new StdioServerTransport();
      await server.connect(transport);
      logger.info({ msg: `DesignMCP v2.2.0 running on stdio`, tier: getTier() });
    }
  } catch (err) {
    logger.error({ err, msg: "Failed to start DesignMCP server" });
    process.exit(1);
  }
}

main();
