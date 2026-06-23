import type { FastifyInstance, FastifyPluginOptions, FastifyRequest, FastifyReply } from "fastify";
import { getPrisma } from "../db.js";

export async function registerTicketRoutes(
  app: FastifyInstance,
  _opts: FastifyPluginOptions
) {
  const prisma = await getPrisma();

  app.get("/project/:projectId", async (request: FastifyRequest<{ Params: { projectId: string } }>, reply: FastifyReply) => {
    const tickets = await prisma.ticket.findMany({
      where: { projectId: request.params.projectId },
      include: { sprint: true },
      orderBy: { updatedAt: "desc" },
    });
    return { tickets };
  });

  app.get("/summary/:ticketId", async (request: FastifyRequest<{ Params: { ticketId: string } }>, reply: FastifyReply) => {
    const ticket = await prisma.ticket.findUnique({
      where: { id: request.params.ticketId },
      include: { events: true },
    });

    if (!ticket) {
      return reply.status(404).send({ error: "Ticket not found" });
    }

    let totalTokens = 0;
    let totalCost = 0;
    let totalDuration = 0;

    for (const event of ticket.events) {
      const payload = event.payload as Record<string, unknown>;
      if (event.eventType === "llm.response") {
        totalTokens += (payload.totalTokens as number) || 0;
        totalCost += (payload.costUsd as number) || 0;
      } else if (event.eventType === "session.activity") {
        totalDuration += (payload.durationSeconds as number) || 0;
      } else if (event.eventType === "ci.run") {
        totalCost += (payload.costUsd as number) || 0;
      }
    }

    return {
      ticket: {
        id: ticket.id,
        externalId: ticket.externalId,
        title: ticket.title,
        status: ticket.status,
        storyPoints: ticket.storyPoints,
      },
      summary: {
        totalTokens,
        totalCost,
        totalDurationSeconds: totalDuration,
        eventCount: ticket.events.length,
      },
    };
  });
}
