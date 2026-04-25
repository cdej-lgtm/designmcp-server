/**
 * DesignMCP AI Layer
 * Wraps Anthropic SDK calls used by AI-powered tools.
 * All calls use prompt caching to minimise cost on repeated use.
 */

import Anthropic from "@anthropic-ai/sdk";

// ─── Shared system prompt (cached across every AI call) ───────────────────────

const SYSTEM_PROMPT = `You are a world-class brand strategist and design systems expert with 20+ years of experience at top agencies (Pentagram, Wolff Olins, Collins). You combine deep knowledge of color theory (OKLCH, color psychology, perceptual uniformity), typographic hierarchy, spacing systems, and brand strategy. Your output is always specific, immediately actionable, and grounded in both aesthetics and business goals. You never give generic advice — every recommendation is tailored to the exact product and audience described.`;

function getClient(): Anthropic {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY environment variable is not set.");
  return new Anthropic({ apiKey });
}

// ─── Theme AI analysis ────────────────────────────────────────────────────────

export interface AIThemeParams {
  primaryColor: string;
  secondaryColor: string;
  personality: "corporate" | "startup" | "creative" | "luxury" | "minimal" | "playful";
  typographyPersonality: "corporate" | "editorial" | "technical" | "humanist" | "geometric" | "luxury" | "playful";
  colorRationale: string;
  designDirection: string;
}

/**
 * Ask Claude to choose the ideal colors and personality for a brand description.
 * Returns null on any error so callers can fall back to deterministic logic.
 */
export async function analyzeThemeWithAI(description: string): Promise<AIThemeParams | null> {
  if (!process.env.ANTHROPIC_API_KEY) return null;

  try {
    const client = getClient();

    const response = await client.messages.create({
      model: "claude-opus-4-5",
      max_tokens: 512,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              // Cache the static instruction prefix
              text: `You are choosing design system parameters for a product. Consider color psychology, industry conventions, WCAG accessibility, and what makes this brand unique and memorable.\n\nReturn ONLY a valid JSON object — no markdown, no explanation, nothing else:\n{\n  "primaryColor": "#hexcolor",\n  "secondaryColor": "#hexcolor",\n  "personality": "corporate|startup|creative|luxury|minimal|playful",\n  "typographyPersonality": "corporate|editorial|technical|humanist|geometric|luxury|playful",\n  "colorRationale": "2 sentences explaining why these colors fit",\n  "designDirection": "1 sentence on overall aesthetic direction"\n}\n\nProduct description: `,
            },
            {
              type: "text",
              text: `"${description}"`,
            },
          ],
        },
      ],
    });

    const raw = response.content[0].type === "text" ? response.content[0].text.trim() : null;
    if (!raw) return null;

    // Strip markdown fences if the model adds them anyway
    const cleaned = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim();
    const parsed  = JSON.parse(cleaned) as AIThemeParams;

    // Basic validation
    if (!parsed.primaryColor?.startsWith("#")) return null;
    return parsed;
  } catch {
    return null; // Silent fallback — callers handle this
  }
}

// ─── Brand Identity AI generation ─────────────────────────────────────────────

/**
 * Generate a comprehensive brand identity document using Claude.
 * This is DesignMCP's highest-value AI feature — replaces 4–8 hours of
 * brand strategy work with a single tool call.
 */
export async function generateBrandIdentityWithAI(
  brandName: string,
  description: string,
): Promise<string> {
  const client = getClient(); // throws if no key

  const response = await client.messages.create({
    model: "claude-opus-4-5",
    max_tokens: 3000,
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: "user",
        content: [
          {
            type: "text",
            text: `Create a comprehensive, immediately-actionable brand identity document. Be specific — no generic advice. Every recommendation must be tailored to this exact product and audience.\n\nStructure the document exactly as follows:\n\n## 1. Brand Positioning\n- One-sentence positioning statement\n- Primary target audience (be specific: demographics, psychographics, job title if B2B)\n- 3 key differentiators from competitors\n- Brand promise\n\n## 2. Brand Personality\n- 5 personality traits (adjectives) with one-sentence explanation each\n- Brand archetype (Hero / Sage / Creator / etc.) with rationale\n- Tone of voice: 3 "we are / we are not" pairs\n\n## 3. Visual Direction\n- Overall aesthetic in 2 sentences\n- 3 specific visual references (existing brands, design movements, or aesthetics)\n- 3 things to explicitly avoid\n\n## 4. Color Strategy\n- Primary color: [exact hex] — full color psychology rationale\n- Secondary color: [exact hex] — how it complements primary\n- Neutral palette direction\n- Emotional associations and why they fit the brand\n\n## 5. Typography Strategy\n- Display font: [specific Google Font name] — rationale\n- Body font: [specific Google Font name] — rationale\n- Hierarchy guidance (when to use each weight)\n- Letter-spacing and line-height philosophy\n\n## 6. Design Principles\n3–5 named principles (like "Calm confidence" or "Precision over decoration") each with:\n- Name\n- 2-sentence explanation\n- One concrete design application example\n\n## 7. Brand Voice\n- 3 sample taglines or headlines that capture the voice\n- 5 "Do" examples (specific word choices, sentence structures)\n- 5 "Don't" examples\n- Sample microcopy for a primary CTA button\n\n---\nBrand name: ${brandName}\nDescription: `,
          },
          {
            type: "text",
            text: description,
          },
        ],
      },
    ],
  });

  return response.content[0].type === "text"
    ? response.content[0].text
    : "Error generating brand identity. Please try again.";
}

// ─── Palette storytelling ──────────────────────────────────────────────────────

/**
 * Ask Claude to explain WHY a generated palette works for the brand.
 * Appended to color palette outputs when ANTHROPIC_API_KEY is set.
 * Short call — uses minimal tokens.
 */
export async function explainPaletteWithAI(
  hexColor: string,
  brandContext: string,
): Promise<string | null> {
  if (!process.env.ANTHROPIC_API_KEY) return null;

  try {
    const client = getClient();
    const response = await client.messages.create({
      model: "claude-opus-4-5",
      max_tokens: 200,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: `In 2–3 sentences, explain why ${hexColor} is a strong primary brand color for: "${brandContext}". Cover color psychology and emotional association. Be specific, not generic.`,
        },
      ],
    });

    return response.content[0].type === "text" ? response.content[0].text.trim() : null;
  } catch {
    return null;
  }
}
