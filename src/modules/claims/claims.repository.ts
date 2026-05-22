import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const claimsRepository = {
  async createClaim(data: {
    claim_id: string;
    transaction_id?: number;
    reported_by?: number;
    category: string;
    description: string;
    status: string;
    resolution_deadline: Date;
  }) {
    return prisma.claim.create({
      data: data as any,
    });
  },

  async findClaimById(id: number) {
    return prisma.claim.findUnique({
      where: { id },
      include: {
        evidence: true,
        notes: true,
        reporter: { select: { id: true, username: true, full_name: true } },
        investigator: { select: { id: true, username: true, full_name: true } },
      },
    });
  },

  async findClaimByClaimId(claimId: string) {
    return prisma.claim.findUnique({
      where: { claim_id: claimId },
      include: {
        evidence: true,
        notes: true,
        reporter: { select: { id: true, username: true, full_name: true } },
        investigator: { select: { id: true, username: true, full_name: true } },
      },
    });
  },

  async findAllClaims(filters: {
    status?: string;
    category?: string;
    page: number;
    limit: number;
  }) {
    const where: any = {};
    if (filters.status) where.status = filters.status;
    if (filters.category) where.category = filters.category;

    const [claims, total] = await Promise.all([
      prisma.claim.findMany({
        where,
        skip: (filters.page - 1) * filters.limit,
        take: filters.limit,
        orderBy: { created_at: "desc" },
        include: {
          reporter: { select: { id: true, username: true, full_name: true } },
          investigator: { select: { id: true, username: true, full_name: true } },
        },
      }),
      prisma.claim.count({ where }),
    ]);

    return { claims, total, page: filters.page, limit: filters.limit };
  },

  async updateClaim(id: number, data: any) {
    return prisma.claim.update({
      where: { id },
      data,
    });
  },

  async addEvidence(claimId: number, data: {
    file_path: string;
    description?: string;
    uploaded_by?: number;
  }) {
    return prisma.claimEvidence.create({
      data: {
        claim_id: claimId,
        file_path: data.file_path,
        description: data.description,
        uploaded_by: data.uploaded_by,
      },
    });
  },

  async addNote(claimId: number, data: { content: string; author_id?: number }) {
    return prisma.claimNote.create({
      data: {
        claim_id: claimId,
        content: data.content,
        author_id: data.author_id,
      },
    });
  },

  async resolveClaim(id: number, data: {
    resolution: string;
    compensation_amount?: number;
    resolution_date: Date;
    status: string;
  }) {
    return prisma.claim.update({
      where: { id },
      data: {
        resolution: data.resolution,
        compensation_amount: data.compensation_amount,
        resolution_date: data.resolution_date,
        status: data.status as any,
      },
    });
  },

  async getMaxClaimSeq(datePart: string) {
    const claims = await prisma.claim.findMany({
      where: { claim_id: { startsWith: `CLM-${datePart}` } },
      orderBy: { claim_id: "desc" },
      take: 1,
    });

    if (claims.length === 0) return 0;

    const lastId = claims[0].claim_id;
    const seqPart = lastId.split("-").pop();
    return seqPart ? parseInt(seqPart, 10) : 0;
  },

  async findTransactionByTxnId(transactionId: string) {
    return prisma.vehicleTransaction.findUnique({
      where: { transaction_id: transactionId },
    });
  },
};
