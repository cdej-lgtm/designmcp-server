export const SERVER_INFO = {
  name: "designmcp",
  version: "1.0.0",
  description: "Brand Intelligence & Design Token Server",

  guide: `# DesignMCP Guide

## Available Tools

| Tool | Description |
|------|-------------|
| generate_color_palette | Complete WCAG-accessible color scale |
| generate_design_tokens | Full token system |
| generate_typography_system | Type scale with font pairings |
| generate_shadow_system | Elevation shadows |
| generate_spacing_scale | Modular spacing system |
| generate_component_tokens | UI component tokens |
| check_accessibility | WCAG contrast checker |
| export_tokens | Convert to CSS/Tailwind/Swift/Kotlin |
| analyze_brand_url | Extract tokens from any website |
| generate_theme | One-shot complete brand theme |
`,

  conventions: `# Token Naming Conventions

## Colors
color-primary, color-primary-hover, color-surface, color-text-primary

## Typography  
font-family-display, font-size-xl, font-weight-bold

## Spacing
space-1 (4px), space-2 (8px), space-4 (16px)

## Shadows
shadow-xs, shadow-sm, shadow-md, shadow-lg, shadow-xl
`,
};

export const TOOL_ANNOTATIONS = {
  readOnly: {
    readOnlyHint: true,
    destructiveHint: false,
    idempotentHint: true,
    openWorldHint: false,
  },
};
