import { FastifyRequest, FastifyReply } from "fastify";
import { spacesService } from "./spaces.service.js";
import { spaceCodeSchema } from "./spaces.schema.js";

export async function getAll(request: FastifyRequest, reply: FastifyReply) {
  const result = await spacesService.getSpaces();

  return reply.send({ success: true, data: result });
}

export async function getOccupancy(request: FastifyRequest, reply: FastifyReply) {
  const result = await spacesService.getOccupancy();

  return reply.send({ success: true, data: result });
}

export async function release(request: FastifyRequest, reply: FastifyReply) {
  const { code } = spaceCodeSchema.parse(request.params);
  const adminId = request.user!.id;

  const result = await spacesService.releaseSpace(adminId, code);

  return reply.send({ success: true, data: result });
}
