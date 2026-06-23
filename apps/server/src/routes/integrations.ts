import type { FastifyInstance, FastifyPluginOptions, FastifyRequest, FastifyReply } from "fastify";
import { getPrisma } from "../db.js";
import { syncGitHub, syncJira, syncGitLab } from "../integrations/index.js";

export async function registerIntegrationRoutes(
  app: FastifyInstance,
  _opts: FastifyPluginOptions
) {
  const prisma = await getPrisma();

  app.post("/github/:projectId", async (
    request: FastifyRequest<{ Params: { projectId: string }; Body: { token?: string; owner: string; repo: string } }>,
    reply: FastifyReply
  ) => {
    const { projectId } = request.params;
    const { token, owner, repo } = request.body;

    if (!owner || !repo) {
      return reply.status(400).send({ error: "owner and repo are required" });
    }

    const project = await prisma.project.findUnique({ where: { id: projectId } });
    if (!project) {
      return reply.status(404).send({ error: "Project not found" });
    }

    await prisma.issueTrackerConfig.upsert({
      where: { projectId },
      update: {
        provider: "github",
        baseUrl: `https://github.com/${owner}/${repo}`,
        apiToken: token,
        repository: `${owner}/${repo}`,
      },
      create: {
        projectId,
        provider: "github",
        baseUrl: `https://github.com/${owner}/${repo}`,
        apiToken: token,
        repository: `${owner}/${repo}`,
      },
    });

    const result = await syncGitHub({
      token: token || "",
      owner,
      repo,
      projectId,
    });

    return { success: true, provider: "github", ...result };
  });

  app.post("/jira/:projectId", async (
    request: FastifyRequest<{ Params: { projectId: string }; Body: { baseUrl: string; email: string; token: string; projectKey: string } }>,
    reply: FastifyReply
  ) => {
    const { projectId } = request.params;
    const { baseUrl, email, token, projectKey } = request.body;

    if (!baseUrl || !email || !token || !projectKey) {
      return reply.status(400).send({ error: "baseUrl, email, token, and projectKey are required" });
    }

    const project = await prisma.project.findUnique({ where: { id: projectId } });
    if (!project) {
      return reply.status(404).send({ error: "Project not found" });
    }

    await prisma.issueTrackerConfig.upsert({
      where: { projectId },
      update: {
        provider: "jira",
        baseUrl,
        apiToken: token,
        projectKey,
      },
      create: {
        projectId,
        provider: "jira",
        baseUrl,
        apiToken: token,
        projectKey,
      },
    });

    const result = await syncJira({
      baseUrl,
      email,
      token,
      projectKey,
      projectId,
    });

    return { success: true, provider: "jira", ...result };
  });

  app.post("/gitlab/:projectId", async (
    request: FastifyRequest<{ Params: { projectId: string }; Body: { baseUrl?: string; token: string; projectPath: string } }>,
    reply: FastifyReply
  ) => {
    const { projectId } = request.params;
    const { baseUrl = "https://gitlab.com", token, projectPath } = request.body;

    if (!token || !projectPath) {
      return reply.status(400).send({ error: "token and projectPath are required" });
    }

    const project = await prisma.project.findUnique({ where: { id: projectId } });
    if (!project) {
      return reply.status(404).send({ error: "Project not found" });
    }

    await prisma.issueTrackerConfig.upsert({
      where: { projectId },
      update: {
        provider: "gitlab",
        baseUrl,
        apiToken: token,
        repository: projectPath,
      },
      create: {
        projectId,
        provider: "gitlab",
        baseUrl,
        apiToken: token,
        repository: projectPath,
      },
    });

    const result = await syncGitLab({
      baseUrl,
      token,
      projectPath,
      projectId,
    });

    return { success: true, provider: "gitlab", ...result };
  });
}
