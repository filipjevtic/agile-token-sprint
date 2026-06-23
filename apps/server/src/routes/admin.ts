import type { FastifyInstance, FastifyPluginOptions, FastifyRequest, FastifyReply } from "fastify";
import { getPrisma } from "../db.js";
import { requireAdmin, type AuthPayload } from "../middleware/auth.js";

const MODELS = ["gpt-4o", "gpt-4o-mini", "claude-3-5-sonnet"];
const MODEL_COSTS: Record<string, number> = {
  "gpt-4o": 5 / 1_000_000,
  "gpt-4o-mini": 0.15 / 1_000_000,
  "claude-3-5-sonnet": 3 / 1_000_000,
};

export async function registerAdminRoutes(
  app: FastifyInstance,
  _opts: FastifyPluginOptions
) {
  const prisma = await getPrisma();

  app.post(
    "/seed-demo",
    { preHandler: requireAdmin },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const { workspaceId, userId } = (request as FastifyRequest & { user: AuthPayload }).user;

      const project = await prisma.project.upsert({
        where: { workspaceId_slug: { workspaceId, slug: "demo" } },
        update: { tokenBudget: 100_000, costBudget: 5.0 },
        create: {
          workspaceId,
          slug: "demo",
          name: "Demo Project",
          tokenBudget: 100_000,
          costBudget: 5.0,
          tokenBudgetAlertThreshold: 80,
          costBudgetAlertThreshold: 80,
        },
      });

      await prisma.teamMember.upsert({
        where: { projectId_userId: { projectId: project.id, userId } },
        update: { role: "admin" },
        create: { projectId: project.id, userId, role: "admin" },
      });

      const sprint = await prisma.sprint.upsert({
        where: { projectId_externalId: { projectId: project.id, externalId: "DEMO-1" } },
        update: {},
        create: {
          projectId: project.id,
          externalId: "DEMO-1",
          name: "Sprint 1",
          startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          status: "active",
          goal: "Prove PM value for token-based sprint planning.",
          tokenBudget: 60_000,
          costBudget: 3.0,
        },
      });

      const ticketData = [
        { externalId: "DEMO-101", title: "Set up event ingestion API", storyPoints: 3, status: "done" },
        { externalId: "DEMO-102", title: "Implement ticket association rules", storyPoints: 5, status: "in-progress" },
        { externalId: "DEMO-103", title: "Build sprint dashboard", storyPoints: 5, status: "todo" },
        { externalId: "DEMO-104", title: "Add budget alerts", storyPoints: 3, status: "done" },
        { externalId: "DEMO-105", title: "Sync Jira issues", storyPoints: 5, status: "in-progress" },
      ];

      const tickets = [];
      for (const t of ticketData) {
        const ticket = await prisma.ticket.upsert({
          where: { projectId_externalId: { projectId: project.id, externalId: t.externalId } },
          update: {},
          create: {
            projectId: project.id,
            sprintId: sprint.id,
            externalId: t.externalId,
            title: t.title,
            status: t.status,
            storyPoints: t.storyPoints,
            assigneeId: userId,
          },
        });
        tickets.push(ticket);
      }

      let eventSeq = 1;
      const now = Date.now();
      for (const ticket of tickets) {
        const eventCount = 5 + Math.floor(Math.random() * 15);
        for (let i = 0; i < eventCount; i++) {
          const model = MODELS[Math.floor(Math.random() * MODELS.length)];
          const promptTokens = 200 + Math.floor(Math.random() * 800);
          const completionTokens = 100 + Math.floor(Math.random() * 400);
          const totalTokens = promptTokens + completionTokens;
          const costUsd = Number((totalTokens * MODEL_COSTS[model]).toFixed(6));
          const eventId = `demo-seed-${project.id}-${eventSeq++}`;
          await prisma.event.upsert({
            where: { eventId },
            update: {},
            create: {
              eventId,
              eventType: "llm.response",
              timestamp: new Date(now - Math.floor(Math.random() * 14 * 24 * 60 * 60 * 1000)),
              source: "ide-plugin",
              workspaceId,
              projectId: project.id,
              userId,
              ticketId: ticket.id,
              payload: { provider: model.startsWith("gpt") ? "openai" : "anthropic", model, promptTokens, completionTokens, totalTokens, costUsd },
              metadata: { seed: true, associationMethod: "explicit", associationConfidence: 1.0 },
            },
          });
        }
      }

      return reply.send({ success: true, projectId: project.id, projectSlug: project.slug });
    }
  );
}
