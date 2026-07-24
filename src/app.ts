import Fastify from "fastify";
import path from "path";
import { fileURLToPath } from "url";
import fstatic from "@fastify/static";
import cors from "@fastify/cors";
import helmet from "@fastify/helmet";
import jwt from "@fastify/jwt";
import multipart from "@fastify/multipart";
import swagger from "@fastify/swagger";
import swaggerUi from "@fastify/swagger-ui";
import underPressure from "@fastify/under-pressure";
import { jsonSchemaTransform } from "@fastify/type-provider-zod";
import { setupErrorHandler } from "./shared/middleware/error-handler.js";
import { setupRateLimiter } from "./shared/middleware/rate-limiter.js";
import { auditLog } from "./shared/middleware/audit-log.js";
import { env } from "./config/env.js";
import { authRouter } from "./modules/auth/index.js";
import { transactionsRouter } from "./modules/transactions/index.js";
import { paymentsRouter } from "./modules/payments/index.js";
import { ratesRouter } from "./modules/rates/index.js";
import { legalRouter } from "./modules/legal/index.js";
import { claimsRouter } from "./modules/claims/index.js";
import { reportsRouter } from "./modules/reports/index.js";
import { spacesRouter } from "./modules/spaces/index.js";
import { profileRouter } from "./modules/profile/index.js";
import { clientRouter } from "./modules/client/index.js";
import { syncRouter } from "./modules/sync/index.js";
import { startScheduler } from "./jobs/scheduler.js";
import { existsSync, readFileSync } from "fs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export function buildApp() {
  const app = Fastify({
    logger: env.NODE_ENV !== "test",
  });

  app.register(helmet);
  app.register(cors, {
    origin: true,
    credentials: true,
  });

  app.register(swagger, {
    openapi: {
      info: {
        title: "Parqueadero API",
        description:
          "Sistema de Gestion de Parqueaderos Publicos - Neiva, Colombia",
        version: "1.0.0",
      },
      servers: [{ url: `http://localhost:${env.PORT}` }],
      tags: [
        { name: "auth", description: "Autenticacion y registro de usuarios" },
        {
          name: "transactions",
          description: "Entrada y salida de vehiculos",
        },
        { name: "payments", description: "Procesamiento de pagos" },
        { name: "rates", description: "Gestion de tarifas" },
        { name: "legal", description: "Terminos de custodia y checklist legal" },
        { name: "claims", description: "Gestion de reclamos" },
        { name: "reports", description: "Reportes de ocupacion, ingresos y auditoria" },
        { name: "spaces", description: "Gestion de espacios de parqueo" },
        { name: "profile", description: "Configuracion de perfil de usuario" },
        { name: "client", description: "Consulta de historial para clientes" },
        { name: "sync", description: "Sincronizacion offline" },
      ],
    },
    transform: jsonSchemaTransform,
  });

  app.register(swaggerUi, {
    routePrefix: "/docs",
    uiConfig: {
      docExpansion: "list",
      deepLinking: true,
    },
  });

  app.register(underPressure, {
    maxEventLoopDelay: 1000,
    maxHeapUsedBytes: 500 * 1024 * 1024,
    maxRssBytes: 1024 * 1024 * 1024,
    exposeStatusRoute: false,
  });

  app.register(jwt, {
    secret: env.JWT_SECRET,
    sign: { expiresIn: `${env.JWT_EXPIRATION_MINUTES}m` },
  });
  app.register(multipart, {
    limits: { fileSize: 10 * 1024 * 1024 },
  });

  setupRateLimiter(app);
  setupErrorHandler(app);

  app.addHook("onResponse", auditLog);

  app.register(authRouter, { prefix: "/api/auth" });
  app.register(transactionsRouter, { prefix: "/api/transactions" });
  app.register(paymentsRouter, { prefix: "/api/payments" });
  app.register(ratesRouter, { prefix: "/api/rates" });
  app.register(legalRouter, { prefix: "/api/legal" });
  app.register(claimsRouter, { prefix: "/api/claims" });
  app.register(reportsRouter, { prefix: "/api/reports" });
  app.register(spacesRouter, { prefix: "/api/spaces" });
  app.register(profileRouter, { prefix: "/api/profile" });
  app.register(clientRouter, { prefix: "/api/client" });
  app.register(syncRouter, { prefix: "/api/sync" });

  const serveStatic = process.env.SERVE_STATIC !== "false";
  const clientDist = path.resolve(__dirname, "../client/dist");
  if (serveStatic && existsSync(clientDist)) {
    app.register(fstatic, {
      root: clientDist,
      prefix: "/",
      index: ["index.html"],
      cacheControl: true,
      dotfiles: "ignore",
    });

    const indexPath = path.join(clientDist, "index.html");
    app.setNotFoundHandler((request, reply) => {
      if (request.url.startsWith("/api/")) {
        return reply.status(404).send({ success: false, error: "Not found" });
      }
      if (existsSync(indexPath)) {
        return reply.type("text/html").send(readFileSync(indexPath, "utf-8"));
      }
      return reply.status(404).send({ error: "Not found" });
    });
  }

  app.get("/health", async () => {
    return { status: "ok", timestamp: new Date().toISOString() };
  });

  app.get("/health/ready", async (_req, _reply) => {
    const mem = process.memoryUsage();
    const heapUsedMB = (mem.heapUsed / 1024 / 1024).toFixed(1);
    return {
      status: "ready",
      uptime: process.uptime(),
      memory: {
        heapUsedMB,
        rssMB: (mem.rss / 1024 / 1024).toFixed(1),
      },
      timestamp: new Date().toISOString(),
    };
  });

  startScheduler();

  return app;
}
