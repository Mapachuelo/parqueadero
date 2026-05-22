import { FastifyRequest, FastifyReply } from "fastify";
import { AppError } from "../errors/app-error.js";
import { Role } from "../types/enums.js";

export function roleGuard(allowedRoles: Role[]) {
  return async function (request: FastifyRequest, reply: FastifyReply) {
    const user = request.user;
    if (!user) {
      throw AppError.unauthorized();
    }

    if (!allowedRoles.includes(user.role as Role)) {
      throw AppError.forbidden();
    }
  };
}
