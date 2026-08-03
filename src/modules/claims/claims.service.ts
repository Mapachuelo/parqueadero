import { AppError } from "../../shared/errors/app-error.js";
import { generateClaimId } from "../../shared/utils/ids.js";
import { addDays } from "../../shared/utils/date.js";
import { claimsRepository } from "./claims.repository.js";

export const claimsService = {
  async resolveClaimEntity(id: string) {
    const numericId = Number(id);
    if (Number.isInteger(numericId) && numericId > 0) {
      return claimsRepository.findClaimById(numericId);
    }
    return claimsRepository.findClaimByClaimId(id);
  },

  async createClaim(reporterId: number, data: {
    transactionId?: string;
    category: string;
    description: string;
  }) {
    const now = new Date();
    const datePart = now.toISOString().slice(0, 10).replace(/-/g, "");
    const seq = await claimsRepository.getMaxClaimSeq(datePart);
    const claimId = generateClaimId(seq + 1);
    const resolutionDeadline = addDays(now, 30);

    let transactionIdNum: number | undefined;
    if (data.transactionId) {
      const tx = await claimsRepository.findTransactionByTxnId(data.transactionId);
      if (!tx) {
        throw AppError.notFound("Transaccion", data.transactionId);
      }
      transactionIdNum = tx.id;
    }

    return claimsRepository.createClaim({
      claim_id: claimId,
      transaction_id: transactionIdNum,
      reported_by: reporterId,
      category: data.category,
      description: data.description,
      status: "abierto",
      resolution_deadline: resolutionDeadline,
    });
  },

  async getClaims(filters: { status?: string; category?: string; page?: number; limit?: number }) {
    return claimsRepository.findAllClaims({
      status: filters.status,
      category: filters.category,
      page: filters.page ?? 1,
      limit: filters.limit ?? 20,
    });
  },

  async getClaim(id: string) {
    const claim = await this.resolveClaimEntity(id);
    if (!claim) {
      throw AppError.notFound("Reclamo", id);
    }
    return claim;
  },

  async updateClaim(adminId: number, id: string, data: {
    status?: string;
    assignedTo?: number;
    resolution?: string;
    compensationAmount?: number;
  }) {
    const claim = await this.resolveClaimEntity(id);
    if (!claim) {
      throw AppError.notFound("Reclamo", id);
    }

    const updateData: any = {};
    if (data.status !== undefined) updateData.status = data.status;
    if (data.assignedTo !== undefined) updateData.assigned_to = data.assignedTo;
    if (data.resolution !== undefined) updateData.resolution = data.resolution;
    if (data.compensationAmount !== undefined) updateData.compensation_amount = data.compensationAmount;

    return claimsRepository.updateClaim(claim.id, updateData);
  },

  async addEvidence(uploaderId: number, claimId: string, data: {
    filePath: string;
    description?: string;
  }) {
    const claim = await this.resolveClaimEntity(claimId);
    if (!claim) {
      throw AppError.notFound("Reclamo", claimId);
    }

    return claimsRepository.addEvidence(claim.id, {
      file_path: data.filePath,
      description: data.description,
      uploaded_by: uploaderId,
    });
  },

  async addNote(authorId: number, claimId: string, content: string) {
    const claim = await this.resolveClaimEntity(claimId);
    if (!claim) {
      throw AppError.notFound("Reclamo", claimId);
    }

    return claimsRepository.addNote(claim.id, {
      content,
      author_id: authorId,
    });
  },

  async resolveClaim(adminId: number, id: string, data: {
    resolution: string;
    compensationAmount?: number;
  }) {
    const claim = await this.resolveClaimEntity(id);
    if (!claim) {
      throw AppError.notFound("Reclamo", id);
    }

    if (claim.status === "resuelto" || claim.status === "rechazado") {
      throw AppError.badRequest("El reclamo ya ha sido finalizado");
    }

    return claimsRepository.resolveClaim(claim.id, {
      resolution: data.resolution,
      compensation_amount: data.compensationAmount,
      resolution_date: new Date(),
      status: "resuelto",
    });
  },
};
