import { FastifyInstance, FastifyPluginOptions } from "fastify";
import { login, logout, session, register } from "./auth.controller.js";
import { authGuard } from "../../shared/middleware/auth-guard.js";
import { roleGuard } from "../../shared/middleware/role-guard.js";
import { Role } from "../../shared/types/enums.js";

export async function authRouter(fastify: FastifyInstance, opts: FastifyPluginOptions) {
  fastify.post("/login", login);

  fastify.post("/logout", {
    preHandler: [authGuard],
  }, logout);

  fastify.get("/session", {
    preHandler: [authGuard],
  }, session);

  fastify.post("/register", {
    preHandler: [authGuard, roleGuard([Role.ADMIN])],
  }, register);
}
