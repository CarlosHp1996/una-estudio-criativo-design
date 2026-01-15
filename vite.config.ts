import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig({
  server: {
    host: "::",
    port: parseInt(process.env.PORT || "5173"),
    cors: true,
    https: false, // Force HTTP in development
    proxy: {
      // Proxy for HTTPS backend
      "/api": {
        target: "https://localhost:4242",
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api/, "/api"),
      },
    },
  },
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    // Enable bundle splitting
    rollupOptions: {
      output: {
        manualChunks: {
          // Vendor chunk for large libraries
          "react-vendor": ["react", "react-dom", "react-router-dom"],
          "ui-vendor": [
            "@radix-ui/react-dialog",
            "@radix-ui/react-select",
            "@radix-ui/react-toast",
          ],
          "charts-vendor": ["recharts"],
          "utils-vendor": ["axios", "date-fns", "js-cookie", "sonner"],
          // Admin chunk (loaded only when needed)
          admin: [
            "./src/pages/admin/AdminDashboard",
            "./src/pages/admin/AdminProductsPage",
            "./src/pages/admin/AdminOrdersPage",
            "./src/pages/admin/AdminReportsPage",
            "./src/pages/admin/AdminAuditPage",
            "./src/pages/admin/AdminSettingsPage",
          ],
        },
      },
    },
    // Optimize chunk size
    chunkSizeWarningLimit: 1000,
    // Enable source maps for debugging
    sourcemap: true,
    // Minification options
    minify: "esbuild",
    target: "es2020",
  },
  // Optimize dependencies
  optimizeDeps: {
    include: [
      "react",
      "react-dom",
      "react-router-dom",
      "@tanstack/react-query",
      "axios",
    ],
    exclude: ["@vite/client", "@vite/env"],
  },
});
