import { FastifyInstance } from "fastify";
import { Role } from "../../shared/types/enums.js";
import { authGuard } from "../../shared/middleware/auth-guard.js";
import { roleGuard } from "../../shared/middleware/role-guard.js";
import {
  getCustodyTerms,
  createCustodyTerms,
  activateCustodyTerms,
  getChecklists,
  createChecklist,
  getChecklist,
  updateChecklistItem,
  completeChecklist,
  checkLegalCompliance,
} from "./legal.controller.js";

export async function legalRouter(app: FastifyInstance) {
  app.get(
    "/custody-terms",
    { preHandler: [authGuard, roleGuard([Role.ADMIN])] },
    getCustodyTerms
  );

  app.post(
    "/custody-terms",
    { preHandler: [authGuard, roleGuard([Role.ADMIN])] },
    createCustodyTerms
  );

  app.put(
    "/custody-terms/:id/activate",
    { preHandler: [authGuard, roleGuard([Role.ADMIN])] },
    activateCustodyTerms
  );

  app.get(
    "/checklist",
    { preHandler: [authGuard, roleGuard([Role.ADMIN])] },
    getChecklists
  );

  app.post(
    "/checklist",
    { preHandler: [authGuard, roleGuard([Role.ADMIN])] },
    createChecklist
  );

  app.get(
    "/checklist/:id",
    { preHandler: [authGuard, roleGuard([Role.ADMIN])] },
    getChecklist
  );

  app.put(
    "/checklist/:id/items/:itemId",
    { preHandler: [authGuard, roleGuard([Role.ADMIN])] },
    updateChecklistItem
  );

  app.post(
    "/checklist/:id/complete",
    { preHandler: [authGuard, roleGuard([Role.ADMIN])] },
    completeChecklist
  );

  app.get(
    "/compliance-report",
    { preHandler: [authGuard, roleGuard([Role.ADMIN])] },
    checkLegalCompliance
  );
}
