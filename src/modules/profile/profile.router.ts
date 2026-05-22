import { FastifyInstance, FastifyPluginOptions } from "fastify";
import {
  getProfile,
  updateProfile,
  changePassword,
  getSessions,
  closeSession,
  closeOtherSessions,
  getNotificationPreferences,
  updateNotificationPreferences,
  exportUserData,
} from "./profile.controller.js";
import { authGuard } from "../../shared/middleware/auth-guard.js";

export async function profileRouter(fastify: FastifyInstance, opts: FastifyPluginOptions) {
  fastify.get("/", { preHandler: [authGuard] }, getProfile);

  fastify.put("/", { preHandler: [authGuard] }, updateProfile);

  fastify.put("/password", { preHandler: [authGuard] }, changePassword);

  fastify.get("/sessions", { preHandler: [authGuard] }, getSessions);

  fastify.delete("/sessions/:id", { preHandler: [authGuard] }, closeSession);

  fastify.delete("/sessions", { preHandler: [authGuard] }, closeOtherSessions);

  fastify.get("/preferences", { preHandler: [authGuard] }, getNotificationPreferences);

  fastify.put("/preferences", { preHandler: [authGuard] }, updateNotificationPreferences);

  fastify.get("/export", { preHandler: [authGuard] }, exportUserData);
}
