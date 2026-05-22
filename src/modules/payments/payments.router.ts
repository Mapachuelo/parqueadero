import { FastifyInstance } from "fastify";
import { processPayment } from "./payments.controller.js";
import { authGuard } from "../../shared/middleware/auth-guard.js";
import { roleGuard } from "../../shared/middleware/role-guard.js";
import { Role } from "../../shared/types/enums.js";

export async function paymentsRouter(app: FastifyInstance) {
  app.post("/", {
    preHandler: [authGuard, roleGuard([Role.ADMIN, Role.OPERADOR])],
  }, processPayment);
}
