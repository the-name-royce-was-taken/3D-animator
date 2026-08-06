import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  base: "/3D-animator/",

  plugins: [react()],

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
    sourcemap: true,
    outDir: "dist",
    assetsDir: "assets",
    emptyOutDir: true
  }
});
