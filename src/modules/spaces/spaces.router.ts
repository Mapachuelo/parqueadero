import { FastifyInstance } from "fastify";
import { authGuard } from "../../shared/middleware/auth-guard.js";
import { roleGuard } from "../../shared/middleware/role-guard.js";
import { Role } from "../../shared/types/enums.js";
import { getAll, getOccupancy, release } from "./spaces.controller.js";

export async function spacesRouter(app: FastifyInstance) {
  app.get(
    "/",
    { preHandler: [authGuard, roleGuard([Role.ADMIN, Role.OPERADOR])] },
    getAll
  );

  app.get(
    "/occupancy",
    { preHandler: [authGuard, roleGuard([Role.ADMIN, Role.OPERADOR])] },
    getOccupancy
  );

  app.put(
    "/:code",
    { preHandler: [authGuard, roleGuard([Role.ADMIN])] },
    release
  );
}
