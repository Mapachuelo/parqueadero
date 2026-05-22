import { FastifyInstance } from "fastify";
import { ZodError } from "zod";
import { AppError } from "../errors/app-error.js";

export function setupErrorHandler(app: FastifyInstance) {
  app.setErrorHandler((error: any, request, reply) => {
    if (error instanceof ZodError) {
      const details = error.errors.map((e) => ({
        campo: e.path.join("."),
        mensaje: e.message,
      }));
      return reply.status(400).send({
        error: "Error de validacion",
        detalles: details,
      });
    }

    if (error instanceof AppError) {
      return reply.status(error.statusCode).send({
        error: error.message,
        codigo: error.code,
      });
    }

    if (error.statusCode === 429) {
      return reply.status(429).send({
        error: "Demasiadas solicitudes. Intente de nuevo mas tarde",
      });
    }

    if (error.statusCode === 413) {
      return reply.status(413).send({
        error: "El archivo es demasiado grande",
      });
    }

    console.error("Error no manejado:", error);

    return reply.status(500).send({
      error: "Error interno del servidor",
    });
  });
}
