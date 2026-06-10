import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import cssInjectedByJsPlugin from "vite-plugin-css-injected-by-js";

// Two build targets share this config:
//  - default  -> a standard web app (index.html + assets) for the preview page
//  - "widget" -> a single embeddable IIFE bundle (event-form.iife.js) for Squarespace
// `npm run build` runs both, emitting everything into dist/.
const isWidget = process.env.BUILD_TARGET === "widget";

export default defineConfig(({ command }) => ({
  plugins: [react(), cssInjectedByJsPlugin()],
  // In library/IIFE mode Vite doesn't auto-replace process.env.NODE_ENV, so React
  // would otherwise bundle its (larger, slower) development build. Force production
  // for any build to ship the optimized React.
  define:
    command === "build"
      ? { "process.env.NODE_ENV": JSON.stringify("production") }
      : {},
  build: isWidget
    ? {
        lib: {
          entry: "src/main.tsx",
          name: "RoscioliEventForm",
          fileName: "event-form",
          formats: ["iife"],
        },
        rollupOptions: {
          output: { extend: true },
        },
        cssCodeSplit: false,
        // Don't wipe the preview-page build that ran just before this one.
        emptyOutDir: false,
      }
    : {
        outDir: "dist",
      },
}));
