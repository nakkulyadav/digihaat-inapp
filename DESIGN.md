# DESIGN.md — Creative Studio

This file is the frontend reference for every UI decision in this project.
Read it before writing any component, layout, or style. It overrides intuition.

---

## Design direction

**Swoosh Bold (Dark)** — a high-energy athletic design system built on near-black surfaces
with explosive orange accent moments. The UI feels like a professional internal tool that
also has personality: tight, fast, confident. Nothing whispers. No visual softness.
No decorative fluff. Every element earns its place.

This is not a dashboard aesthetic. It is not Notion or Linear. It is closer to the
Vercel dashboard if Vercel had been designed by Nike — in dark mode.

---

## Colors

Use these exact values. No ad-hoc hex codes anywhere in the codebase.
All colors must reference `T.*` tokens from `src/components/tokens.js`.

| Token | Value | Usage |
|---|---|---|
| `T.ink` | `#080808` | Sidebar bg — darkest surface |
| `T.work` | `#0F0F0F` | Workspace bg — main canvas area |
| `T.surface` | `#1A1A1A` | Cards, panels, inputs |
| `T.surface2` | `#252525` | Elevated surfaces: panel headers, artboard bg |
| `T.line` | `#2E2E2E` | Borders, dividers |
| `T.text` | `#F0F0F0` | Text-primary — headlines, labels |
| `T.sub` | `#888889` | Text-secondary — descriptions, supporting copy |
| `T.accent` | `#FA5400` | Orange — urgency badges, active sidebar, primary actions |
| `T.success` | `#1DBF12` | Done status, exported, confirmed |
| `T.warn` | `#FFC107` | Non-blocking issues, low-priority flags |
| `T.error` | `#FF4D30` | Errors, blocked states, critical review findings |
| `T.disabled` | `#484849` | Disabled text and controls |
| `T.orangeGlow` | `0 0 0 2px rgba(250,84,0,0.25), 0 0 10px rgba(250,84,0,0.18)` | Focus rings, interactive hover shadows |

**Hard rules on color:**
- `T.accent` (`#FA5400`) is the primary action color AND urgency badge color in dark mode.
- Never introduce a new color without adding it to this table and `tokens.js` first.
- Elevation is expressed through layering surfaces: `T.ink` → `T.work` → `T.surface` → `T.surface2`.
- The sidebar background is `T.ink`. The workspace is `T.work`. This contrast is the visual anchor — do not soften it.
- Orange glow (`T.orangeGlow`) is used as `box-shadow` on: focused inputs, hovered element cards, the FAB button.

---

## Typography

Three fonts. Each has a strict job. Never swap them.

**Jost** — display, headings, labels, navigation
Load from Google Fonts. Weights: 700, 900.
```
@import url('https://fonts.googleapis.com/css2?family=Jost:wght@700;900&display=swap');
```

**Inter** — body text, inputs, panel content, data
Already loaded via FontFace API for canvas use. Weights: 400, 500, 600, 700.

**JetBrains Mono** — code, IDs, technical values, item_id, timestamps, config keys
```
@import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500&display=swap');
```

### Type scale

| Role | Font | Weight | Size | Line height | Letter spacing |
|---|---|---|---|---|---|
| Page title | Jost | 900 | 28px | 0.95 | -0.02em |
| Section heading | Jost | 700 | 20px | 1.1 | -0.01em |
| Card title | Jost | 700 | 16px | 1.2 | 0 |
| Sidebar label | Jost | 700 | 13px | 1 | 0.04em uppercase |
| Body | Inter | 400 | 14px | 1.5 | 0 |
| Body strong | Inter | 600 | 14px | 1.5 | 0 |
| Input text | Inter | 400 | 14px | 1 | 0 |
| Caption / meta | Inter | 400 | 12px | 1.4 | 0 |
| Badge text | Inter | 600 | 11px | 1 | 0.02em uppercase |
| Technical value | JetBrains Mono | 400 | 12px | 1 | 0 |
| CTA button | Inter | 500 | 14px | 1 | 0.02em uppercase |

**Hard rules on type:**
- All section headings and page titles use Jost. Never Inter for headings.
- item_id, GID, timestamps, config key names, file paths → always JetBrains Mono.
- Never use Jost below 700 weight. Nothing below 700 for display type.
- Uppercase is for: sidebar category labels, CTA buttons, badge text, section headings at 13px and below. Not for body copy.

---

## Spacing

Base unit: **4px**. Every spacing value is a multiple of 4.

| Scale step | Value | Usage |
|---|---|---|
| 1 | 4px | Icon gaps, tight inline spacing |
| 2 | 8px | Internal component padding (small) |
| 3 | 12px | Card internal padding, list item gaps |
| 4 | 16px | Standard component padding, grid gaps |
| 6 | 24px | Section internal spacing |
| 8 | 32px | Between major sections |
| 12 | 48px | Page section gaps |
| 16 | 64px | Large layout separations |

Never use arbitrary values like 10px, 15px, 18px, 22px. If it is not on the scale, it is wrong.

---

## Border radius

| Value | Usage |
|---|---|
| 0px | Canvas artboard, hero panels, full-bleed sections, product images |
| 2px | Checkboxes, tight status pips |
| 4px | Tooltips, small badges, status tags |
| 8px | Inputs, filter chips, dropdowns, panel cards, modals |
| 30px | Primary CTA buttons only |
| 9999px | Avatar circles, toggle switches |

The sidebar and top header have no border radius. They are full-edge panels.

---

## Components

### Buttons

**Primary (orange)**
- Background: `T.accent` (`#FA5400`), hover: slightly brighter (`#FF6820`)
- Text: `#FFFFFF`, Inter 500, 14px, uppercase, 0.02em spacing
- Height: 44px, padding: 16px 28px
- Border radius: 30px
- Transition: background 150ms ease-out

**Secondary (outlined)**
- Background: `T.surface`, border: `1px solid T.line`
- Text: `T.text`, same type spec
- Hover: background `T.surface2`
- Border radius: 30px

**Ghost (text-level)**
- No background, no border
- Text: `T.text`, Inter 600, 13px
- Hover: text `T.accent`
- Used for: "Back to list", "Reset all edits", inline actions

**Disabled**
- Background: `T.surface2`, text: `T.disabled`
- Cursor: not-allowed, no hover state
- Used for: "Upload to CMS · Coming soon", "Save changes"

**Destructive**
- Background: `T.error`, text: `#FFFFFF`
- Same shape as Primary
- Used only for irreversible actions — never for warnings

---

### Inputs and fields

- Background: `T.surface`, border: `1px solid T.line` at rest
- Focus: border `1px solid T.accent`, box-shadow `T.orangeGlow`
- Border radius: 8px, padding: 8px 10px
- Font: Inter 400, 13px, `T.text`
- Label: Inter 500, 11px, `T.sub`, above the input, 4px gap
- Error state: border `1px solid T.error`, error message in `T.error` below input

Numeric position fields (x, y, r) use JetBrains Mono inside the input.

---

### Cards and panels

- Background: `T.surface`, border: `1px solid T.line`
- Border radius: 8px (panels), 0px (artboard/canvas container)
- No shadow at rest
- Hover (on clickable cards): `translateY(-2px)` + `0 4px 12px rgba(0,0,0,0.50), T.orangeGlow`, 150ms ease-out
- Internal padding: 16px

---

### Badges and status tags

- Border radius: 4px
- Padding: 3px 8px
- Font: Inter 600, 11px, uppercase, 0.02em spacing
- Height: 22px

| State | Background | Text |
|---|---|---|
| Pending | `T.work` | `T.sub` |
| Done | `T.accent` | `#FFFFFF` |
| Error / Critical | `T.error` | `#FFFFFF` |
| Warning | `T.warn` | `#111111` |
| Info | `T.surface` | `T.text` |
| Accent / Urgent | `T.accent` | `#FFFFFF` |

---

### Sidebar

- Background: `T.ink`
- Width: 208px, fixed, no collapse
- Category labels: Jost 700, 13px, uppercase, 0.04em spacing, `#EDEDED`
- Active category: background `T.accent`, text `#FFFFFF`
- Inactive: text `#D6D5DA`, hover background `rgba(255,255,255,0.06)`
- Disabled categories: text `T.disabled`, "soon" tag in `T.disabled`
- Section dividers: `1px solid T.line`
- Footer meta: JetBrains Mono, 10px, `T.disabled`

---

### Toggles

- Track: 34px × 20px, border radius 9999px
- On: `T.accent` track (orange), white thumb
- Off: `#3A3A3C` track, white thumb
- Thumb: 16px × 16px, border radius 9999px, 2px inset
- Transition: 150ms ease-out

---

### Empty states

- Border: `1px dashed T.line`
- Border radius: 8px
- Padding: 48px 32px
- Text: Jost 700, 15px, `T.sub`, centered
- Background: `T.surface`
- No illustration, no icon — text only

---

## Layout

### Page structure
```
[Sidebar 208px fixed] [Main area flex-1]
                         [Header 48px fixed, background T.surface]
                         [Body fills remaining height, background T.work, scrolls internally]
```

### Workspace (canvas + panel)
```
[Canvas column flex-1, centered content, overflow-auto, background T.work]
[Properties panel 320px fixed right, overflow-auto, border-left T.line, background T.surface]
```

### Artboard container
The canvas sits inside a container with:
- Background: `T.surface2`
- Border: `1px solid T.line`
- Border radius: 0px (the artboard itself has no radius)
- Subtle dot-grid background pattern: `radial-gradient(T.line 1px, transparent 1px)` at 12px × 12px
- Padding: 24px around the canvas
- Box shadow: `0 4px 18px rgba(0,0,0,0.60)`

---

## Motion

All transitions use **ease-out at 150–200ms**. Never ease-in-out. Never bounce.

| Interaction | Property | Duration | Easing |
|---|---|---|---|
| Button hover | background | 150ms | ease-out |
| Card hover | transform, box-shadow | 150ms | ease-out |
| Toggle | left, background | 150ms | ease-out |
| Sidebar item hover | background | 100ms | ease-out |
| Panel open/close | height, opacity | 200ms | ease-out |

Never animate layout-affecting properties (width, height of parent containers) — only
transform and opacity for performance.

---

## Elevation

Elevation is expressed through surface layering, reinforced by shadows with opacity scaled to depth.

| Level | Token | Shadow |
|---|---|---|
| Base (workspace bg) | `T.work` | none |
| 1 (cards, panels, inputs) | `T.surface` | none |
| 2 (panel headers, artboard bg) | `T.surface2` | none |
| Interactive hover | — | `0 4px 12px rgba(0,0,0,0.50), T.orangeGlow` |
| Canvas artboard | — | `0 4px 18px rgba(0,0,0,0.60)` |
| Modals, bottom sheets | — | `0 -8px 32px rgba(0,0,0,0.60)` |

---

## Do's and Don'ts

**Do:**
- Use Jost 900 uppercase for all page-level and section headings
- Use `T.text` on `T.surface` or `T.work` as the default contrast pair
- Use `T.accent` for primary actions and urgency badges
- Add `T.orangeGlow` as `box-shadow` on focused inputs and hovered interactive cards
- Use JetBrains Mono for all technical values (IDs, timestamps, config keys, file paths)
- Keep spacing on the 4px grid at all times
- Use ease-out at 150ms for all transitions
- Keep the sidebar `T.ink` — the contrast between sidebar and workspace is structural

**Don't:**
- Use any color not in the token table without adding it to `tokens.js` first
- Use Jost below 700 weight
- Use rounded corners on the canvas artboard or any full-bleed panel
- Add shadows beyond the elevation levels defined above
- Use `ease-in-out` — it feels slow and corporate
- Add decorative elements: illustrations, icons for their own sake, gradient backgrounds
- Use teal (`#0E8F84`) — that was the prototype color, replaced by this system
- Introduce spacing values not on the 4px scale
- Use more than one badge on a single list row

---

## Notes for Claude

- Every time you build a new component, check this file first.
- If a design decision is not covered here, default to the most minimal option and flag it in chat.
- Never introduce a new color, font, spacing value, or shadow without checking against this file.
- All hex values belong exclusively in `src/components/tokens.js`. Components reference `T.*` tokens.
- Inline styles are acceptable during rapid development but every color must use a `T.*` token, never a bare hex string.
- Orange glow (`T.orangeGlow`) is the signature interaction feedback — use it on focus states and interactive card hovers.
