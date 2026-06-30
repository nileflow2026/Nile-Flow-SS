/* eslint-disable no-undef */
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./Context/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "#16A34A",
        "primary-dark": "#15803D",
        "primary-light": "#22C55E",
        secondary: "#F3F4F6",
        "secondary-dark": "#E5E7EB",
        accent: "#D97706",
        "accent-dark": "#B45309",
        darkText: "#111827",
        muted: "#6B7280",
        gold: "#D97706",
        "gold-dark": "#B45309",
        "surface-green": "#F0FDF4",
        "border-light": "#E5E7EB",
      },
      borderRadius: {
        sm: "6px",
        md: "8px",
        lg: "12px",
        xl: "16px",
      },
      boxShadow: {
        card: "0 1px 3px rgba(0, 0, 0, 0.08)",
        elevated: "0 4px 6px rgba(0, 0, 0, 0.07)",
        modal: "0 20px 25px rgba(0, 0, 0, 0.15)",
      },
      animation: {
        "slide-in-right": "slideInRight 0.3s ease-out forwards",
        "slide-out-right": "slideOutRight 0.3s ease-out forwards",
        "countdown-bar": "countdownBar 5s linear forwards",
        "pulse-notification": "pulseNotification 2s infinite",
        "bounce-notification": "bounceNotification 0.6s ease-out",
        "spin-slow": "spin 2s linear infinite",
      },
      keyframes: {
        slideInRight: {
          "0%": { transform: "translateX(100%)", opacity: "0" },
          "100%": { transform: "translateX(0)", opacity: "1" },
        },
        slideOutRight: {
          "0%": { transform: "translateX(0)", opacity: "1" },
          "100%": { transform: "translateX(100%)", opacity: "0" },
        },
        countdownBar: {
          "0%": { width: "100%" },
          "100%": { width: "0%" },
        },
        pulseNotification: {
          "0%, 100%": { boxShadow: "0 0 0 0 rgba(22, 163, 74, 0.7)" },
          "70%": { boxShadow: "0 0 0 10px rgba(22, 163, 74, 0)" },
        },
        bounceNotification: {
          "0%, 20%, 53%, 80%, 100%": { transform: "translate3d(0,0,0)" },
          "40%, 43%": { transform: "translate3d(0, -30px, 0)" },
          "70%": { transform: "translate3d(0, -15px, 0)" },
          "90%": { transform: "translate3d(0, -4px, 0)" },
        },
      },
    },
  },
  plugins: [
    require("@tailwindcss/forms"),
    require("@tailwindcss/typography"),
    require("@tailwindcss/aspect-ratio"),
  ],
};
