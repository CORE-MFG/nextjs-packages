// packages/nextjs-settings/vitest.config.ts
import { defineConfig } from "vitest/config";
import rootConfig from "../../vitest.config";

export default defineConfig({
  ...rootConfig,
  test: {
    ...rootConfig.test,
    include: ["test/**/*.test.ts"], // package-local tests only
  },
});
