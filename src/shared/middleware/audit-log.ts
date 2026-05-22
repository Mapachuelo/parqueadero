import { FastifyRequest, FastifyReply } from "fastify";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function auditLog(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  if (request.url.startsWith("/api/")) {
    const userId = request.user?.id;
    const entityType = extractEntityType(request.url);
    const entityId = extractEntityId(request.url);

    prisma.auditLog
      .create({
        data: {
          user_id: userId || null,
          action: `${request.method} ${request.routeOptions.url || request.url}`,
          entity_type: entityType,
          entity_id: entityId || null,
          ip_address: request.ip,
          user_agent: request.headers["user-agent"] || null,
        },
      })
      .catch(() => {});
  }
}

function extractEntityType(url: string): string | null {
  const match = url.match(/\/api\/([a-z-]+)/);
  return match ? match[1] : null;
}

function extractEntityId(url: string): string | null {
  const match = url.match(/\/api\/[a-z-]+\/([a-zA-Z0-9-]+)/);
  return match ? match[1] : null;
}
