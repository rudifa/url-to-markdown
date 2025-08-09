import {defineConfig} from "vitest/config";
import {fetch} from "undici";

// Polyfill fetch for Node.js test environment
globalThis.fetch = fetch as typeof globalThis.fetch;

export default defineConfig({
  test: {
    // Test file patterns
    include: ["tests/**/*.{test,spec}.{js,ts}"],
    // Environment setup
    environment: "node",
  },
  // Resolve configuration for imports
  resolve: {
    alias: {
      "@": "./src",
    },
  },
});
