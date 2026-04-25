/**
 * DesignMCP Tier Gating
 *
 * Free  — No env vars required. Core color/typography tools always work.
 * Pro   — DESIGNMCP_KEY starting with "dmcp_". Unlocks the full token pipeline,
 *         URL analysis, component tokens, and export formats.
 * AI    — DESIGNMCP_KEY + ANTHROPIC_API_KEY. Unlocks AI-powered brand intelligence
 *         (generate_brand_identity, AI-enhanced generate_theme).
 *
 * Get a key at https://designmcp.dev
 */

export type Tier = "free" | "pro" | "ai";

// ─── Tier detection ───────────────────────────────────────────────────────────

export function getTier(): Tier {
  const hasProKey = process.env.DESIGNMCP_KEY?.startsWith("dmcp_") ?? false;
  const hasAIKey  = !!process.env.ANTHROPIC_API_KEY;

  if (hasProKey && hasAIKey) return "ai";
  if (hasProKey)             return "pro";
  return "free";
}

// ─── Guards (throw MCP-safe error messages) ───────────────────────────────────

const PRO_MSG = [
  "🔒 **Pro tier required.**",
  "",
  "This tool is part of the DesignMCP Pro tier.",
  "Add `DESIGNMCP_KEY=dmcp_<your-key>` to your MCP config to unlock:",
  "• Full design token systems (colors + typography + spacing + shadows)",
  "• Component tokens for 12 UI components",
  "• Multi-platform export (CSS, SCSS, Tailwind v3/v4, Swift, Kotlin)",
  "• Live brand URL analysis",
  "• Complete copy-paste design system files",
  "",
  "👉 Get your key at https://designmcp.dev — 7-day free trial.",
].join("\n");

const AI_MSG = [
  "🔒 **AI tier required.**",
  "",
  "This tool uses Claude to generate real brand strategy — positioning, personality,",
  "visual direction, typography rationale, and copywriting — in under 30 seconds.",
  "",
  "To unlock, add both keys to your MCP config:",
  "  `DESIGNMCP_KEY=dmcp_<your-key>`",
  "  `ANTHROPIC_API_KEY=sk-ant-...`",
  "",
  "👉 Get your DesignMCP key at https://designmcp.dev",
].join("\n");

const AI_KEY_ONLY_MSG = [
  "🔒 **ANTHROPIC_API_KEY missing.**",
  "",
  "You have a Pro key but this tool also needs an Anthropic API key.",
  "Add `ANTHROPIC_API_KEY=sk-ant-...` to your MCP server config to enable AI tools.",
].join("\n");

export function requirePro(): void {
  const tier = getTier();
  if (tier === "free") throw new Error(PRO_MSG);
}

export function requireAI(): void {
  const tier = getTier();
  if (tier === "free")  throw new Error(AI_MSG);
  if (tier === "pro")   throw new Error(AI_KEY_ONLY_MSG);
}

// ─── Informational (used in tool descriptions) ────────────────────────────────

export function tierLabel(): string {
  const t = getTier();
  return t === "ai" ? "AI" : t === "pro" ? "Pro" : "Free";
}
