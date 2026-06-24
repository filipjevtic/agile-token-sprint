import type { FastifyInstance, FastifyPluginOptions, FastifyRequest, FastifyReply } from "fastify";
import { getPrisma } from "../db.js";
import { requireAuth, type AuthPayload } from "../middleware/auth.js";
import { assertProjectInWorkspace, assertTicketInWorkspace } from "../middleware/scope.js";
import { rollupEvents } from "../services/rollup.js";

export async function registerTicketRoutes(
  app: FastifyInstance,
  _opts: FastifyPluginOptions
) {
  const prisma = await getPrisma();

  app.get<{ Params: { projectId: string } }>("/project/:projectId", { preHandler: requireAuth }, async (request, reply) => {
    const { workspaceId } = (request as FastifyRequest & { user: AuthPayload }).user;
    if (!(await assertProjectInWorkspace(prisma, reply, request.params.projectId, workspaceId))) return;
    const tickets = await prisma.ticket.findMany({
      where: { projectId: request.params.projectId },
      include: { sprint: true },
      orderBy: { updatedAt: "desc" },
    });
    return { tickets };
  });

  app.get<{ Params: { ticketId: string } }>("/summary/:ticketId", { preHandler: requireAuth }, async (request, reply) => {
    const { workspaceId } = (request as FastifyRequest & { user: AuthPayload }).user;
    if (!(await assertTicketInWorkspace(prisma, reply, request.params.ticketId, workspaceId))) return;
    const ticket = await prisma.ticket.findUnique({
      where: { id: request.params.ticketId },
      include: { events: true },
    });

    if (!ticket) {
      return reply.status(404).send({ error: "Ticket not found" });
    }

    const rollup = rollupEvents(ticket.events);

    return {
      ticket: {
        id: ticket.id,
        externalId: ticket.externalId,
        title: ticket.title,
        status: ticket.status,
        storyPoints: ticket.storyPoints,
      },
      summary: {
        totalTokens: rollup.tokens,
        totalCost: rollup.cost,
        totalDurationSeconds: rollup.durationSeconds,
        eventCount: rollup.eventCount,
      },
    };
  });
}
