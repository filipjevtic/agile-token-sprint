import type { FastifyInstance, FastifyPluginOptions, FastifyRequest, FastifyReply } from "fastify";
import { getPrisma } from "../db.js";
import { generateForecast, type ForecastInput, type ForecastResult } from "../services/forecast.js";
import { requireAuth, type AuthPayload } from "../middleware/auth.js";
import { assertProjectInWorkspace } from "../middleware/scope.js";

export async function registerForecastRoutes(
  app: FastifyInstance,
  _opts: FastifyPluginOptions
) {
  const prisma = await getPrisma();

  // Join developer-capacity rows with user display names.
  async function enrichDevelopers(forecast: ForecastResult): Promise<ForecastResult> {
    if (forecast.developers.length === 0) return forecast;
    const users = await prisma.user.findMany({
      where: { id: { in: forecast.developers.map((d) => d.userId) } },
      select: { id: true, email: true, displayName: true },
    });
    const userMap = new Map(users.map((u) => [u.id, u]));
    forecast.developers = forecast.developers.map((d) => {
      const u = userMap.get(d.userId);
      return { ...d, name: u ? u.displayName || u.email : d.userId, email: u?.email ?? null };
    });
    return forecast;
  }

  app.get<{ Params: { projectId: string } }>("/project/:projectId", { preHandler: requireAuth }, async (request, reply) => {
    const { workspaceId } = (request as FastifyRequest & { user: AuthPayload }).user;
    if (!(await assertProjectInWorkspace(prisma, reply, request.params.projectId, workspaceId))) return;
    const forecast = await generateForecast(prisma, request.params.projectId, {});
    return enrichDevelopers(forecast);
  });

  app.post<{ Params: { projectId: string }; Body: ForecastInput }>("/project/:projectId", { preHandler: requireAuth }, async (request, reply) => {
    const { workspaceId } = (request as FastifyRequest & { user: AuthPayload }).user;
    if (!(await assertProjectInWorkspace(prisma, reply, request.params.projectId, workspaceId))) return;
    const forecast = await generateForecast(prisma, request.params.projectId, request.body || {});
    return enrichDevelopers(forecast);
  });
}
