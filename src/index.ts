#!/usr/bin/env node
/**
 * DesignMCP — Brand Intelligence & Design Token Server
 * The AI-native design system for every LLM workflow.
 *
 * @version 1.0.0
 * @license MIT
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

import { generateColorPalette } from "./tools/colorPalette.js";
import { generateDesignTokens } from "./tools/designTokens.js";
import { analyzeBrandURL } from "./tools/brandAnalyzer.js";
import { generateTypographySystem } from "./tools/typography.js";
import { generateShadowSystem } from "./tools/shadows.js";
import { generateSpacingScale } from "./tools/spacing.js";
import { generateComponentTokens } from "./tools/componentTokens.js";
import { exportTokens } from "./tools/exportTokens.js";
import { checkAccessibility } from "./tools/accessibility.js";
import { generateTheme } from "./tools/themeGenerator.js";
import { SERVER_INFO, TOOL_ANNOTATIONS } from "./lib/constants.js";
import { logger } from "./lib/logger.js";

// ─── Server Bootstrap ─────────────────────────────────────────────────────────

const server = new McpServer({
  name: SERVER_INFO.name,
  version: SERVER_INFO.version,
});

// ─── Tool: Generate Color Palette ─────────────────────────────────────────────

server.tool(
  "generate_color_palette",
  "Generate a complete, WCAG-accessible color palette from a brand color or description. Returns primitive tokens (50–950 scale), semantic tokens (primary, surface, error states), and dark mode variants. Output formats: CSS variables, Tailwind config, JSON design tokens.",
  {
    input: z.string().describe(
      "Brand color as hex (#4F46E5), RGB (rgb(79,70,229)), color name ('midnight blue'), or description ('a warm forest green for an eco brand')"
    ),
    style: z.enum(["professional", "playful", "minimal", "bold", "earthy", "luxury"]).optional().describe(
      "Brand personality that influences tonal balance and accent selection. Default: professional"
    ),
    darkMode: z.boolean().optional().describe(
      "Generate dark mode token variants alongside light mode. Default: true"
    ),
    format: z.enum(["json", "css", "tailwind", "all"]).optional().describe(
      "Output format. 'all' returns CSS variables, Tailwind config, and JSON simultaneously. Default: all"
    ),
  },
  async ({ input, style = "professional", darkMode = true, format = "all" }) => {
    logger.info({ tool: "generate_color_palette", input, style });
    const result = await generateColorPalette({ input, style, darkMode, format });
    return {
      content: [{ type: "text", text: result }],
    };
  },
  TOOL_ANNOTATIONS.readOnly
);

// ─── Tool: Generate Full Design Token System ──────────────────────────────────

server.tool(
  "generate_design_tokens",
  "Generate a complete, production-ready design token system. Includes color scales, typography, spacing, shadows, border radii, and motion tokens — all output as CSS variables, Tailwind config, and/or JSON. Ideal for bootstrapping a new design system or standardizing an existing one.",
  {
    brandColor: z.string().describe("Primary brand color as hex, RGB, or descriptive name"),
    brandName: z.string().optional().describe("Brand name for token namespace (e.g. 'acme' produces --acme-color-primary)"),
    secondaryColor: z.string().optional().describe("Secondary brand color. Auto-generated as complement if omitted."),
    personality: z.enum(["corporate", "startup", "creative", "luxury", "minimal", "playful"]).optional().describe(
      "Brand personality influences font pairings, spacing scale density, and shadow style"
    ),
    includeMotion: z.boolean().optional().describe("Include transition/animation timing tokens. Default: true"),
    format: z.enum(["json", "css", "tailwind", "all"]).optional().describe("Output format. Default: all"),
  },
  async ({ brandColor, brandName = "brand", secondaryColor, personality = "startup", includeMotion = true, format = "all" }) => {
    logger.info({ tool: "generate_design_tokens", brandColor, brandName });
    const result = await generateDesignTokens({ brandColor, brandName, secondaryColor, personality, includeMotion, format });
    return {
      content: [{ type: "text", text: result }],
    };
  },
  TOOL_ANNOTATIONS.readOnly
);

// ─── Tool: Analyze Brand from URL ─────────────────────────────────────────────

server.tool(
  "analyze_brand_url",
  "Extract and analyze design decisions from any live website URL. Returns detected color palette, typography choices, spacing patterns, and a reverse-engineered design token system ready to use in code. Perfect for competitive analysis or recreating an aesthetic.",
  {
    url: z.string().url().describe("Full URL of the website to analyze (e.g. https://stripe.com)"),
    outputFormat: z.enum(["tokens", "analysis", "both"]).optional().describe(
      "'tokens' returns code-ready design tokens. 'analysis' returns human-readable insights. 'both' returns everything. Default: both"
    ),
  },
  async ({ url, outputFormat = "both" }) => {
    logger.info({ tool: "analyze_brand_url", url });
    const result = await analyzeBrandURL({ url, outputFormat });
    return {
      content: [{ type: "text", text: result }],
    };
  },
  TOOL_ANNOTATIONS.readOnly
);

// ─── Tool: Generate Typography System ─────────────────────────────────────────

server.tool(
  "generate_typography_system",
  "Generate a complete, harmonious typography system with scale, line-height, letter-spacing, and font-weight tokens. Suggests Google Fonts or system font pairings that match your brand personality. Output includes CSS variables and Tailwind typography config.",
  {
    personality: z.enum(["corporate", "editorial", "technical", "humanist", "geometric", "luxury", "playful"]).describe(
      "Typography personality determines display/body font pairing and scale rhythm"
    ),
    baseSize: z.number().optional().describe("Base font size in px. Default: 16"),
    scaleRatio: z.enum(["minor-third", "major-third", "perfect-fourth", "golden"]).optional().describe(
      "Modular scale ratio. golden (1.618) for editorial, perfect-fourth (1.333) for UI. Default: perfect-fourth"
    ),
    brandName: z.string().optional().describe("Brand namespace for token naming"),
    format: z.enum(["json", "css", "tailwind", "all"]).optional().describe("Output format. Default: all"),
  },
  async ({ personality, baseSize = 16, scaleRatio = "perfect-fourth", brandName = "brand", format = "all" }) => {
    logger.info({ tool: "generate_typography_system", personality });
    const result = await generateTypographySystem({ personality, baseSize, scaleRatio, brandName, format });
    return {
      content: [{ type: "text", text: result }],
    };
  },
  TOOL_ANNOTATIONS.readOnly
);

// ─── Tool: Generate Shadow System ─────────────────────────────────────────────

server.tool(
  "generate_shadow_system",
  "Generate a complete elevation shadow system (xs through 2xl) tuned to light or dark mode. Uses perceptual shadow techniques (colored shadows, soft vs hard). Returns CSS custom properties and Tailwind boxShadow config.",
  {
    mode: z.enum(["light", "dark", "both"]).optional().describe("Theme mode. Default: both"),
    style: z.enum(["sharp", "soft", "diffuse", "colored"]).optional().describe(
      "Shadow style. 'colored' uses brand-tinted shadows (like Vercel/Linear). Default: soft"
    ),
    brandColor: z.string().optional().describe("Brand color for colored shadows. Hex or descriptive name."),
    format: z.enum(["json", "css", "tailwind", "all"]).optional().describe("Output format. Default: all"),
  },
  async ({ mode = "both", style = "soft", brandColor, format = "all" }) => {
    logger.info({ tool: "generate_shadow_system", mode, style });
    const result = await generateShadowSystem({ mode, style, brandColor, format });
    return {
      content: [{ type: "text", text: result }],
    };
  },
  TOOL_ANNOTATIONS.readOnly
);

// ─── Tool: Generate Spacing Scale ─────────────────────────────────────────────

server.tool(
  "generate_spacing_scale",
  "Generate a harmonious spacing scale system using a base unit and multiplier. Returns tokens for margin, padding, gap, and layout spacing. Compatible with 4px, 8px, or custom base grids. Output as CSS variables, Tailwind, or JSON.",
  {
    baseUnit: z.number().optional().describe("Base spacing unit in px. Default: 4 (4px grid)"),
    steps: z.number().optional().describe("Number of scale steps to generate. Default: 16"),
    naming: z.enum(["numeric", "t-shirt", "descriptive"]).optional().describe(
      "Token naming convention. 'numeric' (space-4), 't-shirt' (space-sm), 'descriptive' (space-compact). Default: numeric"
    ),
    format: z.enum(["json", "css", "tailwind", "all"]).optional().describe("Output format. Default: all"),
  },
  async ({ baseUnit = 4, steps = 16, naming = "numeric", format = "all" }) => {
    logger.info({ tool: "generate_spacing_scale", baseUnit });
    const result = await generateSpacingScale({ baseUnit, steps, naming, format });
    return {
      content: [{ type: "text", text: result }],
    };
  },
  TOOL_ANNOTATIONS.readOnly
);

// ─── Tool: Generate Component Tokens ──────────────────────────────────────────

server.tool(
  "generate_component_tokens",
  "Generate semantic design tokens for specific UI components (Button, Input, Card, Badge, Modal, etc.). Includes all states: default, hover, active, focus, disabled, and error. Uses your brand tokens as the foundation.",
  {
    components: z.array(z.enum([
      "button", "input", "card", "badge", "modal", "tooltip",
      "navigation", "table", "form", "alert", "avatar", "chip"
    ])).describe("List of components to generate tokens for"),
    brandColor: z.string().describe("Primary brand color as hex or name"),
    format: z.enum(["json", "css", "all"]).optional().describe("Output format. Default: all"),
  },
  async ({ components, brandColor, format = "all" }) => {
    logger.info({ tool: "generate_component_tokens", components });
    const result = await generateComponentTokens({ components, brandColor, format });
    return {
      content: [{ type: "text", text: result }],
    };
  },
  TOOL_ANNOTATIONS.readOnly
);

// ─── Tool: Check Accessibility ────────────────────────────────────────────────

server.tool(
  "check_accessibility",
  "Check WCAG 2.1 AA/AAA contrast compliance for any color combination. Returns contrast ratio, compliance level, and suggests accessible alternatives if the pair fails. Bulk-check entire palettes in one call.",
  {
    pairs: z.array(z.object({
      foreground: z.string().describe("Foreground color (text/icon) as hex"),
      background: z.string().describe("Background color as hex"),
      label: z.string().optional().describe("Human label for this pair (e.g. 'primary button text on brand bg')"),
    })).describe("One or more foreground/background color pairs to check"),
    level: z.enum(["AA", "AAA"]).optional().describe("WCAG compliance level to target. Default: AA"),
    suggestFixes: z.boolean().optional().describe("Suggest accessible alternative colors for failing pairs. Default: true"),
  },
  async ({ pairs, level = "AA", suggestFixes = true }) => {
    logger.info({ tool: "check_accessibility", pairCount: pairs.length });
    const result = await checkAccessibility({ pairs, level, suggestFixes });
    return {
      content: [{ type: "text", text: result }],
    };
  },
  TOOL_ANNOTATIONS.readOnly
);

// ─── Tool: Export Tokens ──────────────────────────────────────────────────────

server.tool(
  "export_tokens",
  "Transform design token JSON into any target format: CSS custom properties, Tailwind v3/v4 config, SCSS variables, Swift (iOS), Kotlin (Android), or Style Dictionary format. Accepts raw JSON and outputs production-ready code for any platform.",
  {
    tokens: z.record(z.any()).describe("Design token object in W3C Design Token format or flat key/value pairs"),
    targetFormat: z.enum(["css", "scss", "tailwind-v3", "tailwind-v4", "style-dictionary", "swift", "kotlin", "json-flat"]).describe(
      "Output format for the tokens"
    ),
    prefix: z.string().optional().describe("CSS variable prefix (e.g. 'app' → --app-color-primary). Default: none"),
  },
  async ({ tokens, targetFormat, prefix }) => {
    logger.info({ tool: "export_tokens", targetFormat });
    const result = await exportTokens({ tokens, targetFormat, prefix });
    return {
      content: [{ type: "text", text: result }],
    };
  },
  TOOL_ANNOTATIONS.readOnly
);

// ─── Tool: Generate Complete Theme ────────────────────────────────────────────

server.tool(
  "generate_theme",
  "One-shot: generate a complete, production-ready design theme from a single brand description. Returns a full token system covering colors, typography, spacing, shadows, border radius, and motion — all in one response. The fastest path from idea to design system.",
  {
    description: z.string().describe(
      "Brand or product description. Be as specific or vague as you like. Examples: 'a fintech app for Gen Z', 'luxe skincare brand inspired by Japanese minimalism', 'open-source developer tool, dark and technical'"
    ),
    format: z.enum(["json", "css", "tailwind", "all"]).optional().describe("Output format. Default: all"),
    includeComponentTokens: z.boolean().optional().describe(
      "Include component-level tokens for Button, Input, Card, and Badge. Default: true"
    ),
  },
  async ({ description, format = "all", includeComponentTokens = true }) => {
    logger.info({ tool: "generate_theme", description: description.slice(0, 80) });
    const result = await generateTheme({ description, format, includeComponentTokens });
    return {
      content: [{ type: "text", text: result }],
    };
  },
  TOOL_ANNOTATIONS.readOnly
);

// ─── Resources ────────────────────────────────────────────────────────────────

server.resource(
  "design-system-guide",
  "designmcp://guide",
  { mimeType: "text/markdown" },
  async () => ({
    contents: [{
      uri: "designmcp://guide",
      mimeType: "text/markdown",
      text: SERVER_INFO.guide,
    }],
  })
);

server.resource(
  "token-naming-conventions",
  "designmcp://conventions",
  { mimeType: "text/markdown" },
  async () => ({
    contents: [{
      uri: "designmcp://conventions",
      mimeType: "text/markdown",
      text: SERVER_INFO.conventions,
    }],
  })
);

// ─── Start ────────────────────────────────────────────────────────────────────

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  logger.info("DesignMCP server running on stdio");
}

main().catch((err) => {
  logger.error({ err }, "Fatal error starting DesignMCP server");
  process.exit(1);
});
