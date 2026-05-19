/**
 * Nile Flow Design System — Typography Tokens
 *
 * Font families match the keys in tailwind.config.js (font-p* classes).
 * These are used for StyleSheet-based font references when NativeWind
 * class names cannot be used (e.g., inside platform-native props).
 *
 * All fonts are loaded in app/_layout.jsx via expo-font useFonts().
 */

export const fontFamily = {
  thin: "Poppins-Thin",
  extraLight: "Poppins-ExtraLight",
  light: "Poppins-Light",
  regular: "Poppins-Regular",
  medium: "Poppins-Medium",
  semiBold: "Poppins-SemiBold",
  bold: "Poppins-Bold",
  extraBold: "Poppins-ExtraBold",
  black: "Poppins-Black",
};

export const fontSize = {
  xs: 12,
  sm: 14,
  base: 16,
  lg: 18,
  xl: 20,
  "2xl": 24,
  "3xl": 30,
  "4xl": 36,
};

export const lineHeight = {
  tight: 1.25,
  normal: 1.5,
  relaxed: 1.75,
};

const typography = { fontFamily, fontSize, lineHeight };
export default typography;
