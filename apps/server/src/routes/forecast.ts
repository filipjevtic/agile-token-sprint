import type { FastifyInstance, FastifyPluginOptions, FastifyRequest, FastifyReply } from "fastify";
import { getPrisma } from "../db.js";
import { generateForecast, type ForecastInput } from "../services/forecast.js";

export async function registerForecastRoutes(
  app: FastifyInstance,
  _opts: FastifyPluginOptions
) {
  const prisma = await getPrisma();

  app.get("/project/:projectId", async (request: FastifyRequest<{ Params: { projectId: string } }>, reply: FastifyReply) => {
    const forecast = await generateForecast(prisma, request.params.projectId, {});
    return forecast;
  });

  app.post("/project/:projectId", async (request: FastifyRequest<{ Params: { projectId: string }; Body: ForecastInput }>, reply: FastifyReply) => {
    const forecast = await generateForecast(prisma, request.params.projectId, request.body || {});
    return forecast;
  });
}
