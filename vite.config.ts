import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Relative base so the built site works from a GitHub Pages project path,
// a subdirectory, or the filesystem without reconfiguration.
export default defineConfig({
  base: "./",
  plugins: [react()],
  build: { outDir: "dist", sourcemap: true },
});
