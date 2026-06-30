/**
 * Nile Flow Design System — Theme Constants
 * Mirrors Mobileapp theme from AGENTS.md / Mobileapp/constants/theme/colors.js
 * Three-tier palette: Green Gradient · Gold/Bronze · White
 */
export const COLORS = {
  GREEN: {
    50: "#F0FDF4",
    100: "#DCFCE7",
    200: "#BBF7D0",
    300: "#86EFAC",
    400: "#4ADE80",
    500: "#22C55E",
    600: "#16A34A",
    700: "#15803D",
    800: "#166534",
    900: "#14532D",
  },
  GOLD: {
    50: "#FFFBEB",
    100: "#FEF3C7",
    200: "#FDE68A",
    300: "#FCD34D",
    400: "#FBBF24",
    500: "#F59E0B",
    600: "#D97706",
    700: "#B45309",
    800: "#92400E",
    900: "#78350F",
  },
  NEUTRAL: {
    WHITE: "#FFFFFF",
    SURFACE: "#F9FAFB",
    BORDER: "#E5E7EB",
    MUTED: "#9CA3AF",
    BODY: "#374151",
    HEADING: "#111827",
  },
} as const;

export const FONTS = {
  FAMILY: "'Poppins', 'Inter', system-ui, -apple-system, sans-serif",
  WEIGHTS: {
    THIN: 100,
    EXTRA_LIGHT: 200,
    LIGHT: 300,
    REGULAR: 400,
    MEDIUM: 500,
    SEMI_BOLD: 600,
    BOLD: 700,
    EXTRA_BOLD: 800,
    BLACK: 900,
  },
} as const;

export const BREAKPOINTS = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  "2xl": 1536,
} as const;

export const TRANSITIONS = {
  fast: "150ms ease",
  normal: "250ms ease",
  slow: "400ms ease",
} as const;

export const MILES = {
  EARN_RATE: 0.05, // 5% back in miles
  REDEEM_RATE: 100, // 100 miles = 1 currency unit
  MIN_REDEEM: 500,
  MAX_REDEEM_PERCENT: 0.5, // max 50% of order paid with miles
} as const;

export const PREMIUM = {
  PRICE_MONTHLY: 9.99,
  PRICE_YEARLY: 79.99,
  FREE_SHIPPING_THRESHOLD: 0, // free shipping on all orders
  DISCOUNT_PERCENT: 10,
} as const;
