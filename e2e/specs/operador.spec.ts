import { test, expect } from "@playwright/test";

const operatorPassword = process.env.E2E_OPERATOR_PASSWORD;

test.describe("Operador: entrada -> activos -> salida/pago (RF-RECEP, RF-SALIDA)", () => {
  test.skip(!operatorPassword, "Defina E2E_OPERATOR_PASSWORD con la clave del seed");

  test("flujo completo de entrada y salida", async ({ page }) => {
    const plate = `ETA${Math.floor(100 + Math.random() * 899)}`;

    await page.goto("/login");
    await page.getByLabel("Usuario").fill("operador");
    await page.getByLabel("Contraseña").fill(operatorPassword!);
    await page.getByRole("button", { name: "Ingresar" }).click();
    await expect(page).toHaveURL(/\/_operator\/entrada/);

    await page.getByLabel("Placa", { exact: true }).fill(plate);
    await page.getByLabel("Categoría").selectOption("A");
    await page.getByLabel("Nombre completo").fill("Prueba E2E");
    await page.getByRole("button", { name: "Registrar entrada" }).click();

    const ticket = page.getByRole("heading", { name: "Ticket de entrada" });
    await expect(ticket).toBeVisible();
    await expect(page.getByText(plate)).toBeVisible();
    await page.getByRole("button", { name: "Aceptar" }).click();

    await page.getByRole("link", { name: "Activos" }).click();
    await expect(page.getByRole("cell", { name: plate })).toBeVisible();

    await page.getByRole("link", { name: "Salida" }).click();
    await page.getByPlaceholder(/Placa/).fill(plate);
    await page.getByRole("button", { name: "Buscar" }).click();
    await expect(page.getByText("Datos del vehículo")).toBeVisible();

    await page.getByRole("button", { name: "Efectivo" }).click();
    const monto = page.getByRole("spinbutton");
    if (await monto.count()) {
      await monto.fill("20000");
    }
    await page.getByRole("button", { name: /Pagar/ }).click();

    await expect(page.getByRole("heading", { name: "Salida registrada" })).toBeVisible();
    await expect(page.getByRole("main").getByText("Pago procesado exitosamente")).toBeVisible();

    await page.getByRole("link", { name: "Activos" }).click();
    await expect(page.getByRole("cell", { name: plate })).toHaveCount(0);
  });
});
