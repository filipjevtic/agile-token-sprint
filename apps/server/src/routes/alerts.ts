import type { FastifyInstance, FastifyPluginOptions, FastifyRequest, FastifyReply } from "fastify";
import { getPrisma } from "../db.js";
import { getProjectAlerts, getSprintAlerts } from "../services/alerts.js";

export async function registerAlertRoutes(
  app: FastifyInstance,
  _opts: FastifyPluginOptions
) {
  const prisma = await getPrisma();

  app.get("/project/:projectId", async (
    request: FastifyRequest<{ Params: { projectId: string } }>,
    reply: FastifyReply
  ) => {
    const alerts = await getProjectAlerts(prisma, request.params.projectId);
    return { alerts };
  });

  app.get("/sprint/:sprintId", async (
    request: FastifyRequest<{ Params: { sprintId: string } }>,
    reply: FastifyReply
  ) => {
    const alerts = await getSprintAlerts(prisma, request.params.sprintId);
    return { alerts };
  });
}
