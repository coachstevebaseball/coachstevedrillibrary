import { defineConfig } from "vitest/config";
import path from "path";

const templateRoot = path.resolve(import.meta.dirname);

// Integration tests (*.integration.test.ts) are excluded by default.
// Run `INTEGRATION_TESTS=1 pnpm test` to include them.
const isIntegration = process.env.INTEGRATION_TESTS === "1";

export default defineConfig({
  root: templateRoot,
  resolve: {
    alias: {
      "@": path.resolve(templateRoot, "client", "src"),
      "@shared": path.resolve(templateRoot, "shared"),
      "@assets": path.resolve(templateRoot, "attached_assets"),
    },
  },
  test: {
    environment: "node",
    setupFiles: ["./server/vitest-setup.ts"],
    include: [
      "server/**/*.test.ts",
      "server/**/*.spec.ts",
      "client/src/**/*.test.ts",
      "client/src/**/*.spec.ts",
    ],
    exclude: isIntegration
      ? ["node_modules/**"]
      : ["node_modules/**", "server/**/*.integration.test.ts"],
  },
});
