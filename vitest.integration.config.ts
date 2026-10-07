import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["src/tests/integration/**/*.test.ts"],
    environment: "node",
    testTimeout: 30000,
    hookTimeout: 60000,
    pool: "forks",
    poolOptions: {
      forks: { singleFork: true },
    },
  },
});
