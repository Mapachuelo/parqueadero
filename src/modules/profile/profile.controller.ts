import { FastifyRequest, FastifyReply } from "fastify";
import { profileService } from "./profile.service.js";
import { profileUpdateSchema, passwordChangeSchema, notificationPreferencesSchema } from "./profile.schema.js";

function extractBearerToken(request: FastifyRequest): string | null {
  const header = request.headers.authorization;
  if (!header) return null;
  const parts = header.split(" ");
  if (parts.length !== 2 || parts[0] !== "Bearer") return null;
  return parts[1];
}

export async function getProfile(request: FastifyRequest, reply: FastifyReply) {
  const data = await profileService.getProfile(request.user!.id);
  return reply.send({ success: true, data });
}

export async function updateProfile(request: FastifyRequest, reply: FastifyReply) {
  const body = profileUpdateSchema.parse(request.body);
  const data = await profileService.updateProfile(request.user!.id, body);
  return reply.send({ success: true, data });
}

export async function changePassword(request: FastifyRequest, reply: FastifyReply) {
  const body = passwordChangeSchema.parse(request.body);
  const token = extractBearerToken(request);
  if (!token) {
    return reply.status(401).send({ success: false, message: "Token no proporcionado" });
  }
  await profileService.changePassword(
    request.user!.id,
    body.currentPassword,
    body.newPassword,
    token
  );
  return reply.send({ success: true, message: "Contrasena actualizada correctamente" });
}

export async function getSessions(request: FastifyRequest, reply: FastifyReply) {
  const data = await profileService.getSessions(request.user!.id);
  return reply.send({ success: true, data });
}

export async function closeSession(request: FastifyRequest, reply: FastifyReply) {
  const { id } = request.params as { id: string };
  await profileService.closeSession(request.user!.id, Number(id));
  return reply.send({ success: true, message: "Sesion cerrada correctamente" });
}

export async function closeOtherSessions(request: FastifyRequest, reply: FastifyReply) {
  const token = extractBearerToken(request);
  if (!token) {
    return reply.status(401).send({ success: false, message: "Token no proporcionado" });
  }
  await profileService.closeOtherSessions(request.user!.id, token);
  return reply.send({ success: true, message: "Otras sesiones cerradas correctamente" });
}

export async function getNotificationPreferences(request: FastifyRequest, reply: FastifyReply) {
  const data = await profileService.getNotificationPreferences(request.user!.id);
  return reply.send({ success: true, data });
}

export async function updateNotificationPreferences(request: FastifyRequest, reply: FastifyReply) {
  const body = notificationPreferencesSchema.parse(request.body);
  const data = await profileService.updateNotificationPreferences(request.user!.id, body as Record<string, boolean>);
  return reply.send({ success: true, data });
}

export async function exportUserData(request: FastifyRequest, reply: FastifyReply) {
  const data = await profileService.exportUserData(request.user!.id);
  return reply.send({ success: true, data });
}
