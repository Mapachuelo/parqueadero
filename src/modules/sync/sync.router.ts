import { FastifyInstance } from "fastify";
import { deviceAuth } from "../../shared/middleware/device-auth.js";
import { authGuard } from "../../shared/middleware/auth-guard.js";
import { roleGuard } from "../../shared/middleware/role-guard.js";
import { Role } from "../../shared/types/enums.js";
import {
  receiveBatch,
  getStatus,
  getConflicts,
  resolveConflict,
  getRates,
  getUsers,
  getSubscriptions,
  getCredits,
} from "./sync.controller.js";

export async function syncRouter(app: FastifyInstance) {
  app.post(
    "/",
    { preHandler: [deviceAuth] },
    receiveBatch
  );

  app.get(
    "/status",
    { preHandler: [deviceAuth] },
    getStatus
  );

  app.get(
    "/conflicts",
    { preHandler: [authGuard, roleGuard([Role.ADMIN])] },
    getConflicts
  );

  app.post(
    "/conflicts/:id/resolve",
    { preHandler: [authGuard, roleGuard([Role.ADMIN])] },
    resolveConflict
  );

  app.get(
    "/rates",
    { preHandler: [deviceAuth] },
    getRates
  );

  app.get(
    "/users",
    { preHandler: [deviceAuth] },
    getUsers
  );

  app.get(
    "/subscriptions",
    { preHandler: [deviceAuth] },
    getSubscriptions
  );

  app.get(
    "/credits",
    { preHandler: [deviceAuth] },
    getCredits
  );
}
