import type { FastifyInstance, FastifyPluginOptions, FastifyRequest, FastifyReply } from "fastify";
import { getPrisma } from "../db.js";

export async function registerProjectRoutes(
  app: FastifyInstance,
  _opts: FastifyPluginOptions
) {
  const prisma = await getPrisma();

  app.put("/:projectId", async (
    request: FastifyRequest<{
      Params: { projectId: string };
      Body: { tokenBudget?: number; costBudget?: number; tokenBudgetAlertThreshold?: number; costBudgetAlertThreshold?: number };
    }>,
    reply: FastifyReply
  ) => {
    const project = await prisma.project.update({
      where: { id: request.params.projectId },
      data: {
        tokenBudget: request.body.tokenBudget,
        costBudget: request.body.costBudget,
        tokenBudgetAlertThreshold: request.body.tokenBudgetAlertThreshold,
        costBudgetAlertThreshold: request.body.costBudgetAlertThreshold,
      },
    });
    return project;
  });

  app.put("/sprint/:sprintId", async (
    request: FastifyRequest<{
      Params: { sprintId: string };
      Body: { tokenBudget?: number; costBudget?: number; tokenBudgetAlertThreshold?: number; costBudgetAlertThreshold?: number };
    }>,
    reply: FastifyReply
  ) => {
    const sprint = await prisma.sprint.update({
      where: { id: request.params.sprintId },
      data: {
        tokenBudget: request.body.tokenBudget,
        costBudget: request.body.costBudget,
        tokenBudgetAlertThreshold: request.body.tokenBudgetAlertThreshold,
        costBudgetAlertThreshold: request.body.costBudgetAlertThreshold,
      },
    });
    return sprint;
  });
}
