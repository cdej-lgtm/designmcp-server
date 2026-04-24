#!/usr/bin/env node
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
} from "./tools/allTools.js";
import { SERVER_INFO } from "./lib/constants.js";
import { logger } from "./lib/logger.js";

const server = new McpServer({
  name: SERVER_INFO.name,
  version: SERVER_INFO.version,
});

server.tool("generate_color_palette",
  "Generate a complete WCAG-accessible color palette from a brand color or description. Returns 11-step scale, semantic tokens, dark mode variants. Output: CSS variables, Tailwind config, JSON.",
  {
    input: z.string().describe("Brand color as hex (#4F46E5), RGB, color name, or description"),
    style: z.enum(["professional","playful","minimal","bold","earthy","luxury"]).optional(),
    darkMode: z.boolean().optional(),
    format: z.enum(["json","css","tailwind","all"]).optional(),
  },
  async ({ input, style="professional", darkMode=true, format="all" }) => {
    logger.info({ tool: "generate_color_palette", input });
    const result = await generateColorPalette({ input, style, darkMode, format });
    return { content: [{ type: "text" as const, text: result }] };
  }
);

server.tool("generate_design_tokens",
  "Generate a complete design token system: color, typography, spacing, shadows, motion. All from a single brand color.",
  {
    brandColor: z.string().describe("Primary brand color as hex or name"),
    brandName: z.string().optional(),
    secondaryColor: z.string().optional(),
    personality: z.enum(["corporate","startup","creative","luxury","minimal","playful"]).optional(),
    includeMotion: z.boolean().optional(),
    format: z.enum(["json","css","tailwind","all"]).optional(),
  },
  async ({ brandColor, brandName="brand", secondaryColor, personality="startup", includeMotion=true, format="all" }) => {
    logger.info({ tool: "generate_design_tokens", brandColor });
    const result = await generateDesignTokens({ brandColor, brandName, secondaryColor, personality, includeMotion, format });
    return { content: [{ type: "text" as const, text: result }] };
  }
);

server.tool("analyze_brand_url",
  "Extract and analyze design decisions from any live website URL.",
  {
    url: z.string().url().describe("Full URL of website to analyze"),
    outputFormat: z.enum(["tokens","analysis","both"]).optional(),
  },
  async ({ url, outputFormat="both" }) => {
    logger.info({ tool: "analyze_brand_url", url });
    const result = await analyzeBrandURL({ url, outputFormat });
    return { content: [{ type: "text" as const, text: result }] };
  }
);

server.tool("generate_typography_system",
  "Generate a complete typography system with scale, line-height, letter-spacing tokens and Google Fonts pairings.",
  {
    personality: z.enum(["corporate","editorial","technical","humanist","geometric","luxury","playful"]),
    baseSize: z.number().optional(),
    scaleRatio: z.enum(["minor-third","major-third","perfect-fourth","golden"]).optional(),
    brandName: z.string().optional(),
    format: z.enum(["json","css","tailwind","all"]).optional(),
  },
  async ({ personality, baseSize=16, scaleRatio="perfect-fourth", brandName="brand", format="all" }) => {
    logger.info({ tool: "generate_typography_system", personality });
    const result = await generateTypographySystem({ personality, baseSize, scaleRatio, brandName, format });
    return { content: [{ type: "text" as const, text: result }] };
  }
);

server.tool("generate_shadow_system",
  "Generate elevation shadow system for light and dark mode.",
  {
    mode: z.enum(["light","dark","both"]).optional(),
    style: z.enum(["sharp","soft","diffuse","colored"]).optional(),
    brandColor: z.string().optional(),
    format: z.enum(["json","css","tailwind","all"]).optional(),
  },
  async ({ mode="both", style="soft", brandColor, format="all" }) => {
    logger.info({ tool: "generate_shadow_system" });
    const result = await generateShadowSystem({ mode, style, brandColor, format });
    return { content: [{ type: "text" as const, text: result }] };
  }
);

server.tool("generate_spacing_scale",
  "Generate a harmonious spacing scale on a 4px grid.",
  {
    baseUnit: z.number().optional(),
    steps: z.number().optional(),
    naming: z.enum(["numeric","t-shirt","descriptive"]).optional(),
    format: z.enum(["json","css","tailwind","all"]).optional(),
  },
  async ({ baseUnit=4, steps=16, naming="numeric", format="all" }) => {
    logger.info({ tool: "generate_spacing_scale" });
    const result = await generateSpacingScale({ baseUnit, steps, naming, format });
    return { content: [{ type: "text" as const, text: result }] };
  }
);

server.tool("generate_component_tokens",
  "Generate semantic design tokens for UI components: button, input, card, badge, modal, alert.",
  {
    components: z.array(z.enum(["button","input","card","badge","modal","tooltip","navigation","table","form","alert","avatar","chip"])),
    brandColor: z.string(),
    format: z.enum(["json","css","all"]).optional(),
  },
  async ({ components, brandColor, format="all" }) => {
    logger.info({ tool: "generate_component_tokens" });
    const result = await generateComponentTokens({ components, brandColor, format });
    return { content: [{ type: "text" as const, text: result }] };
  }
);

server.tool("check_accessibility",
  "Check WCAG 2.1 AA/AAA contrast compliance for color pairs. Suggests accessible alternatives for failing pairs.",
  {
    pairs: z.array(z.object({
      foreground: z.string(),
      background: z.string(),
      label: z.string().optional(),
    })),
    level: z.enum(["AA","AAA"]).optional(),
    suggestFixes: z.boolean().optional(),
  },
  async ({ pairs, level="AA", suggestFixes=true }) => {
    logger.info({ tool: "check_accessibility" });
    const result = await checkAccessibility({ pairs, level, suggestFixes });
    return { content: [{ type: "text" as const, text: result }] };
  }
);

server.tool("export_tokens",
  "Transform design token JSON into CSS, SCSS, Tailwind v3/v4, Swift, or Kotlin.",
  {
    tokens: z.record(z.any()),
    targetFormat: z.enum(["css","scss","tailwind-v3","tailwind-v4","style-dictionary","swift","kotlin","json-flat"]),
    prefix: z.string().optional(),
  },
  async ({ tokens, targetFormat, prefix }) => {
    logger.info({ tool: "export_tokens" });
    const result = await exportTokens({ tokens, targetFormat, prefix });
    return { content: [{ type: "text" as const, text: result }] };
  }
);

server.tool("generate_theme",
  "One-shot: generate a complete design theme from a brand description.",
  {
    description: z.string(),
    format: z.enum(["json","css","tailwind","all"]).optional(),
    includeComponentTokens: z.boolean().optional(),
  },
  async ({ description, format="all", includeComponentTokens=true }) => {
    logger.info({ tool: "generate_theme" });
    const result = await generateTheme({ description, format, includeComponentTokens });
    return { content: [{ type: "text" as const, text: result }] };
  }
);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  logger.info("DesignMCP server running");
}

main().catch((err) => {
  logger.error({ err }, "Fatal error");
  process.exit(1);
});
