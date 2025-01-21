import { configDefaults, defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      lodash: "lodash-es",
    },
  },
  test: {
    coverage: {
      exclude: [...configDefaults.exclude, "example"],
    },
  },
});
