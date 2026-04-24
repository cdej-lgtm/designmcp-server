# DesignMCP — Brand Intelligence & Design Token Server

The MCP server that gives any LLM professional-grade design system generation.

## Install

```bash
npx @designmcp/server
```

## Claude Desktop Config

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

## Tools

| Tool | Description |
|------|-------------|
| `generate_color_palette` | WCAG-accessible color scale |
| `generate_theme` | One-shot complete brand theme |
| `generate_typography_system` | Type scale + Google Fonts |
| `generate_shadow_system` | Elevation shadows |
| `generate_spacing_scale` | Modular spacing |
| `generate_component_tokens` | UI component tokens |
| `check_accessibility` | WCAG contrast checker |
| `export_tokens` | CSS/Tailwind/Swift/Kotlin |
| `analyze_brand_url` | Extract tokens from any site |
| `generate_design_tokens` | Full token system |

## Pricing

| Plan | Price | Calls |
|------|-------|-------|
| Hobby | Free | 50/mo |
| Pro | $19/mo | Unlimited |
| Team | $49/mo | Unlimited + 5 keys |
