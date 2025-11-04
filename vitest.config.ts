import { configDefaults, defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "edge-runtime",
    typecheck: {
      tsconfig: "./tsconfig.test.json",
    },
    coverage: {
      exclude: [...configDefaults.exclude, "example"],
    },
  },
});
