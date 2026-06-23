import type { FastifyInstance, FastifyPluginOptions, FastifyRequest, FastifyReply } from "fastify";
import { listTeamMembers, addTeamMember, removeTeamMember, updateTeamMember, type TeamRole } from "../services/team.js";
import { requireAuth, requireAdmin } from "../middleware/auth.js";

export async function registerTeamRoutes(
  app: FastifyInstance,
  _opts: FastifyPluginOptions
) {
  app.get<{ Params: { projectId: string } }>("/:projectId", { preHandler: requireAuth }, async (request, reply) => {
    try {
      const members = await listTeamMembers(request.params.projectId);
      return { members };
    } catch (err) {
      return reply.status(500).send({ error: err instanceof Error ? err.message : "Failed to list members" });
    }
  });

  app.post<{ Params: { projectId: string }; Body: { email: string; displayName?: string; role: TeamRole } }>("/:projectId", { preHandler: requireAdmin }, async (request, reply) => {
    const { projectId } = request.params;
    const { email, displayName, role } = request.body;

    if (!email || !role) {
      return reply.status(400).send({ error: "email and role are required" });
    }

    try {
      const member = await addTeamMember({ projectId, email, displayName, role });
      return { member };
    } catch (err) {
      return reply.status(500).send({ error: err instanceof Error ? err.message : "Failed to add member" });
    }
  });

  app.put<{ Params: { projectId: string; userId: string }; Body: { role: TeamRole } }>("/:projectId/:userId", { preHandler: requireAdmin }, async (request, reply) => {
    const { projectId, userId } = request.params;
    const { role } = request.body;

    if (!role) {
      return reply.status(400).send({ error: "role is required" });
    }

    try {
      await updateTeamMember(projectId, userId, role);
      return { success: true };
    } catch (err) {
      return reply.status(500).send({ error: err instanceof Error ? err.message : "Failed to update member" });
    }
  });

  app.delete<{ Params: { projectId: string; userId: string } }>("/:projectId/:userId", { preHandler: requireAdmin }, async (request, reply) => {
    try {
      await removeTeamMember(request.params.projectId, request.params.userId);
      return { success: true };
    } catch (err) {
      return reply.status(500).send({ error: err instanceof Error ? err.message : "Failed to remove member" });
    }
  });
}
