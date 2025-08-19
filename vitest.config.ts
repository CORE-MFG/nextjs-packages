import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    globals: true,           // Enable global test APIs (describe, it, expect)
    environment: "node",     // Node environment for testing
    include: ["packages/*/test/**/*.test.ts"], // Search test files
    watch: false,            // Optional: watch mode off by default
    coverage: {
      provider: "istanbul",  // Optional: enable coverage
      reporter: ["text", "lcov"],
    },
    deps: {
      inline: ["@core-mfg/nextjs-settings", "@core-mfg/nextjs-logging"], // Inline your package for SSR/monorepo testing
    },
  },
});
