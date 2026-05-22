import { AppError } from "../../shared/errors/app-error.js";
import { SpacesRepository, spacesRepository } from "./spaces.repository.js";

export class SpacesService {
  constructor(private repo: SpacesRepository) {}

  async getSpaces() {
    const spaces = await this.repo.findAllSpaces();

    return spaces.map((s: any) => ({
      id: s.id,
      space_code: s.space_code,
      zone: s.zone,
      is_occupied: s.is_occupied,
      current_transaction_id: s.current_transaction_id,
    }));
  }

  async getOccupancy() {
    const summary = await this.repo.getOccupancySummary();
    const pct = Math.round(summary.pct * 100) / 100;

    let level: string;
    let message: string | null = null;

    if (pct >= 100) {
      level = "lleno";
      message = "Parqueadero lleno";
    } else if (pct >= 99) {
      level = "critico";
      message = "Ocupacion critica";
    } else if (pct >= 95) {
      level = "alerta";
      message = "Alta ocupacion";
    } else if (pct >= 90) {
      level = "warning";
      message = "Ocupacion alta";
    } else {
      level = "normal";
    }

    return {
      total: summary.total,
      occupied: summary.occupied,
      free: summary.free,
      percentage: pct,
      level,
      message,
    };
  }

  async releaseSpace(adminId: number, code: string) {
    const space = await this.repo.findSpaceByCode(code);
    if (!space) {
      throw AppError.notFound("Espacio", code);
    }

    if (!space.is_occupied) {
      throw AppError.badRequest("El espacio ya se encuentra libre");
    }

    const activeTransaction = await this.repo.getActiveTransactionForSpace(code);
    if (activeTransaction) {
      await this.repo.cancelTransaction(activeTransaction.id);
    }

    const released = await this.repo.releaseSpace(code);

    return {
      id: released.id,
      space_code: released.space_code,
      zone: released.zone,
      is_occupied: released.is_occupied,
      current_transaction_id: released.current_transaction_id,
    };
  }

  async checkOccupancyAlerts() {
    const summary = await this.repo.getOccupancySummary();
    const pct = Math.round(summary.pct * 100) / 100;

    let level: string;
    let message: string | null = null;

    if (pct >= 100) {
      level = "lleno";
      message = "Parqueadero lleno";
    } else if (pct >= 99) {
      level = "critico";
      message = "Ocupacion critica";
    } else if (pct >= 95) {
      level = "alerta";
      message = "Alta ocupacion";
    } else if (pct >= 90) {
      level = "warning";
      message = "Ocupacion alta";
    } else {
      level = "normal";
    }

    return { level, message };
  }
}

export const spacesService = new SpacesService(spacesRepository);
