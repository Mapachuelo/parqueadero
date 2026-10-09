import { test, expect } from "@playwright/test";

const clientEmail = process.env.E2E_CLIENT_EMAIL;
const clientPassword = process.env.E2E_CLIENT_PASSWORD;

test.describe("Cliente: portal de historial (RF-CLIENTE-001)", () => {
  test.skip(
    !clientEmail || !clientPassword,
    "Defina E2E_CLIENT_EMAIL y E2E_CLIENT_PASSWORD (usuario cliente creado por el admin)"
  );

  test("acceso con cuenta desde el portal", async ({ page }) => {
    await page.goto("/_cliente");
    await page.getByLabel("Correo electrónico").fill(clientEmail!);
    await page.getByLabel("Contraseña").fill(clientPassword!);
    await page.getByRole("button", { name: "Ingresar" }).click();

    await expect(page.getByRole("heading", { name: "Historial de Transacciones" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Cerrar Sesión" })).toBeVisible();
  });

  test("login principal redirige al portal de clientes", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel("Usuario").fill(clientEmail!);
    await page.getByLabel("Contraseña").fill(clientPassword!);
    await page.getByRole("button", { name: "Ingresar" }).click();

    await expect(page).toHaveURL(/\/_cliente/);
  });
});
