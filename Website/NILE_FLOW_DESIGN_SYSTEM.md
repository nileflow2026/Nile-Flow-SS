# NILE FLOW WEBSITE — DESIGN SYSTEM

**Version:** 1.0  
**Date:** June 28, 2026  
**Status:** Production Ready  
**Supersedes:** All prior design tokens and style definitions

---

## TABLE OF CONTENTS

1. [Brand Principles](#1-brand-principles)
2. [Color Tokens](#2-color-tokens)
3. [Typography Scale](#3-typography-scale)
4. [Spacing Scale](#4-spacing-scale)
5. [Border Radius](#5-border-radius)
6. [Elevation & Shadows](#6-elevation--shadows)
7. [Button Variants](#7-button-variants)
8. [Input Styles](#8-input-styles)
9. [Card Styles](#9-card-styles)
10. [Accessibility Standards](#10-accessibility-standards)
11. [Component Usage Rules](#11-component-usage-rules)
12. [Do's and Don'ts](#12-dos-and-donts)

---

## 1. BRAND PRINCIPLES

### 1.1 Visual Identity
Nile Flow's visual identity is built on **trust, clarity, and cultural authenticity**. The design system prioritizes:
- **Trust** — No fabricated metrics, no misleading badges, honest empty states
- **Consistency** — Single source of truth for colors, typography, and spacing
- **Clarity over decoration** — Never add visual complexity for aesthetic purposes
- **Mobile-first** — All components work on 375px screens first
- **Accessibility** — WCAG 2.1 AA minimum across all elements

### 1.2 Design Philosophy
- Prefer solid colors over gradients
- Prefer flat surfaces over glassmorphism
- Prefer clear hierarchy over visual effects
- Green = action, Gold = value, White = space

### 1.3 Mobile App Alignment
This design system is intentionally identical to the Nile Flow Mobile Application's design language. Users moving between web and mobile should perceive no brand difference.

---

## 2. COLOR TOKENS

### 2.1 Primary Brand Colors

| Token | Light | Dark | CSS Variable |
|-------|-------|------|-------------|
| CTA / Accent | `#16A34A` | `#22C55E` | `--nf-accent` |
| Accent Hover | `#15803D` | `#16A34A` | `--nf-accent-hover` |
| Dark Green (Headings) | `#14532D` | `#4ADE80` | `--nf-accent-dark` |
| Light Green | `#22C55E` | `#34D399` | `--nf-accent-light` |
| Green Muted | `#BBF7D0` | `rgba(34,197,94,0.25)` | `--nf-accent-muted` |
| Green Surface | `#F0FDF4` | `rgba(34,197,94,0.12)` | `--nf-accent-surface` |

### 2.2 Gold Accent (Prices & Stars)

| Token | Light | Dark | CSS Variable |
|-------|-------|------|-------------|
| Gold | `#D97706` | `#F59E0B` | `--nf-gold` |
| Gold Hover | `#B45309` | `#D97706` | `--nf-gold-hover` |
| Gold Surface | `#FEF3C7` | `rgba(245,158,11,0.12)` | `--nf-gold-surface` |

### 2.3 Semantic Colors

| Token | Light | Dark | Usage |
|-------|-------|------|-------|
| Success | `#16A34A` | `#34D399` | Order confirmed, payment success |
| Success Surface | `#DCFCE7` | `rgba(52,211,153,0.15)` | Success banners |
| Warning | `#D97706` | `#F59E0B` | Low stock, expiring soon |
| Warning Surface | `#FEF3C7` | `rgba(245,158,11,0.15)` | Warning banners |
| Error | `#DC2626` | `#F87171` | Errors, cancellations, danger |
| Error Surface | `#FEE2E2` | `rgba(248,113,113,0.15)` | Error banners |
| Info | `#2563EB` | `#60A5FA` | Informational messages |
| Info Surface | `#DBEAFE` | `rgba(96,165,250,0.15)` | Info banners |

### 2.4 Neutrals

| Token | Light | Dark | Usage |
|-------|-------|------|-------|
| `--nf-bg-primary` | `#FFFFFF` | `#0A0A0A` | Page background |
| `--nf-bg-secondary` | `#F9FAFB` | `#111111` | Secondary surfaces |
| `--nf-bg-elevated` | `#FFFFFF` | `#1A1A1A` | Cards, modals, dropdowns |
| `--nf-bg-subtle` | `#F3F4F6` | `#222222` | Input fields, table rows |
| `--nf-bg-overlay` | `rgba(0,0,0,0.5)` | `rgba(0,0,0,0.7)` | Modal backdrops |
| `--nf-bg-card-soft` | `#F9FAFB` | `#1A1A1A` | Product card backgrounds |

### 2.5 Text

| Token | Light | Dark | Usage |
|-------|-------|------|-------|
| `--nf-text-primary` | `#111827` | `#F5F0E8` | Headings, key labels |
| `--nf-text-secondary` | `#374151` | `#D4C4B0` | Body copy, descriptions |
| `--nf-text-muted` | `#6B7280` | `#8A7A6A` | Placeholders, captions, timestamps |
| `--nf-text-inverse` | `#FFFFFF` | `#0A0A0A` | Text on dark surfaces |
| `--nf-text-on-accent` | `#FFFFFF` | `#FFFFFF` | Text on accent buttons |

### 2.6 Borders

| Token | Light | Dark | Usage |
|-------|-------|------|-------|
| `--nf-border` | `#E5E7EB` | `rgba(255,255,255,0.1)` | Default card/input borders |
| `--nf-border-strong` | `#D1D5DB` | `rgba(255,255,255,0.2)` | Focused inputs, active cards |
| `--nf-border-subtle` | `rgba(0,0,0,0.08)` | `rgba(255,255,255,0.05)` | Dividers, faint borders |

### 2.7 Usage Rules
- **Always reference a token**, never a raw hex value
- `--nf-accent` is for **CTAs, links, and active states only**
- `--nf-gold` is for **prices and star ratings only**
- `--nf-text-primary` for **all headings** (no gradient text)
- Card backgrounds use `--nf-bg-card-soft` or `--nf-bg-elevated`, never `--nf-bg-primary`

---

## 3. TYPOGRAPHY SCALE

### 3.1 Font Stack
```
font-family: 'Inter', system-ui, -apple-system, sans-serif;
```

### 3.2 Type Scale

| Class | Desktop | Mobile | Weight | Line Ht | Letter Spacing | Usage |
|-------|---------|--------|--------|---------|----------------|-------|
| `nf-heading-1` | `2.5rem` (40px) | `1.875rem` (30px) | 700 | 1.2 | -0.02em | Page titles (H1) |
| `nf-heading-2` | `2rem` (32px) | `1.5rem` (24px) | 700 | 1.25 | -0.01em | Section titles (H2) |
| `nf-heading-3` | `1.5rem` (24px) | `1.25rem` (20px) | 600 | 1.3 | normal | Card titles (H3) |
| `nf-heading-4` | `1.25rem` (20px) | `1.125rem` (18px) | 600 | 1.4 | normal | Subsection titles (H4) |
| `nf-body` | `1rem` (16px) | `1rem` (16px) | 400 | 1.6 | normal | Body paragraphs |
| `nf-body-small` | `0.875rem` (14px) | `0.875rem` (14px) | 400 | 1.5 | normal | Descriptions |
| `nf-caption` | `0.75rem` (12px) | `0.75rem` (12px) | 500 | 1.4 | normal | Timestamps, counts |

### 3.3 Button Text
- Default: `0.9375rem` (15px), 600 weight
- Small: `0.8125rem` (13px), 600 weight
- Large: `1rem` (16px), 600 weight

### 3.4 Usage Rules
- **Never use gradient text on headings** — use solid `--nf-text-primary`
- **H1 is reserved for page titles** — one per page only
- **H2 for major sections** (Featured Products, Categories)
- **H3 for card titles** (product names, category cards)
- **H4 for subsections** within a section

---

## 4. SPACING SCALE

| Token | Value | Use Case |
|-------|-------|----------|
| `--nf-space-1` | `4px` | Icon gaps, compact content |
| `--nf-space-2` | `8px` | Button padding (sm), small gaps |
| `--nf-space-3` | `12px` | Card padding (compact), form gaps |
| `--nf-space-4` | `16px` | Standard padding, section spacing |
| `--nf-space-5` | `20px` | Card padding (default) |
| `--nf-space-6` | `24px` | Section spacing, vertical rhythm |
| `--nf-space-8` | `32px` | Large section spacing |
| `--nf-space-10` | `40px` | Hero section, major dividers |
| `--nf-space-12` | `48px` | Page section spacing |
| `--nf-space-16` | `64px` | Ultra-wide sections |

---

## 5. BORDER RADIUS

| Token | Value | Usage |
|-------|-------|-------|
| `--nf-radius-sm` | `6px` | Small buttons, compact tags |
| `--nf-radius-md` | `8px` | Default buttons, inputs |
| `--nf-radius-lg` | `12px` | Cards, modals, dropdowns |
| `--nf-radius-xl` | `16px` | Large cards, hero sections |
| `--nf-radius-full` | `9999px` | Pills, badges, avatars |

---

## 6. ELEVATION & SHADOWS

| Token | Value | Usage |
|-------|-------|-------|
| `--nf-shadow-sm` | `0 1px 2px rgba(0,0,0,0.05)` | Subtle elevation (cards resting) |
| `--nf-shadow-md` | `0 4px 6px rgba(0,0,0,0.07)` | Moderate elevation (dropdowns) |
| `--nf-shadow-lg` | `0 10px 15px rgba(0,0,0,0.1)` | High elevation (modals) |
| `--nf-shadow-xl` | `0 20px 25px rgba(0,0,0,0.15)` | Maximum elevation (toasts) |
| Card shadow | `0 1px 3px rgba(0,0,0,0.08)` | Default card shadow |
| Card hover | `0 4px 12px rgba(0,0,0,0.1)` | Card hover elevation |

---

## 7. BUTTON VARIANTS

### 7.1 All Variants

| Variant | Background | Text | Border | Hover | Usage |
|---------|-----------|------|--------|-------|-------|
| `primary` | `--nf-btn-primary-bg` | `--nf-btn-primary-text` | none | Darker green | Primary CTAs |
| `secondary` | `--nf-btn-secondary-bg` | `--nf-btn-secondary-text` | `--nf-border` | Darker bg | Secondary actions |
| `outline` | transparent | `--nf-accent` | `2px solid --nf-accent` | Green surface | "View Details" |
| `ghost` | transparent | `--nf-text-secondary` | none | Green ghost | Toolbar actions |
| `danger` | `--nf-btn-danger-bg` | `--nf-btn-danger-text` | none | Darker red | Destructive actions |

### 7.2 Sizes

| Size | Padding | Font Size | Radius |
|------|---------|-----------|--------|
| `sm` | `6px 12px` | `13px` | `--nf-radius-sm` |
| `md` | `10px 20px` | `15px` | `--nf-radius-md` |
| `lg` | `14px 28px` | `16px` | `--nf-radius-lg` |

### 7.3 States
- **Loading**: Shows animated spinner, `aria-busy="true"`, disabled
- **Disabled**: `opacity: 0.5`, `cursor: not-allowed`, `aria-disabled="true"`
- **Icon**: `icon` prop accepts lucide-react component, `iconPosition` left/right

### 7.4 Example Usage
```jsx
import Button from "../components/Button";
import { ShoppingCart, ArrowRight } from "lucide-react";

<Button>Let It Flow</Button>
<Button icon={ShoppingCart}>Add to Cart</Button>
<Button variant="secondary" size="sm">Cancel</Button>
<Button variant="outline">View Details</Button>
<Button variant="danger" loading>Deleting...</Button>
<Button variant="ghost" icon={Heart} aria-label="Favorite" />
```

---

## 8. INPUT STYLES

| Token | Light | Dark |
|-------|-------|------|
| `--nf-input-bg` | `#FFFFFF` | `rgba(255,255,255,0.05)` |
| `--nf-input-border` | `#D1D5DB` | `rgba(255,255,255,0.15)` |
| `--nf-input-border-focus` | `#16A34A` | `#22C55E` |
| `--nf-input-text` | `#111827` | `#F5F0E8` |
| `--nf-input-placeholder` | `#9CA3AF` | `#8A7A6A` |

- All inputs use `var(--nf-input-bg)` as background
- Focus state: `2px solid var(--nf-input-border-focus)` via `:focus-visible`
- Border radius: `var(--nf-radius-md)` (8px)

---

## 9. CARD STYLES

| Property | Value |
|----------|-------|
| Background | `var(--nf-bg-elevated)` or `var(--nf-bg-card-soft)` |
| Border | `1px solid var(--nf-card-border)` |
| Border Radius | `var(--nf-radius-lg)` (12px) |
| Shadow | `var(--nf-card-shadow)` |
| Hover Border | `var(--nf-card-hover-border)` |
| Hover Shadow | `var(--nf-card-hover-shadow)` |
| Padding | `var(--nf-space-4)` (16px) default |

- Card backgrounds should **never be `#FFFFFF`** on light theme — use `#F9FAFB` (`--nf-bg-card-soft`) to visually separate from the page background
- Featured/premium cards can use `--nf-bg-card-green` (`#F0FDF4`)

---

## 10. ACCESSIBILITY STANDARDS

### 10.1 Skip-to-Content
```html
<a href="#main-content" class="skip-to-content">Skip to content</a>
```
- Hidden by default, appears on keyboard focus (Tab key)
- Rendered at `z-index: 10000`

### 10.2 Focus Indicators
```css
*:focus-visible {
  outline: 2px solid var(--nf-accent);
  outline-offset: 2px;
}
```
- Green outline on all focusable elements during keyboard navigation
- `:focus-visible` ensures mouse users don't see persistent outlines
- `:focus:not(:focus-visible)` removes outline for mouse clicks

### 10.3 ARIA Requirements
| Element | Required Attributes |
|---------|-------------------|
| Icon buttons | `aria-label` describing the action |
| Toggle buttons | `aria-expanded` with true/false |
| Disabled buttons | `aria-disabled="true"` |
| Loading buttons | `aria-busy="true"` |
| SVG icons | `aria-hidden="true"` |
| Navigation regions | `<nav>` with `aria-label` |

### 10.4 Color Contrast
| Token Pair | Ratio | WCAG |
|-----------|-------|------|
| Primary text on white | 16:1 | AAA |
| Body text on white | 10:1 | AAA |
| White on green CTA | 4.8:1 | AA |
| Muted text on white | 5.5:1 | AA |

### 10.5 Reduced Motion
```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## 11. COMPONENT USAGE RULES

| Component | Rules |
|-----------|-------|
| **Button** | Use shared `components/Button.jsx`. Never inline button styles. |
| **Header** | Use shared `components/Header.jsx`. No random gradients. Green accent color. |
| **Footer** | No gradient trust badges. Use solid backgrounds with `--nf-bg-subtle`. |
| **ProductCard** | Use `averageRating` prop (not hardcoded 4.8). Green/gold colors via tokens. |
| **Badges** | Sale = solid red, Premium = solid gold, Stock = green/amber/red. No gradients. |
| **Text** | No gradient text. Use `nf-heading-*` classes for hierarchy. |
| **Icons** | Use lucide-react. Never emoji or unicode icons. All must have `aria-hidden`. |

---

## 12. DO'S AND DON'TS

### ✅ DO
- Use CSS tokens (`--nf-*`) for every color, spacing, and radius value
- Use the shared `Button` component for all interactive actions
- Use `nf-heading-*` classes for consistent typography
- Use solid colors over gradients
- Use `#F9FAFB` for card backgrounds (not `#FFFFFF`)
- Provide `aria-label` on all icon-only buttons
- Show loading states on async buttons
- Show empty states instead of fake data

### ❌ DON'T
- Use amber/brown colors (`#B45309`, `#A35527`, `#1A1109`) — replaced with green/gray
- Use gradient text on headings (`bg-clip-text text-transparent`)
- Use gradient backgrounds on buttons (solid green CTA only)
- Use glassmorphism (`backdrop-blur`) on cards
- Fabricate ratings, review counts, or quality metrics
- Hardcode hex values that exist as CSS tokens
- Use FontAwesome icons — use lucide-react instead
- Use emoji as icons (`🏠`, `🛒`) — use lucide-react
- Hide scrollbars completely (`scrollbar-width: none`)
- Put gradient backgrounds in the header
- Use `bg-black/20` circle backgrounds on icon buttons

---

*End of Nile Flow Design System — Version 1.0*
