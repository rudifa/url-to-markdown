import {defineConfig} from "vitest/config";

export default defineConfig({
  test: {
    // Test file patterns
    include: ["tests/**/*.{test,spec}.{js,ts}"],
    // Environment setup
    environment: "node",
    // Setup file for global polyfills and test configuration
    setupFiles: ["./tests/setup.ts"],
  },
  // Resolve configuration for imports
  resolve: {
    alias: {
      "@": "./src",
    },
  },
});
