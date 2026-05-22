import { FastifyInstance } from "fastify";
import { Role } from "../../shared/types/enums.js";
import { authGuard } from "../../shared/middleware/auth-guard.js";
import { roleGuard } from "../../shared/middleware/role-guard.js";
import {
  createClaim,
  getClaims,
  getClaim,
  updateClaim,
  addEvidence,
  addNote,
  resolveClaim,
} from "./claims.controller.js";

export async function claimsRouter(app: FastifyInstance) {
  app.post(
    "/",
    { preHandler: [authGuard, roleGuard([Role.ADMIN, Role.OPERADOR])] },
    createClaim
  );

  app.get(
    "/",
    { preHandler: [authGuard, roleGuard([Role.ADMIN])] },
    getClaims
  );

  app.get(
    "/:id",
    { preHandler: [authGuard, roleGuard([Role.ADMIN])] },
    getClaim
  );

  app.put(
    "/:id",
    { preHandler: [authGuard, roleGuard([Role.ADMIN])] },
    updateClaim
  );

  app.post(
    "/:id/evidence",
    { preHandler: [authGuard, roleGuard([Role.ADMIN, Role.OPERADOR])] },
    addEvidence
  );

  app.post(
    "/:id/notes",
    { preHandler: [authGuard, roleGuard([Role.ADMIN])] },
    addNote
  );

  app.put(
    "/:id/resolve",
    { preHandler: [authGuard, roleGuard([Role.ADMIN])] },
    resolveClaim
  );
}
