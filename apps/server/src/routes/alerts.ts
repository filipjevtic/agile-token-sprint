import type { FastifyInstance, FastifyPluginOptions, FastifyRequest, FastifyReply } from "fastify";
import { getPrisma } from "../db.js";
import { getProjectAlerts, getSprintAlerts } from "../services/alerts.js";
import { requireAuth } from "../middleware/auth.js";

export async function registerAlertRoutes(
  app: FastifyInstance,
  _opts: FastifyPluginOptions
) {
  const prisma = await getPrisma();

  app.get<{ Params: { projectId: string } }>("/project/:projectId", { preHandler: requireAuth }, async (request, reply) => {
    const alerts = await getProjectAlerts(prisma, request.params.projectId);
    return { alerts };
  });

  app.get<{ Params: { sprintId: string } }>("/sprint/:sprintId", { preHandler: requireAuth }, async (request, reply) => {
    const alerts = await getSprintAlerts(prisma, request.params.sprintId);
    return { alerts };
  });
}
