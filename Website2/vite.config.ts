import { reactRouter } from "@react-router/dev/vite";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [tailwindcss(), reactRouter()],
  resolve: {
    tsconfigPaths: true,
  },
  build: {
    // Reduce chunk size warnings for our lazy-loaded pages
    chunkSizeWarningLimit: 600,

    // Inline small assets as base64 (saves HTTP requests on slow networks)
    assetsInlineLimit: 8192,

    // Separate CSS per chunk for better caching
    cssCodeSplit: true,

    // Source maps only in dev
    sourcemap: process.env.NODE_ENV !== "production",
  },
  optimizeDeps: {
    include: ["react", "react-dom", "react-router"],
  },
  server: {
    cors: true,
    proxy: {
      "/api": {
        target: "https://nile-flow-backend.onrender.com",
        changeOrigin: true,
        secure: false,
      },
    },
  },
});
