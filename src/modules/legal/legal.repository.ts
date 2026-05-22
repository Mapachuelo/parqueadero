import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const legalRepository = {
  async findAllCustodyTerms() {
    return prisma.custodyTerms.findMany({
      orderBy: { created_at: "desc" },
    });
  },

  async findActiveCustodyTerms() {
    return prisma.custodyTerms.findFirst({
      where: { is_active: true },
      orderBy: { created_at: "desc" },
    });
  },

  async createCustodyTerms(data: { version: string; content: string; created_by?: number }) {
    return prisma.custodyTerms.create({ data });
  },

  async activateCustodyTerms(id: number) {
    await prisma.custodyTerms.updateMany({
      where: { is_active: true },
      data: { is_active: false },
    });

    return prisma.custodyTerms.update({
      where: { id },
      data: { is_active: true },
    });
  },

  async findCustodyTermsById(id: number) {
    return prisma.custodyTerms.findUnique({
      where: { id },
    });
  },

  async findCustodyTermsByVersion(version: string) {
    return prisma.custodyTerms.findUnique({
      where: { version },
    });
  },

  async findAllChecklists() {
    return prisma.legalChecklist.findMany({
      include: { items: true },
      orderBy: { created_at: "desc" },
    });
  },

  async findActiveChecklist() {
    return prisma.legalChecklist.findFirst({
      where: { is_complete: false },
      include: { items: true },
      orderBy: { created_at: "desc" },
    });
  },

  async createChecklist(data: { name: string; description?: string; created_by?: number }) {
    return prisma.legalChecklist.create({ data });
  },

  async addChecklistItem(checklistId: number, data: { category: string; description: string }) {
    return prisma.legalChecklistItem.create({
      data: {
        checklist_id: checklistId,
        category: data.category as any,
        description: data.description,
      },
    });
  },

  async findChecklistItemById(itemId: number) {
    return prisma.legalChecklistItem.findUnique({
      where: { id: itemId },
      include: { checklist: true },
    });
  },

  async updateChecklistItem(itemId: number, data: { is_checked: boolean; checked_by?: number; checked_at?: Date | null }) {
    return prisma.legalChecklistItem.update({
      where: { id: itemId },
      data,
    });
  },

  async completeChecklist(id: number) {
    return prisma.legalChecklist.update({
      where: { id },
      data: {
        is_complete: true,
        completed_at: new Date(),
      },
    });
  },

  async findChecklistById(id: number) {
    return prisma.legalChecklist.findUnique({
      where: { id },
      include: { items: true },
    });
  },
};
