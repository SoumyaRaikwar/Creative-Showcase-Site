import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "node:path";

const port = Number(process.env.PORT ?? 3000);
const basePath = process.env.BASE_PATH ?? "/";

export default defineConfig({
  base: basePath,
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: { "@": path.resolve(import.meta.dirname, "src") },
    dedupe: ["react", "react-dom"],
  },
  root: path.resolve(import.meta.dirname),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true,
    target: "es2022",
    sourcemap: false,
    rollupOptions: {
      output: {
        // three + fiber only load after the poster paints (lazy import in HeroWaterfall)
        manualChunks(id) {
          if (id.includes("node_modules/three/") || id.includes("@react-three")) return "three";
          if (id.includes("node_modules/gsap/")) return "gsap";
          if (id.includes("react-markdown") || id.includes("remark") || id.includes("micromark") || id.includes("mdast") || id.includes("unified") || id.includes("hast")) return "markdown";
          return undefined;
        },
      },
    },
  },
  server: {
    port,
    host: "0.0.0.0",
    allowedHosts: true,
    proxy: {
      "/api": { target: process.env.API_PROXY ?? "http://localhost:8080", changeOrigin: true },
    },
  },
  preview: { port, host: "0.0.0.0", allowedHosts: true },
});
