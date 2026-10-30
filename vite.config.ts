import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

const host = process.env.TAURI_DEV_HOST;
// GitHub Pages serves project sites from /<repo>/, while Tauri and local dev
// stay at the root. The landing page build puts the app under a subdirectory.
const base = process.env.INKWELL_BASE || "/";
const outDir = process.env.INKWELL_OUT_DIR || "dist";

export default defineConfig(async () => ({
  base,
  build: { outDir },
  plugins: [react(), tailwindcss()],
  clearScreen: false,
  server: {
    port: 1420,
    strictPort: true,
    host: host || false,
    hmr: host ? { protocol: "ws", host, port: 1421 } : undefined,
    watch: { ignored: ["**/src-tauri/**"] },
  },
}));
