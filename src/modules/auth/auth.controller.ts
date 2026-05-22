import { FastifyRequest, FastifyReply } from "fastify";
import { authService } from "./auth.service.js";
import { loginSchema, registerSchema } from "./auth.schema.js";

export async function login(request: FastifyRequest, reply: FastifyReply) {
  const body = loginSchema.parse(request.body);

  const ipAddress = request.ip;
  const userAgent = request.headers["user-agent"];

  const result = await authService.login(
    body.username,
    body.password,
    ipAddress,
    userAgent
  );

  return reply.send(result);
}

export async function logout(request: FastifyRequest, reply: FastifyReply) {
  const header = request.headers.authorization;
  if (!header) {
    return reply.send({ message: "Sesion cerrada" });
  }

  const parts = header.split(" ");
  if (parts.length === 2 && parts[0] === "Bearer") {
    await authService.logout(parts[1]);
  }

  return reply.send({ message: "Sesion cerrada" });
}

export async function session(request: FastifyRequest, reply: FastifyReply) {
  const header = request.headers.authorization;
  if (!header) {
    return reply.send({ user: null });
  }

  const parts = header.split(" ");
  if (parts.length !== 2 || parts[0] !== "Bearer") {
    return reply.send({ user: null });
  }

  const user = await authService.validateSession(parts[1]);

  return reply.send({ user });
}

export async function register(request: FastifyRequest, reply: FastifyReply) {
  const body = registerSchema.parse(request.body);

  const user = await authService.register(request.user!.id, body);

  return reply.status(201).send({ user });
}
