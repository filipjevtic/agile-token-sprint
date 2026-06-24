import type { FastifyInstance, FastifyPluginOptions, FastifyRequest, FastifyReply } from "fastify";
import { getPrisma } from "../db.js";
import { requireAuth, type AuthPayload } from "../middleware/auth.js";
import { assertProjectInWorkspace } from "../middleware/scope.js";
import { rollupEvents } from "../services/rollup.js";

/**
 * Dashboard-facing analytics. These endpoints are JWT-authenticated (browser)
 * and workspace-scoped, distinct from the API-key collector endpoints under
 * /api/v1/sessions.
 */
export async function registerAnalyticsRoutes(
  app: FastifyInstance,
  _opts: FastifyPluginOptions
) {
  const prisma = await getPrisma();

  // List sessions for a project with per-session usage rollups.
  app.get<{
    Querystring: { projectId?: string; sprintId?: string; status?: string; limit?: string };
  }>("/sessions", { preHandler: requireAuth }, async (request, reply) => {
    const { workspaceId } = (request as FastifyRequest & { user: AuthPayload }).user;
    const { projectId, sprintId, status } = request.query;
    if (!projectId) {
      return reply.status(400).send({ error: "projectId is required" });
    }
    if (!(await assertProjectInWorkspace(prisma, reply, projectId, workspaceId))) return;

    const limit = Math.min(Math.max(Number(request.query.limit) || 50, 1), 200);

    const sessions = await prisma.session.findMany({
      where: {
        projectId,
        ...(status ? { status } : {}),
        ...(sprintId ? { ticket: { sprintId } } : {}),
      },
      orderBy: { startedAt: "desc" },
      take: limit,
      include: {
        user: { select: { id: true, email: true, displayName: true } },
        ticket: { select: { id: true, externalId: true, title: true } },
        events: { select: { eventType: true, payload: true } },
      },
    });

    return {
      sessions: sessions.map((s) => {
        const rollup = rollupEvents(s.events);
        return {
          id: s.id,
          status: s.status,
          source: s.source,
          branch: s.branch,
          ticketKey: s.ticketKey,
          startedAt: s.startedAt,
          endedAt: s.endedAt,
          user: s.user
            ? { id: s.user.id, name: s.user.displayName || s.user.email, email: s.user.email }
            : null,
          ticket: s.ticket
            ? { id: s.ticket.id, externalId: s.ticket.externalId, title: s.ticket.title }
            : null,
          tokens: rollup.tokens,
          cost: rollup.cost,
          durationSeconds: rollup.durationSeconds,
          eventCount: rollup.eventCount,
        };
      }),
    };
  });

  // Session detail with its events and a rollup.
  app.get<{ Params: { id: string } }>("/sessions/:id", { preHandler: requireAuth }, async (request, reply) => {
    const { workspaceId } = (request as FastifyRequest & { user: AuthPayload }).user;
    const session = await prisma.session.findUnique({
      where: { id: request.params.id },
      include: {
        user: { select: { id: true, email: true, displayName: true } },
        ticket: { select: { id: true, externalId: true, title: true } },
        events: {
          orderBy: { timestamp: "asc" },
          select: { id: true, eventType: true, source: true, timestamp: true, payload: true },
        },
      },
    });

    if (!session || session.workspaceId !== workspaceId) {
      return reply.status(404).send({ error: "Session not found" });
    }

    const rollup = rollupEvents(session.events);
    return {
      session: {
        id: session.id,
        status: session.status,
        source: session.source,
        branch: session.branch,
        ticketKey: session.ticketKey,
        startedAt: session.startedAt,
        endedAt: session.endedAt,
        user: session.user
          ? { id: session.user.id, name: session.user.displayName || session.user.email, email: session.user.email }
          : null,
        ticket: session.ticket
          ? { id: session.ticket.id, externalId: session.ticket.externalId, title: session.ticket.title }
          : null,
      },
      summary: {
        totalTokens: rollup.tokens,
        totalCost: rollup.cost,
        totalDurationSeconds: rollup.durationSeconds,
        eventCount: rollup.eventCount,
      },
      events: session.events,
    };
  });
}
