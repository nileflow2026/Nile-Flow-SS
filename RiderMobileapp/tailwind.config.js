/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx}",
    "./components/**/*.{js,jsx}",
    "./screens/**/*.{js,jsx}",
    "./layouts/**/*.{js,jsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        // ── Nile Flow Rider ♥ African Heritage Palette ──────────────────
        sunset: "#E25822",
        savanna: "#D9A566",
        earth: "#8C4B2F",
        clay: "#BF6B4B",
        sand: "#F2D5A0",
        mud: "#593527",
        // Semantic
        success: "#16A34A",
        warning: "#D97706",
        error: "#DC2626",
        info: "#2563EB",
        // Dark surface scale
        surface: {
          primary: "#111827",
          secondary: "#1F2937",
          tertiary: "#374151",
        },
        text: {
          primary: "#F9FAFB",
          secondary: "#9CA3AF",
          muted: "#6B7280",
        },
        border: {
          primary: "#374151",
          muted: "#1F2937",
        },
      },
      fontFamily: {
        display: ["System"],
        heading: ["System"],
        body: ["System"],
        mono: ["System"],
      },
      borderRadius: {
        xs: "6px",
        sm: "8px",
        md: "12px",
        lg: "16px",
        xl: "20px",
        "2xl": "24px",
      },
      spacing: {
        xs: "4px",
        sm: "8px",
        md: "16px",
        lg: "24px",
        xl: "32px",
        "2xl": "40px",
        "3xl": "48px",
      },
    },
  },
  plugins: [],
};
