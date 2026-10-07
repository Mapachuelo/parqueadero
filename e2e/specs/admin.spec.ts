import { test, expect } from "@playwright/test";

const adminPassword = process.env.E2E_ADMIN_PASSWORD;

test.describe("Admin: secciones del panel (RF-TARIFA, RF-REPORT, RF-LEGAL)", () => {
  test.skip(!adminPassword, "Defina E2E_ADMIN_PASSWORD con la clave del seed");

  test.beforeEach(async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel("Usuario").fill("admin");
    await page.getByLabel("Contraseña").fill(adminPassword!);
    await page.getByRole("button", { name: "Ingresar" }).click();
    await expect(page).toHaveURL(/\/_admin\/dashboard/);
  });

  test("dashboard, tarifas, reportes, reclamos, legal, espacios y usuarios", async ({ page }) => {
    await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible();

    await page.getByRole("link", { name: "Tarifas" }).click();
    await expect(page.getByRole("heading", { name: "Gestión de Tarifas" })).toBeVisible();
    await page.getByRole("button", { name: "Fracciones" }).click();
    await page.getByRole("button", { name: "Mensualidades" }).click();
    await page.getByRole("button", { name: "Abonos" }).click();

    await page.getByRole("link", { name: "Reportes" }).click();
    for (const tab of ["Ocupación", "Ingresos", "Transacciones", "Usuarios", "Compliance"]) {
      await page.getByRole("button", { name: tab }).click();
    }

    await page.getByRole("link", { name: "Reclamos" }).click();
    await expect(page.getByRole("heading", { name: "Gestión de Reclamos" })).toBeVisible();

    await page.getByRole("link", { name: "Legal" }).click();
    await expect(page.getByRole("heading", { name: "Cumplimiento Legal" })).toBeVisible();

    await page.getByRole("link", { name: "Espacios" }).click();
    await expect(page.getByRole("heading", { name: "Gestión de Espacios" })).toBeVisible();

    await page.getByRole("link", { name: "Usuarios" }).click();
    await expect(page.getByRole("heading", { name: "Gestión de Usuarios" })).toBeVisible();
    await expect(page.getByRole("cell", { name: "admin", exact: true })).toBeVisible();
    await expect(page.getByRole("cell", { name: "operador", exact: true })).toBeVisible();
  });
});
