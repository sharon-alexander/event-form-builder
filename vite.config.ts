import { fileURLToPath } from "node:url";
import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import cssInjectedByJsPlugin from "vite-plugin-css-injected-by-js";

const resolveRoot = (p: string) => fileURLToPath(new URL(p, import.meta.url));

// Two build targets share this config:
//  - default  -> a standard web app (index.html + assets) for the preview page
//  - "widget" -> a single embeddable IIFE bundle (event-form.iife.js) for Squarespace
// `npm run build` runs both, emitting everything into dist/.
const isWidget = process.env.BUILD_TARGET === "widget";

/**
 * Dev-server routing that mirrors vercel.json:
 *   /           → redirect to /admin.html
 *   /admin      → serve admin.html
 *   /form/:slug → serve index.html (form reads slug from pathname)
 */
function formPathRouting(): Plugin {
  return {
    name: "form-path-routing",
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const url = req.url ?? "";
        const pathname = url.split("?")[0] ?? "";

        if (pathname === "/") {
          res.statusCode = 302;
          res.setHeader("Location", "/admin");
          res.end();
          return;
        }

        if (pathname === "/admin" || pathname === "/admin/") {
          req.url = "/admin.html";
        } else if (pathname.startsWith("/form/") || pathname === "/form") {
          req.url = "/index.html";
        }
        next();
      });
    },
  };
}

export default defineConfig(({ command }) => ({
  plugins: [
    react(),
    formPathRouting(),
    // Only the embeddable widget needs JS-injected CSS. For the standard pages
    // (index.html + admin.html) Vite emits normal <link> stylesheets, which also
    // avoids ambiguity about which entry hosts the injection code.
    ...(isWidget
      ? [
          cssInjectedByJsPlugin({
            // For the embeddable widget, DON'T inject the bundle's CSS into the
            // host page's <head>. Tailwind's preflight resets bare element
            // selectors (body, *, img, svg, ...) and would otherwise restyle the
            // surrounding Squarespace page (e.g. collapsing the embedding
            // container's width). Capture the CSS instead so main.tsx can inject
            // it into a shadow root, fully isolating it from the host page.
            injectCodeFunction: (cssCode: string) => {
              (globalThis as Record<string, unknown>)["__ROSCIOLI_EFB_CSS__"] =
                cssCode;
            },
          }),
        ]
      : []),
  ],
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
        rollupOptions: {
          // Two pages: the public form (index.html) and the admin CMS
          // (admin.html). The widget build (lib mode above) excludes the admin
          // bundle, keeping the embeddable script lean.
          input: {
            main: resolveRoot("./index.html"),
            admin: resolveRoot("./admin.html"),
          },
        },
      },
}));
