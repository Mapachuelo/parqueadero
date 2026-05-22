import { FastifyInstance, FastifyPluginOptions } from "fastify";
import { authenticate, getTransactions, getTransaction } from "./client.controller.js";
import { authGuard } from "../../shared/middleware/auth-guard.js";
import { roleGuard } from "../../shared/middleware/role-guard.js";
import { Role } from "../../shared/types/enums.js";

export async function clientRouter(fastify: FastifyInstance, opts: FastifyPluginOptions) {
  fastify.post("/auth", { config: { rateLimit: { max: 5, timeWindow: "1 minute" } } }, authenticate);

  fastify.get("/transactions", {
    preHandler: [authGuard, roleGuard([Role.CLIENTE])],
  }, getTransactions);

  fastify.get("/transactions/:id", {
    preHandler: [authGuard, roleGuard([Role.CLIENTE])],
  }, getTransaction);
}
