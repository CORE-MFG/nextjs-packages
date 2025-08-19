import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  resolve: {
    alias: {
      "nextjs-settings": path.resolve(__dirname, "dist"),
    },
  },
  test: {
    globals: true,
    environment: "node",
    include: ["test/**/*.test.ts"],
    server: {
        deps: {
        inline: ["nextjs-settings"], // inline the workspace package for SSR testing
      },
    },
  },
});
