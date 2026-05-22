export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: string;

  constructor(statusCode: number, message: string, code = "APP_ERROR") {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.name = "AppError";
  }

  static notFound(entity: string, id?: string): AppError {
    const msg = id
      ? `${entity} con identificador ${id} no encontrado(a)`
      : `${entity} no encontrado(a)`;
    return new AppError(404, msg, "NOT_FOUND");
  }

  static badRequest(message: string): AppError {
    return new AppError(400, message, "BAD_REQUEST");
  }

  static unauthorized(message = "Sesion invalida o expirada"): AppError {
    return new AppError(401, message, "UNAUTHORIZED");
  }

  static forbidden(message = "No tiene permisos para realizar esta accion"): AppError {
    return new AppError(403, message, "FORBIDDEN");
  }

  static conflict(message: string): AppError {
    return new AppError(409, message, "CONFLICT");
  }

  static locked(message = "Cuenta bloqueada temporalmente. Intente de nuevo en 30 minutos"): AppError {
    return new AppError(423, message, "LOCKED");
  }

  static internal(message = "Error interno del servidor"): AppError {
    return new AppError(500, message, "INTERNAL_ERROR");
  }
}
