import { defineConfig, devices } from "@playwright/test";

/**
 * Pruebas E2E contra el despliegue en Podman (https://localhost:3001).
 * Requiere credenciales del seed en variables de entorno:
 *   E2E_ADMIN_PASSWORD, E2E_OPERATOR_PASSWORD
 *   E2E_CLIENT_EMAIL, E2E_CLIENT_PASSWORD (usuario cliente creado por el admin)
 */
export default defineConfig({
  testDir: "./e2e/specs",
  timeout: 60000,
  expect: { timeout: 10000 },
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [["list"], ["html", { outputFolder: "e2e/report", open: "never" }]],
  use: {
    baseURL: process.env.E2E_BASE_URL ?? "https://localhost:3001",
    ignoreHTTPSErrors: true,
    screenshot: "only-on-failure",
    trace: "on-first-retry",
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
  ],
});
