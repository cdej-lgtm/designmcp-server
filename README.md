# DesignMCP — Brand Intelligence & Design Token Server

> Give any LLM the design expertise of a senior design systems engineer and brand strategist.

**14 tools** across three tiers. From a one-line color input to a complete, production-ready design system in seconds.

[![npm version](https://img.shields.io/npm/v/@designmcp/server)](https://www.npmjs.com/package/@designmcp/server)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

---

## What DesignMCP does

Instead of an LLM giving you generic hex codes and hoping for the best, DesignMCP gives it:

- **OKLCH color science** — the same perceptual color engine used by Radix UI, shadcn/ui, and Tailwind v3/v4. Colors that actually look right across the full scale.
- **Real font pairings** — 7 personality profiles mapped to specific Google Fonts (Playfair Display, Cormorant Garamond, Outfit, etc.) with modular type scales.
- **Contrast-aware accessibility** — every generated palette is checked against WCAG 2.1 AA/AAA. Failing colors are auto-corrected.
- **Live URL analysis** — extract and reverse-engineer colors and fonts from any website's CSS.
- **AI brand strategy** — Claude generates a 7-section brand identity document: positioning, personality, color psychology, typography rationale, design principles, and brand voice.

---

## Quick start (free)

```json
{
  "mcpServers": {
    "designmcp": {
      "command": "npx",
      "args": ["-y", "@designmcp/server"]
    }
  }
}
```

6 free tools are available with no API key required. Try:

> *"Generate a color palette for #6366f1 with dark mode"*
> *"Audit these brand colors: #0ea5e9, #ffffff, #0f172a"*
> *"What typography system fits a luxury editorial brand?"*

---

## Tier breakdown

| Tool | Free | Pro | AI |
|------|:----:|:---:|:--:|
| `generate_color_palette` — 11-step OKLCH scale + dark mode | ✅ | ✅ | ✅ |
| `generate_typography_system` — Google Fonts + modular scale | ✅ | ✅ | ✅ |
| `generate_shadow_system` — 4 shadow styles, light + dark | ✅ | ✅ | ✅ |
| `generate_spacing_scale` — Tailwind-grade spacing tokens | ✅ | ✅ | ✅ |
| `check_accessibility` — WCAG AA/AAA with auto-fix suggestions | ✅ | ✅ | ✅ |
| `generate_color_harmony` — 6 harmony types, full OKLCH scales | ✅ | ✅ | ✅ |
| `audit_brand_colors` — contrast matrix + harmony + suggestions | ✅ | ✅ | ✅ |
| `generate_design_tokens` — complete token system in one call | 🔒 | ✅ | ✅ |
| `generate_component_tokens` — 12 UI components, all states | 🔒 | ✅ | ✅ |
| `export_tokens` — CSS, SCSS, Tailwind v3/v4, Swift, Kotlin | 🔒 | ✅ | ✅ |
| `analyze_brand_url` — live CSS color + font extraction | 🔒 | ✅ | ✅ |
| `generate_theme` — one-shot full design system from description | 🔒 | ✅ | ✅ |
| `generate_design_system_file` — 3 copy-paste files: CSS + Tailwind + TS | 🔒 | ✅ | ✅ |
| `generate_brand_identity` — **AI brand strategy doc** (7 sections) | 🔒 | 🔒 | ✅ |

**Free** — no configuration needed  
**Pro** — add `DESIGNMCP_KEY=dmcp_<your-key>` · [Get key →](https://designmcp.dev)  
**AI** — add `DESIGNMCP_KEY` + `ANTHROPIC_API_KEY` · [Get key →](https://designmcp.dev)

---

## Pro setup

```json
{
  "mcpServers": {
    "designmcp": {
      "command": "npx",
      "args": ["-y", "@designmcp/server"],
      "env": {
        "DESIGNMCP_KEY": "dmcp_your_key_here"
      }
    }
  }
}
```

---

## AI tier setup

```json
{
  "mcpServers": {
    "designmcp": {
      "command": "npx",
      "args": ["-y", "@designmcp/server"],
      "env": {
        "DESIGNMCP_KEY": "dmcp_your_key_here",
        "ANTHROPIC_API_KEY": "sk-ant-your_anthropic_key"
      }
    }
  }
}
```

With both keys, `generate_theme` automatically uses Claude to choose colors and personality with proper design rationale instead of keyword matching — and you unlock `generate_brand_identity`.

---

## Tool reference

### `generate_brand_identity` ✦ AI tier

The highest-value tool in DesignMCP. Replaces 4–8 hours of brand strategy work.

**Input:**
```
brandName: "Helix"
description: "A B2B SaaS platform for construction project managers.
  Enterprise deals, $50k+ ACV. Audience: skeptical ops directors
  who hate change and trust hard numbers over aesthetics."
```

**Output** (7 sections):
1. **Brand Positioning** — one-sentence statement, target audience, 3 differentiators, brand promise
2. **Brand Personality** — 5 named traits, brand archetype, 3 "we are / we are not" tone pairs
3. **Visual Direction** — 2-sentence aesthetic, 3 specific visual references, what to avoid
4. **Color Strategy** — primary/secondary hex with color psychology rationale
5. **Typography Strategy** — specific Google Fonts with hierarchy and spacing philosophy
6. **Design Principles** — 3–5 named principles with concrete application examples
7. **Brand Voice** — 3 taglines, do/don't word lists, sample CTA microcopy

---

### `generate_theme` ✦ Pro tier (AI-enhanced)

One-shot full design system from a natural language description.

```
description: "A fintech app for Gen Z investors. Mobile-first,
  casual but trustworthy. Competes with Robinhood."
```

Returns: OKLCH color scale, secondary color, Google Fonts, spacing, shadows, motion tokens, border radius, and component tokens in a single response.

When `ANTHROPIC_API_KEY` is set, Claude picks the exact colors and personality with full design rationale instead of using keyword matching.

---

### `generate_design_system_file` ✦ Pro tier

Generates three complete copy-paste files:

- **`tokens.css`** — every token as CSS custom properties (colors, dark mode, typography, spacing, shadows, motion, border radius)
- **`tailwind.config.ts`** — full Tailwind v3 config wired to those tokens
- **`tokens.ts`** — typed TypeScript constants for React/Vue/Svelte

```
brandColor: "#6366f1"
brandName: "Helix"
personality: "startup"
```

Drop all three files in and the design system is live.

---

### `analyze_brand_url` ✦ Pro tier

Fetches any live website and extracts its brand colors and fonts from inline styles, `<style>` tags, and linked stylesheets. Clusters chromatic colors by OKLCH hue proximity to identify primary, secondary, and accent roles.

```
url: "https://stripe.com"
outputFormat: "both"
```

Returns detected palette + generated design tokens ready for immediate use.

---

### `check_accessibility` ✦ Free

```
pairs: [
  { foreground: "#6366f1", background: "#ffffff", label: "CTA on white" },
  { foreground: "#ffffff", background: "#4f46e5", label: "White on brand" }
]
level: "AA"
suggestFixes: true
```

Returns exact contrast ratios, AA/AAA/AA-Large pass/fail, and direction-aware OKLCH color fixes for anything that fails.

---

### `audit_brand_colors` ✦ Free

```
colors: ["#6366f1", "#f59e0b", "#ffffff", "#0f172a"]
brandName: "Acme"
```

Full contrast matrix, harmony classification, accessibility score, and improvement suggestions.

---

### `generate_color_harmony` ✦ Free

6 harmony types from a single base color using OKLCH hue rotation:

| Type | Colors | Character |
|------|--------|-----------|
| `complementary` | 2 | Maximum contrast |
| `analogous` | 3 | Natural cohesion |
| `triadic` | 3 | Vibrant balance |
| `split-complementary` | 3 | Softer tension |
| `tetradic` | 4 | Rich variety |
| `monochromatic` | 5 | Single hue, 5 lightness stops |

Each color includes its full 11-step OKLCH scale.

---

## Why OKLCH?

Most design token tools use HSL or HSB. These color spaces are not perceptually uniform — two colors at the same "lightness" in HSL can look dramatically different in brightness. OKLCH (from Björn Ottosson's OKLab) solves this: equal steps in OKLCH look equal to the human eye.

This is why Radix UI, shadcn/ui, and Tailwind's new color system all use OKLCH or a perceptual approximation. DesignMCP brings this directly to LLM-assisted workflows.

---

## Works with

- **Claude Desktop** (claude.ai/download)
- **Cursor** (MCP settings)
- **Windsurf** (MCP config)
- **Continue.dev**
- Any MCP-compatible client

---

## License

MIT — free to use, modify, and distribute.  
Commercial support and managed hosting available at [designmcp.dev](https://designmcp.dev).
