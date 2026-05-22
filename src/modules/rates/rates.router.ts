import { FastifyInstance } from "fastify";
import { authGuard } from "../../shared/middleware/auth-guard.js";
import { roleGuard } from "../../shared/middleware/role-guard.js";
import { Role } from "../../shared/types/enums.js";
import {
  createStructure,
  getStructures,
  getStructureById,
  updateStructure,
  activateStructure,
  createRate,
  getActiveRates,
  getRateHistory,
  createFractionRate,
  getFractionRates,
  createSubscription,
  getSubscriptions,
  renewSubscription,
  createCredit,
  getCredits,
  rechargeCredit,
} from "./rates.controller.js";

export async function ratesRouter(app: FastifyInstance) {
  const admin = [authGuard, roleGuard([Role.ADMIN])];
  const adminOperator = [authGuard, roleGuard([Role.ADMIN, Role.OPERADOR])];

  app.post("/structures", { preHandler: admin }, createStructure);
  app.get("/structures", { preHandler: admin }, getStructures);
  app.get("/structures/:id", { preHandler: admin }, getStructureById);
  app.put("/structures/:id", { preHandler: admin }, updateStructure);
  app.post("/structures/:id/activate", { preHandler: admin }, activateStructure);

  app.post("/rates", { preHandler: admin }, createRate);
  app.get("/active", { preHandler: adminOperator }, getActiveRates);
  app.get("/history/:id", { preHandler: admin }, getRateHistory);

  app.post("/fractions", { preHandler: admin }, createFractionRate);
  app.get("/fractions", { preHandler: adminOperator }, getFractionRates);

  app.post("/subscriptions", { preHandler: admin }, createSubscription);
  app.get("/subscriptions", { preHandler: admin }, getSubscriptions);
  app.put("/subscriptions/:id/renew", { preHandler: admin }, renewSubscription);

  app.post("/credits", { preHandler: admin }, createCredit);
  app.get("/credits", { preHandler: admin }, getCredits);
  app.post("/credits/:id/recharge", { preHandler: adminOperator }, rechargeCredit);
}
