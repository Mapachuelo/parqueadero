import { AppError } from "../../shared/errors/app-error.js";
import { legalRepository } from "./legal.repository.js";

export const legalService = {
  async getCustodyTerms() {
    return legalRepository.findAllCustodyTerms();
  },

  async createCustodyTerms(adminId: number, data: { version: string; content: string }) {
    const existing = await legalRepository.findCustodyTermsByVersion(data.version);
    if (existing) {
      throw AppError.conflict("Ya existe una version con este identificador");
    }

    return legalRepository.createCustodyTerms({
      version: data.version,
      content: data.content,
      created_by: adminId,
    });
  },

  async activateCustodyTerms(id: number) {
    const terms = await legalRepository.findCustodyTermsById(id);
    if (!terms) {
      throw AppError.notFound("Terminos de custodia", String(id));
    }

    return legalRepository.activateCustodyTerms(id);
  },

  async getChecklists() {
    return legalRepository.findAllChecklists();
  },

  async createChecklist(adminId: number, data: { name: string; description?: string }) {
    const active = await legalRepository.findActiveChecklist();
    if (active) {
      throw AppError.badRequest(
        "Ya existe un checklist activo. Complete o archive el existente antes de crear uno nuevo"
      );
    }

    return legalRepository.createChecklist({
      name: data.name,
      description: data.description,
      created_by: adminId,
    });
  },

  async getChecklist(id: number) {
    const checklist = await legalRepository.findChecklistById(id);
    if (!checklist) {
      throw AppError.notFound("Checklist legal", String(id));
    }
    return checklist;
  },

  async updateChecklistItem(itemId: number, data: { isChecked: boolean }, userId?: number) {
    const item = await legalRepository.findChecklistItemById(itemId);
    if (!item) {
      throw AppError.notFound("Item del checklist", String(itemId));
    }

    return legalRepository.updateChecklistItem(itemId, {
      is_checked: data.isChecked,
      checked_by: userId,
      checked_at: data.isChecked ? new Date() : null,
    });
  },

  async completeChecklist(id: number) {
    const checklist = await legalRepository.findChecklistById(id);
    if (!checklist) {
      throw AppError.notFound("Checklist legal", String(id));
    }

    if (checklist.items.length === 0) {
      throw AppError.badRequest("El checklist no tiene items. Agregue items antes de completarlo");
    }

    const allChecked = checklist.items.every((item: { is_checked: boolean }) => item.is_checked);
    if (!allChecked) {
      throw AppError.badRequest("Todos los items del checklist deben estar marcados antes de completarlo");
    }

    return legalRepository.completeChecklist(id);
  },

  async checkLegalCompliance() {
    const checklists = await legalRepository.findAllChecklists();
    const hasCompleted = checklists.some((c: { is_complete: boolean }) => c.is_complete);

    if (!hasCompleted) {
      throw AppError.badRequest(
        "Complete el checklist legal de pre-operacion antes de iniciar operaciones"
      );
    }

    const active = await legalRepository.findActiveChecklist();
    return { compliant: true, activeChecklist: active };
  },
};
