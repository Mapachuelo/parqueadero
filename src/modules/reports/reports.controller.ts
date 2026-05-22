import { FastifyRequest, FastifyReply } from "fastify";
import { reportsService } from "./reports.service.js";
import { dateRangeSchema, reportFiltersSchema } from "./reports.schema.js";
import { Role } from "../../shared/types/enums.js";

export async function getOccupancy(request: FastifyRequest, reply: FastifyReply) {
  const query = dateRangeSchema.parse(request.query);

  const result = await reportsService.buildOccupancyReport(query.from, query.to);

  return reply.send({ success: true, data: result });
}

export async function getRevenue(request: FastifyRequest, reply: FastifyReply) {
  const query = dateRangeSchema.parse(request.query);

  const result = await reportsService.buildRevenueReport(query.from, query.to);

  return reply.send({ success: true, data: result });
}

export async function getTransactions(request: FastifyRequest, reply: FastifyReply) {
  const query = reportFiltersSchema.parse(request.query);
  const user = request.user!;

  const result = await reportsService.buildTransactionReport(user.role as Role, user.id, query);

  return reply.send({ success: true, data: result });
}

export async function getUserActivity(request: FastifyRequest, reply: FastifyReply) {
  const query = dateRangeSchema.parse(request.query);

  const result = await reportsService.buildUserActivityReport(query.from, query.to);

  return reply.send({ success: true, data: result });
}

export async function getCompliance(request: FastifyRequest, reply: FastifyReply) {
  const query = dateRangeSchema.parse(request.query);

  const result = await reportsService.buildComplianceReport(query.from, query.to);

  return reply.send({ success: true, data: result });
}
