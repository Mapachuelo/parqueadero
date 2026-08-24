import { FastifyRequest, FastifyReply } from "fastify";
import { env } from "../../config/env.js";
import { AppError } from "../errors/app-error.js";
import { safeEqual } from "../utils/security.js";

export async function deviceAuth(request: FastifyRequest, reply: FastifyReply) {
  const apiKey = request.headers["x-api-key"] as string;

  if (!apiKey || !safeEqual(apiKey, env.SYNC_API_KEY)) {
    throw AppError.unauthorized("API Key invalida para sincronizacion de dispositivos");
  }
}