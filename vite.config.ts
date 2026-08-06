import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ command }) => ({
  plugins: [react()],

  base: command === "build" ? "/3D-animator/" : "/",

  server: {
    host: true,
    port: 5173,
    open: true
  },

  preview: {
    host: true,
    port: 4173,
    open: true
  },

  build: {
    target: "esnext",
    outDir: "dist",
    assetsDir: "assets",
    sourcemap: false,
    minify: "esbuild",
    emptyOutDir: true,
    chunkSizeWarningLimit: 1000
  }
}));
