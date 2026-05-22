import { FastifyInstance } from "fastify";
import { authGuard } from "../../shared/middleware/auth-guard.js";
import { roleGuard } from "../../shared/middleware/role-guard.js";
import { Role } from "../../shared/types/enums.js";
import { getOccupancy, getRevenue, getTransactions, getUserActivity, getCompliance } from "./reports.controller.js";

export async function reportsRouter(app: FastifyInstance) {
  app.get(
    "/occupancy",
    { preHandler: [authGuard, roleGuard([Role.ADMIN])] },
    getOccupancy
  );

  app.get(
    "/revenue",
    { preHandler: [authGuard, roleGuard([Role.ADMIN])] },
    getRevenue
  );

  app.get(
    "/transactions",
    { preHandler: [authGuard, roleGuard([Role.ADMIN, Role.OPERADOR])] },
    getTransactions
  );

  app.get(
    "/users",
    { preHandler: [authGuard, roleGuard([Role.ADMIN])] },
    getUserActivity
  );

  app.get(
    "/compliance",
    { preHandler: [authGuard, roleGuard([Role.ADMIN])] },
    getCompliance
  );
}
