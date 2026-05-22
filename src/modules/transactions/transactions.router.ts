import { FastifyInstance } from "fastify";
import { authGuard } from "../../shared/middleware/auth-guard.js";
import { roleGuard } from "../../shared/middleware/role-guard.js";
import { Role } from "../../shared/types/enums.js";
import { entry, exit, active, getById } from "./transactions.controller.js";

export async function transactionsRouter(app: FastifyInstance) {
  app.post(
    "/entry",
    { preHandler: [authGuard, roleGuard([Role.ADMIN, Role.OPERADOR])] },
    entry
  );

  app.post(
    "/:id/exit",
    { preHandler: [authGuard, roleGuard([Role.ADMIN, Role.OPERADOR])] },
    exit
  );

  app.get(
    "/active",
    { preHandler: [authGuard, roleGuard([Role.ADMIN, Role.OPERADOR])] },
    active
  );

  app.get(
    "/:id",
    { preHandler: [authGuard, roleGuard([Role.ADMIN, Role.OPERADOR])] },
    getById
  );
}
