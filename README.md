# DesignMCP — Design System & Brand Intelligence MCP Server

> **The** MCP server for design. shadcn/ui theming, OKLCH color science, AI brand strategy — directly inside Claude, Cursor, and Windsurf.

**15 tools** · **3 tiers** · Zero design background required.

[![npm version](https://img.shields.io/npm/v/@designmcp/server)](https://www.npmjs.com/package/@designmcp/server)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![MCP Compatible](https://img.shields.io/badge/MCP-Compatible-blue)](https://modelcontextprotocol.io)

---

## The problem this solves

Every developer building a product needs a design system. The options are:

- **Hire a designer** → $2,000–$20,000 minimum for a basic brand identity
- **Do it yourself** → 8–20 hours of color theory, typography research, token naming, dark mode math
- **Use DesignMCP** → One tool call. Production-ready output.

DesignMCP gives any LLM the expertise of a senior design systems engineer and brand strategist. You describe what you're building; it outputs production-ready CSS, Tailwind config, and design tokens — with the color science, font pairings, and WCAG compliance already done.

---

## Quick start (free — no key required)

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

Try it immediately:

> *"Generate a shadcn/ui theme for my brand color #6366f1"*
> *"Create a color palette for a luxury skincare brand, warm gold tones"*
> *"Audit these colors for WCAG compliance: #4f46e5, #ffffff, #0f172a"*
> *"What typography system fits a fintech product?"*

---

## Pricing

| | Free | Pro | Agency |
|--|:----:|:---:|:------:|
| Price | $0 | **$29/mo** | **$99/mo** |
| Annual | — | $290/yr | $990/yr |
| Seats | 1 | 1 | Up to 5 |
| `generate_shadcn_theme` | ✅ | ✅ | ✅ |
| `generate_color_palette` | ✅ | ✅ | ✅ |
| `generate_typography_system` | ✅ | ✅ | ✅ |
| `generate_shadow_system` | ✅ | ✅ | ✅ |
| `generate_spacing_scale` | ✅ | ✅ | ✅ |
| `check_accessibility` | ✅ | ✅ | ✅ |
| `generate_color_harmony` | ✅ | ✅ | ✅ |
| `audit_brand_colors` | ✅ | ✅ | ✅ |
| `generate_design_tokens` (full system) | 🔒 | ✅ | ✅ |
| `generate_component_tokens` (12 components) | 🔒 | ✅ | ✅ |
| `export_tokens` (CSS/SCSS/Swift/Kotlin/DTCG/Figma) | 🔒 | ✅ | ✅ |
| `analyze_brand_url` (live CSS extraction) | 🔒 | ✅ | ✅ |
| `generate_theme` (one-shot full system) | 🔒 | ✅ | ✅ |
| `generate_design_system_file` (4 files) | 🔒 | ✅ | ✅ |
| `generate_brand_identity` (AI brand strategy) | 🔒 | 🔒 | ✅ |

👉 **[Get your key at designmcp.dev](https://designmcp.dev)** — 7-day free trial on Pro and Agency

---

## Setup

### Pro
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

### Agency (AI-powered brand strategy)
```json
{
  "mcpServers": {
    "designmcp": {
      "command": "npx",
      "args": ["-y", "@designmcp/server"],
      "env": {
        "DESIGNMCP_KEY": "dmcp_your_key_here",
        "ANTHROPIC_API_KEY": "sk-ant-your_key"
      }
    }
  }
}
```

---

## Tool reference

### `generate_shadcn_theme` ✦ Free · Most popular

The fastest way to brand a shadcn/ui project. One call produces a complete `globals.css` with every shadcn CSS variable (`--primary`, `--secondary`, `--muted`, `--accent`, `--destructive`, `--border`, `--input`, `--ring`, `--background`, `--foreground`, 5 chart colors, radius scale) in **OKLCH format**, with light AND dark mode, fully compatible with **Tailwind CSS v4** (`@theme inline` block included) and Tailwind v3 (fallback provided).

```
brandColor: "#6366f1"
radius: 0.625
```

Drop the output into `src/app/globals.css` and every shadcn/ui component immediately uses your brand color.

**Why OKLCH?** shadcn/ui migrated to OKLCH in Tailwind v4. HSL values cause perceptual inconsistencies — a color at 50% HSL lightness does not look 50% as bright to the human eye. OKLCH is perceptually uniform, which is why Radix UI, shadcn/ui, and Tailwind v4 all use it.

---

### `generate_brand_identity` ✦ Agency tier

Replaces 4–8 hours of brand strategy work. Uses Claude to generate a comprehensive, immediately-actionable document:

```
brandName: "Helix"
description: "B2B SaaS for construction ops directors. Enterprise deals,
  $50k+ ACV. Skeptical audience that trusts hard numbers, not aesthetics."
```

**Output (7 sections):**
1. **Brand Positioning** — one-sentence statement, specific target audience, 3 differentiators, brand promise
2. **Brand Personality** — 5 named traits, brand archetype, 3 "we are / we are not" tone pairs
3. **Visual Direction** — 2-sentence aesthetic, 3 real visual references, what to avoid
4. **Color Strategy** — primary + secondary hex with color psychology rationale for this specific brand
5. **Typography Strategy** — specific Google Fonts, hierarchy guidance, letter-spacing philosophy
6. **Design Principles** — 3–5 named principles with concrete application examples
7. **Brand Voice** — 3 taglines, do/don't word lists, sample CTA microcopy

---

### `generate_theme` ✦ Pro (AI-enhanced on Agency)

One-shot full design system from a natural language description. Returns OKLCH color scale, secondary color, Google Fonts, spacing, shadows, motion tokens, border radius, and component tokens in a single response.

```
description: "A fintech app for Gen Z investors. Mobile-first, casual but trustworthy."
```

On Agency tier, Claude picks the colors with design rationale instead of keyword matching.

---

### `generate_design_system_file` ✦ Pro

Four production-ready files:

| File | Purpose |
|------|---------|
| `globals.css` | Tailwind v4 + shadcn/ui — drop into Next.js/Vite/Astro |
| `tokens.css` | Vanilla CSS tokens for Tailwind v3 projects |
| `tailwind.config.ts` | Complete Tailwind v3 config |
| `tokens.ts` | Typed TypeScript constants for React/Vue/Svelte |

```
brandColor: "#6366f1"
brandName: "Helix"
personality: "startup"
```

---

### `export_tokens` ✦ Pro

Convert any token set to any platform format:

| Format | Use case |
|--------|---------|
| `css` | CSS custom properties |
| `scss` | SCSS variables |
| `tailwind-v3` | `module.exports` config |
| `tailwind-v4` | `@theme {}` block |
| `dtcg` | W3C Design Tokens (Tokens Studio, Style Dictionary 4) |
| `figma-variables` | Figma Variables panel import JSON |
| `swift` | SwiftUI Color extensions |
| `kotlin` | Jetpack Compose Color objects |

---

### `analyze_brand_url` ✦ Pro

Fetch any live website and extract its brand colors and fonts from CSS. Clusters chromatic colors by OKLCH hue to identify primary, secondary, and accent roles. Returns ready-to-use design tokens.

```
url: "https://stripe.com"
outputFormat: "both"
```

---

### `check_accessibility` ✦ Free

WCAG 2.1 AA/AAA contrast checking with auto-fix suggestions. When a pair fails, it finds the nearest passing color using direction-aware OKLCH adjustment (darkens on light backgrounds, lightens on dark).

---

### `audit_brand_colors` ✦ Free

Design audit for any set of brand colors: full contrast matrix (AA/AAA/AA-Large), harmony classification from OKLCH hue distances, accessibility score, and specific suggestions.

---

### `generate_color_harmony` ✦ Free

6 harmony types from one base color using OKLCH hue rotation. Each color comes with its full 11-step scale.

---

## What makes this different

| Feature | DesignMCP | Other design MCPs |
|---------|:---------:|:-----------------:|
| Monetized / actively maintained | ✅ | ❌ Most are abandoned free repos |
| OKLCH color science | ✅ | ❌ HSL or no math |
| shadcn/ui + Tailwind v4 native | ✅ | ❌ |
| W3C DTCG export | ✅ | ❌ |
| Figma Variables export | ✅ | ❌ |
| AI brand identity (Claude-powered) | ✅ | ❌ |
| WCAG auto-fix suggestions | ✅ | ❌ |
| Live URL brand extraction | ✅ | Partially |
| Multi-platform (Swift, Kotlin) | ✅ | ❌ |

---

## Who uses DesignMCP

**Solo developers / indie hackers** — You're building a product, you have no designer, and you don't want to spend two days on color theory. DesignMCP produces the same quality output a senior designer would in a fraction of the time.

**Freelancers** — A client needs a design system delivered with their rebrand. `generate_design_system_file` produces four files you'd normally spend a day on. More projects, same time.

**Agencies** — `generate_brand_identity` (Agency tier) produces a complete brand strategy document you can use as a starting point or deliver directly. Agencies charge $5k–$50k for this work. At $99/month, the ROI on a single project is 50–500x.

**Design engineers** — You know what you want, you just need the math done: color scales, contrast ratios, OKLCH conversions, DTCG export. DesignMCP is your calculator.

---

## Works with

- **Claude Desktop** — [download](https://claude.ai/download) → Settings → MCP
- **Claude Code** — `claude mcp add designmcp -- npx -y @designmcp/server`
- **Cursor** — Settings → MCP → add server
- **Windsurf** — MCP settings → add configuration
- **Continue.dev** — `config.json` mcpServers block
- Any MCP-compatible client

---

## Distribution & listing

DesignMCP is listed on:
- [MCPize](https://mcpize.com) — search "DesignMCP"
- [MCP.so](https://mcp.so) — browse Design category
- [awesome-mcp-servers](https://github.com/wong2/awesome-mcp-servers) — Design section
- [Cline Marketplace](https://cline.bot) — search "design system"
- [PulseMCP](https://pulsemcp.com) — design tools

---

## Tech notes

**Why OKLCH over HSL?** The human eye doesn't perceive HSL lightness linearly. Two colors with the same HSL lightness value can look dramatically different in perceived brightness. OKLCH (from Björn Ottosson's OKLab) is perceptually uniform — equal steps look equal. This is why Radix UI, shadcn/ui, and Tailwind v4 all use it. DesignMCP implements the full sRGB → linear sRGB → OKLab → OKLCH pipeline from scratch.

**W3C DTCG format** — The [Design Tokens Community Group](https://tr.designtokens.org/format/) specification is the emerging standard for sharing design tokens between tools. DesignMCP's `dtcg` export format is compatible with Tokens Studio for Figma and Style Dictionary 4.

**Prompt caching** — AI tool calls (brand identity, AI-enhanced theme) use Anthropic's prompt caching on the system prompt to minimize latency and cost on repeated calls.

---

## License

MIT — free to use, modify, and distribute.  
Commercial support, team licenses, and white-label options: [designmcp.dev](https://designmcp.dev)
