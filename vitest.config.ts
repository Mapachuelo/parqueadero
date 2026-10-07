import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["src/**/*.test.ts"],
    exclude: ["node_modules/**", "src/tests/integration/**"],
    environment: "node",
    coverage: {
      provider: "v8",
      reporter: ["text", "html", "json-summary"],
      include: ["src/**/*.ts"],
      exclude: [
        "src/**/*.test.ts",
        "src/tests/**",
        "src/db/seeds/**",
        "src/jobs/**",
        "src/shared/types/**",
        "src/shared/i18n/**",
      ],
      thresholds: {
        statements: 20,
        branches: 40,
        functions: 25,
        lines: 20,
        "src/modules/transactions/transactions.service.ts": {
          statements: 80,
          branches: 60,
          functions: 80,
          lines: 80,
        },
        "src/modules/payments/payments.service.ts": {
          statements: 80,
          branches: 60,
          functions: 80,
          lines: 80,
        },
        "src/modules/rates/rates.service.ts": {
          statements: 80,
          branches: 60,
          functions: 80,
          lines: 80,
        },
        "src/modules/auth/auth.service.ts": {
          statements: 80,
          branches: 60,
          functions: 80,
          lines: 80,
        },
        "src/shared/utils/crypto.ts": {
          statements: 80,
          branches: 60,
          functions: 80,
          lines: 80,
        },
        "src/shared/utils/plate.ts": {
          statements: 80,
          branches: 60,
          functions: 80,
          lines: 80,
        },
        "src/shared/utils/date.ts": {
          statements: 70,
          branches: 60,
          functions: 70,
          lines: 70,
        },
      },
    },
  },
});
