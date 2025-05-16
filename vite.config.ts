import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import dotenv from "dotenv";
import type { Plugin } from "vite";

dotenv.config();

// Plugin for analytics injection
function analyticsInjectionPlugin(mode: string): Plugin {
  return {
    name: 'analytics-injection',
    transformIndexHtml: {
      enforce: 'pre',
      transform(html) {
        const analyticsUrl = process.env.ANALYTICS_URL;
        if (analyticsUrl && mode !== 'development') {
          return {
            html,
            tags: [
              {
                tag: 'script',
                attrs: {
                  async: true,
                  defer: true,
                  src: analyticsUrl,
                  'data-website-id': process.env.ANALYTICS_WEBSITE_ID,
                },
                injectTo: 'head',
              },
            ],
          };
        }

        return html;
      },
    },
  };
}

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    allowedHost: ['d69cb91-1c99-407f-81d7-1c3adb32348b.lovableproject.com', 'localhost', '127.0.0.1', 'diff.pwp.sh']
  },
  plugins: [
    react(),
    analyticsInjectionPlugin(mode),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
        },
      },
    },
  },
  experimental: {
    renderBuiltUrl(filename) {
      return `/${filename}`;
    },
  },
}));
