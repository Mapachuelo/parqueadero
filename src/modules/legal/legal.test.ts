import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("./legal.repository.js", () => ({
  legalRepository: {
    findAllCustodyTerms: vi.fn(),
    findActiveCustodyTerms: vi.fn(),
    createCustodyTerms: vi.fn(),
    activateCustodyTerms: vi.fn(),
    findCustodyTermsById: vi.fn(),
    findCustodyTermsByVersion: vi.fn(),
    findAllChecklists: vi.fn(),
    findActiveChecklist: vi.fn(),
    createChecklist: vi.fn(),
    addChecklistItem: vi.fn(),
    findChecklistItemById: vi.fn(),
    updateChecklistItem: vi.fn(),
    completeChecklist: vi.fn(),
    findChecklistById: vi.fn(),
  },
}));

import { legalService } from "./legal.service.js";
import { legalRepository } from "./legal.repository.js";

const repo = legalRepository as any;

describe("LegalService (RF-LEGAL-001/002/003)", () => {
  beforeEach(() => vi.clearAllMocks());

  it("lista los terminos de custodia", async () => {
    repo.findAllCustodyTerms.mockResolvedValue([{ id: 1, version: "1.0" }]);
    const result = await legalService.getCustodyTerms();
    expect(result).toHaveLength(1);
  });

  it("no permite version duplicada de terminos", async () => {
    repo.findCustodyTermsByVersion.mockResolvedValue({ id: 1, version: "1.0" });
    await expect(
      legalService.createCustodyTerms(1, { version: "1.0", content: "texto" })
    ).rejects.toThrow("Ya existe una version");
  });

  it("crea terminos de custodia nuevos", async () => {
    repo.findCustodyTermsByVersion.mockResolvedValue(null);
    repo.createCustodyTerms.mockResolvedValue({ id: 2, version: "1.1" });
    const result = await legalService.createCustodyTerms(1, { version: "1.1", content: "texto" });
    expect(result.version).toBe("1.1");
  });

  it("activateCustodyTerms lanza 404 si no existe", async () => {
    repo.findCustodyTermsById.mockResolvedValue(null);
    await expect(legalService.activateCustodyTerms(9)).rejects.toThrow(/Terminos de custodia .*no encontrado/);
  });

  it("no permite crear checklist si hay uno activo", async () => {
    repo.findActiveChecklist.mockResolvedValue({ id: 1, is_complete: false });
    await expect(
      legalService.createChecklist(1, { name: "Checklist 2026" })
    ).rejects.toThrow("Ya existe un checklist activo");
  });

  it("crea checklist cuando no hay activo", async () => {
    repo.findActiveChecklist.mockResolvedValue(null);
    repo.createChecklist.mockResolvedValue({ id: 1, name: "Checklist 2026" });
    const result = await legalService.createChecklist(1, { name: "Checklist 2026" });
    expect(result.name).toBe("Checklist 2026");
  });

  it("getChecklist lanza 404 si no existe", async () => {
    repo.findChecklistById.mockResolvedValue(null);
    await expect(legalService.getChecklist(3)).rejects.toThrow(/Checklist legal .*no encontrado/);
  });

  it("updateChecklistItem lanza 404 si el item no existe", async () => {
    repo.findChecklistItemById.mockResolvedValue(null);
    await expect(
      legalService.updateChecklistItem(7, { isChecked: true })
    ).rejects.toThrow(/Item del checklist .*no encontrado/);
  });

  it("updateChecklistItem marca el item con auditoria", async () => {
    repo.findChecklistItemById.mockResolvedValue({ id: 7, is_checked: false });
    repo.updateChecklistItem.mockResolvedValue({ id: 7, is_checked: true });
    await legalService.updateChecklistItem(7, { isChecked: true }, 1);
    expect(repo.updateChecklistItem).toHaveBeenCalledWith(
      7,
      expect.objectContaining({ is_checked: true, checked_by: 1 })
    );
  });

  it("no completa checklist vacio", async () => {
    repo.findChecklistById.mockResolvedValue({ id: 1, items: [] });
    await expect(legalService.completeChecklist(1)).rejects.toThrow("no tiene items");
  });

  it("no completa checklist con items pendientes", async () => {
    repo.findChecklistById.mockResolvedValue({
      id: 1,
      items: [{ is_checked: true }, { is_checked: false }],
    });
    await expect(legalService.completeChecklist(1)).rejects.toThrow("deben estar marcados");
  });

  it("completa checklist con todos los items marcados", async () => {
    repo.findChecklistById.mockResolvedValue({
      id: 1,
      items: [{ is_checked: true }, { is_checked: true }],
    });
    repo.completeChecklist.mockResolvedValue({ id: 1, is_complete: true });
    const result = await legalService.completeChecklist(1);
    expect(result.is_complete).toBe(true);
  });

  it("checkLegalCompliance exige checklist completado", async () => {
    repo.findAllChecklists.mockResolvedValue([{ is_complete: false }]);
    await expect(legalService.checkLegalCompliance()).rejects.toThrow(
      "Complete el checklist legal"
    );
  });

  it("checkLegalCompliance retorna compliant cuando hay checklist completo", async () => {
    repo.findAllChecklists.mockResolvedValue([{ is_complete: true }]);
    repo.findActiveChecklist.mockResolvedValue({ id: 1 });
    const result = await legalService.checkLegalCompliance();
    expect(result.compliant).toBe(true);
  });
});
