import {defineConfig} from "vitest/config";

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
