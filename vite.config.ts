import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [
    react(),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "client", "src"),
      "@shared": path.resolve(__dirname, "shared"),
      "@assets": path.resolve(__dirname, "attached_assets"),
    },
  },
  root: path.resolve(__dirname, "client"),
  build: {
    outDir: path.resolve(__dirname, "dist/public"),
    emptyOutDir: true,
  },
  server: {
    proxy: {
      "/api": {
        target: "http://localhost:5000",
        changeOrigin: true,
      },
    },
    watch: {
      usePolling: true,
      interval: 1000,
    },
    host: true,
    strictPort: false,
  allowedHosts: [".loca.lt", ".ngrok-free.app", ".ngrok-free.dev", ".ngrok.io", ".trycloudflare.com", ".localhost.run", ".bore.pub", ".serveo.net", "localhost", "127.0.0.1"],
  },
  test: {
    globals: true,
    environment: "jsdom",
    environmentMatch: [
      ["../server/**/*.test.ts", "node"],
    ],
    include: ["../server/**/*.test.ts", "src/**/*.test.{ts,tsx}"],
    setupFiles: ["./src/test-setup.ts"],
  },
});
