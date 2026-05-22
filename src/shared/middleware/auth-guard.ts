import { FastifyRequest, FastifyReply } from "fastify";
import { PrismaClient } from "@prisma/client";
import { AppError } from "../errors/app-error.js";
import { Role } from "../types/enums.js";

const prisma = new PrismaClient();

export async function authGuard(request: FastifyRequest, reply: FastifyReply) {
  try {
    await request.jwtVerify();
  } catch {
    throw AppError.unauthorized("Sesion invalida o expirada");
  }

  const userId = request.user.sub as number;

  const sessionToken = extractBearerToken(request);
  if (!sessionToken) {
    throw AppError.unauthorized();
  }

  const session = await prisma.userSession.findFirst({
    where: {
      token: sessionToken,
      is_active: true,
      expires_at: { gt: new Date() },
    },
  });

  if (!session) {
    throw AppError.unauthorized();
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, username: true, role: true, is_active: true, must_change_password: true },
  });

  if (!user || !user.is_active) {
    throw AppError.unauthorized();
  }

  if (user.role !== "cliente" && user.must_change_password && request.url !== "/api/profile/password") {
    reply.header("X-Must-Change-Password", "true");
  }

  request.user = {
    sub: user.id,
    id: user.id,
    role: user.role as Role,
    username: user.username,
  };
}

function extractBearerToken(request: FastifyRequest): string | null {
  const header = request.headers.authorization;
  if (!header) return null;
  const parts = header.split(" ");
  if (parts.length !== 2 || parts[0] !== "Bearer") return null;
  return parts[1];
}
