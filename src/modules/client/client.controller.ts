import { FastifyRequest, FastifyReply } from "fastify";
import jwt from "jsonwebtoken";
import { clientService } from "./client.service.js";
import { clientAuthSchema, clientQuerySchema } from "./client.schema.js";
import { hashPlate } from "../../shared/utils/crypto.js";

function extractBearerToken(request: FastifyRequest): string | null {
  const header = request.headers.authorization;
  if (!header) return null;
  const parts = header.split(" ");
  if (parts.length !== 2 || parts[0] !== "Bearer") return null;
  return parts[1];
}

export async function authenticate(request: FastifyRequest, reply: FastifyReply) {
  const body = clientAuthSchema.parse(request.body);
  const result = await clientService.authenticateClient(body);
  return reply.send({ success: true, data: result });
}

export async function getTransactions(request: FastifyRequest, reply: FastifyReply) {
  const query = clientQuerySchema.parse(request.query);
  const { plate } = request.query as { plate?: string };

  const plateHash = plate ? hashPlate(plate.toUpperCase()) : undefined;

  let accessType: string | undefined;
  let scopedTransactionId: string | undefined;

  const token = extractBearerToken(request);
  if (token) {
    const decoded = jwt.decode(token) as any;
    if (decoded?.accessType === "temporary") {
      accessType = decoded.accessType;
      scopedTransactionId = decoded.transactionId;
    }
  }

  const data = await clientService.getClientTransactions(request.user!.id, {
    plateHash,
    filters: query,
    accessType,
    scopedTransactionId,
  });

  return reply.send({ success: true, data });
}

export async function getTransaction(request: FastifyRequest, reply: FastifyReply) {
  const { id } = request.params as { id: string };

  let accessType: string | undefined;
  let scopedTransactionId: string | undefined;

  const token = extractBearerToken(request);
  if (token) {
    const decoded = jwt.decode(token) as any;
    if (decoded?.accessType === "temporary") {
      accessType = decoded.accessType;
      scopedTransactionId = decoded.transactionId;
    }
  }

  const data = await clientService.getClientTransaction(request.user!.id, id, {
    accessType,
    scopedTransactionId,
  });

  return reply.send({ success: true, data });
}
