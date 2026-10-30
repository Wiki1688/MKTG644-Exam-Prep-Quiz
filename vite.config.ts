import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["icon.svg"],
      manifest: {
        name: "MKTG644 Exam Prep Quiz",
        short_name: "MKTG644 Quiz",
        description: "Practice MCQs, short questions and mini-cases for MKTG644 AI-Powered Marketing",
        theme_color: "#1E2761",
        background_color: "#ffffff",
        display: "standalone",
        start_url: "./",
        icons: [{ src: "icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any maskable" }],
      },
      workbox: { globPatterns: ["**/*.{js,css,html,svg,json}"] },
    }),
  ],
  base: "./",
});
