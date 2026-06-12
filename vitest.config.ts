import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    environment: "jsdom",
    setupFiles: ["./src/test/setup.ts"],
    globals: true,
    exclude: ["e2e/**", "node_modules/**", ".next/**"],
    coverage: {
      include: ["src/lib/**/*.ts"],
      reporter: ["text", "html"],
      thresholds: {
        statements: 30,
        branches: 20,
        functions: 30,
        lines: 30,
      },
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
