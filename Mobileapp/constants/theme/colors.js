/**
 * Nile Flow Design System — Color Tokens
 *
 * Three-tier palette:
 *   1. Green Gradient  — brand / action
 *   2. Gold / Bronze   — accent / highlight
 *   3. White           — background / surface
 *
 * Use these tokens in LinearGradient, StyleSheet, or inline styles.
 * For NativeWind class usage see tailwind.config.js (nile-green / nile-gold scales).
 */

export const green = {
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
};

export const gold = {
  50: "#FFFBEB",
  100: "#FEF3C7",
  200: "#FDE68A",
  300: "#FCD34D",
  400: "#FBBF24",
  500: "#F59E0B",
  600: "#D97706",
  700: "#B45309", // bronze
  800: "#92400E",
  900: "#78350F",
};

export const red = {
  50: "#FEF2F2",
  200: "#FECACA",
  700: "#B91C1C",
};

export const neutral = {
  white: "#FFFFFF",
  surface: "#F9FAFB",
  border: "#E5E7EB",
  muted: "#9CA3AF",
  body: "#374151",
  heading: "#111827",
};

/** Flat map for easy destructuring */
const colors = { green, gold, red, neutral };
export default colors;
