import type { FastifyInstance, FastifyPluginOptions, FastifyRequest, FastifyReply } from "fastify";
import { getPrisma } from "../db.js";
import { generateForecast, type ForecastInput } from "../services/forecast.js";
import { requireAuth } from "../middleware/auth.js";

export async function registerForecastRoutes(
  app: FastifyInstance,
  _opts: FastifyPluginOptions
) {
  const prisma = await getPrisma();

  app.get<{ Params: { projectId: string } }>("/project/:projectId", { preHandler: requireAuth }, async (request, reply) => {
    const forecast = await generateForecast(prisma, request.params.projectId, {});
    return forecast;
  });

  app.post<{ Params: { projectId: string }; Body: ForecastInput }>("/project/:projectId", { preHandler: requireAuth }, async (request, reply) => {
    const forecast = await generateForecast(prisma, request.params.projectId, request.body || {});
    return forecast;
  });
}
