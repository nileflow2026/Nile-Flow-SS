# NILE FLOW WEBSITE — GLOBAL BUTTON SYSTEM REPORT

**Prepared by:** Senior UI/UX Architect & Design Systems Engineer  
**Date:** June 26, 2026  
**Sprint:** Week 2 — Design System & Visual Consistency

---

## 1. EXECUTIVE SUMMARY

A shared, reusable `Button` component has been created at `Website/components/Button.jsx`. This replaces the previous pattern of **ad hoc inline button styles scattered across 30+ component instances**. The component matches the Nile Flow Mobile Application's green CTA design language.

### Before (Legacy)
- 30+ different button patterns across components and pages
- Inline gradient backgrounds (`bg-gradient-to-r from-amber-600 to-amber-700`)
- No loading state support
- No icon support
- Inconsistent sizes and padding
- No accessible states (aria-busy, aria-disabled)
- No keyboard focus indicators
- Hardcoded amber colors

### After (Week 2)
- Single `Button` component with 5 variants, 3 sizes
- CSS token-based colors that match mobile app
- Loading spinner state
- Icon position support (left/right)
- Full accessibility (aria-disabled, aria-busy, focus-visible)
- Keyboard navigation (proper tabIndex, disabled state)
- Consistent hover, active, focus states
- `forwardRef` for ref forwarding

---

## 2. COMPONENT API

### Import
```jsx
import Button from "../components/Button";
// or
import Button from "../../components/Button";
```

### Props

| Prop | Type | Default | Options |
|------|------|---------|---------|
| `variant` | string | `"primary"` | `"primary"`, `"secondary"`, `"outline"`, `"ghost"`, `"danger"` |
| `size` | string | `"md"` | `"sm"`, `"md"`, `"lg"` |
| `loading` | boolean | `false` | — |
| `disabled` | boolean | `false` | — |
| `fullWidth` | boolean | `false` | — |
| `icon` | LucideIcon | `undefined` | Any lucide-react icon component |
| `iconPosition` | string | `"left"` | `"left"`, `"right"` |
| `type` | string | `"button"` | `"button"`, `"submit"`, `"reset"` |
| `onClick` | function | — | Click handler |
| `className` | string | `""` | Additional CSS classes |
| `style` | object | `{}` | Additional inline styles |

---

## 3. VARIANT REFERENCE

### Primary Button — `variant="primary"`
- **Background:** `var(--nf-btn-primary-bg)` — `#16A34A` (green)
- **Text:** `var(--nf-btn-primary-text)` — white
- **Hover:** `var(--nf-btn-primary-hover)` — `#15803D`
- **Active:** `scale(0.98)` press effect
- **Use for:** Primary CTAs, "Add to Cart", "Checkout", "Sign In"

```jsx
<Button>Let It Flow</Button>
<Button variant="primary" size="lg">Checkout Now</Button>
```

### Secondary Button — `variant="secondary"`
- **Background:** `var(--nf-btn-secondary-bg)` — `#F3F4F6`
- **Text:** `var(--nf-btn-secondary-text)` — `#374151`
- **Border:** `1px solid var(--nf-border)`
- **Hover:** `var(--nf-btn-secondary-hover)` — `#E5E7EB`
- **Use for:** Secondary actions, "Cancel", "Back"

```jsx
<Button variant="secondary">Cancel</Button>
```

### Outline Button — `variant="outline"`
- **Background:** transparent
- **Text:** `var(--nf-accent)` — green
- **Border:** `2px solid var(--nf-accent)`
- **Hover:** `var(--nf-accent-surface)` background
- **Use for:** "View Details", "Learn More"

```jsx
<Button variant="outline">View Details</Button>
```

### Ghost Button — `variant="ghost"`
- **Background:** transparent
- **Text:** `var(--nf-text-secondary)`
- **Border:** none
- **Hover:** `var(--nf-btn-ghost-hover)`
- **Use for:** Toolbar actions, icon-only buttons

```jsx
<Button variant="ghost">Remove</Button>
```

### Danger Button — `variant="danger"`
- **Background:** `var(--nf-btn-danger-bg)` — `#DC2626` (red)
- **Text:** `var(--nf-btn-danger-text)` — white
- **Hover:** `var(--nf-btn-danger-hover)` — `#B91C1C`
- **Use for:** Destructive actions, "Delete Account", "Cancel Order"

```jsx
<Button variant="danger">Delete Account</Button>
```

---

## 4. SIZE REFERENCE

| Size | Padding | Font Size | Border Radius | Use Case |
|------|---------|-----------|---------------|----------|
| `sm` | `6px 12px` | `13px` | `var(--nf-radius-sm)` | Dense UIs, tables, filters |
| `md` | `10px 20px` | `15px` | `var(--nf-radius-md)` | Default, most CTAs |
| `lg` | `14px 28px` | `16px` | `var(--nf-radius-lg)` | Hero CTAs, checkout |

---

## 5. STATE HANDLING

### Loading State
```jsx
<Button loading>Saving...</Button>
```
- Shows an animated SVG spinner
- `aria-busy="true"` set automatically
- Button is disabled while loading

### Disabled State
```jsx
<Button disabled>Not Available</Button>
```
- `opacity: 0.5`
- `cursor: not-allowed`
- `pointer-events: none`
- `aria-disabled="true"` set automatically

### Icon Support
```jsx
// Left icon (default)
<Button icon={ShoppingCart}>Add to Cart</Button>

// Right icon
<Button icon={ArrowRight} iconPosition="right">Continue</Button>

// Icon only (no text)
<Button icon={Heart} aria-label="Add to favorites" />
```

---

## 6. ACCESSIBILITY FEATURES

| Feature | Implementation |
|---------|---------------|
| `aria-disabled` | Set to `true` when `disabled || loading` |
| `aria-busy` | Set to `true` when `loading` |
| `focus-visible` outline | Green outline via global CSS + className |
| Keyboard navigation | Native `<button>` element — tabIndex works by default |
| SVG icons | `aria-hidden="true"` on all icon SVGs |
| Screen reader text | Children text wrapped in `<span>` for proper reading |
| Spinner | `<svg aria-hidden="true">` — not announced to screen readers |

---

## 7. BUTTON PATTERNS TO REFACTOR

The following components currently use ad hoc button styles and should be refactored to use the shared `Button` component:

| File | Current Pattern | Target Variant |
|------|----------------|---------------|
| `components/AddToCartButton.jsx` | Hardcoded amber/green toggle | `primary` with `icon={ShoppingBag}` |
| `components/ProductCard.jsx` | Inline gradient button | `outline` or `primary` |
| `components/Footer.jsx` | Newsletter subscribe button | `primary` |
| `components/HeroCarousel.jsx` | Carousel navigation | `ghost` |
| `components/Categories.jsx` | Category cards as buttons | `secondary` |
| `src/Pages/Home.jsx` | Various CTAs | varies |
| `src/Pages/CategoryPage.jsx` | "Filter", "All Products", subcategory buttons | `secondary`, `ghost` |
| `src/Pages/CartPage.jsx` | Cart actions | `primary`, `danger` |
| `src/Pages/CheckoutPage.jsx` | Checkout submission | `primary` `lg` |

---

## 8. USAGE RULES

1. **Primary CTA is always green.** Never use amber for CTAs.
2. **Loading state** should be used on any button that triggers an async operation.
3. **Full-width** buttons (`fullWidth`) for mobile layouts and card CTAs.
4. **Icons** should use lucide-react components, never emoji or unicode.
5. **Danger** variant reserved exclusively for destructive irreversible actions.
6. **Ghost** variant for toolbar and compact UIs where visual weight should be minimal.
7. **Always provide `aria-label`** when button has no text children (icon-only).

---

## 9. COMPLIANCE SUMMARY

| Criterion | Status |
|-----------|--------|
| Reusable shared Button component exists | ✅ |
| All 5 variants implemented (primary/secondary/outline/ghost/danger) | ✅ |
| Loading state with spinner | ✅ |
| Disabled state styling | ✅ |
| Icon support (left + right) | ✅ |
| Keyboard accessible | ✅ |
| Focus-visible indicators | ✅ |
| ARIA attributes (aria-disabled, aria-busy, aria-label) | ✅ |
| CSS token-based colors | ✅ |
| forwardRef support | ✅ |
| React.memo for performance | ✅ |

---

*End of Button System Report*
