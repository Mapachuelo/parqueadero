import { FastifyInstance } from "fastify";

export function setupRateLimiter(app: FastifyInstance) {
  app.register(import("@fastify/rate-limit"), {
    global: false,
  });

  app.rateLimit = app.rateLimit || {};
}

export const rateLimitConfigs = {
  auth: { max: 5, timeWindow: "1 minute" },
  client: { max: 10, timeWindow: "1 minute" },
  sync: { max: 1000, timeWindow: "1 minute" },
  standard: { max: 60, timeWindow: "1 minute" },
};
