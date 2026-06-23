import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const MODELS = ["gpt-4o", "gpt-4o-mini", "claude-3-5-sonnet"];
const MODEL_COSTS: Record<string, number> = {
  "gpt-4o": 5 / 1_000_000,
  "gpt-4o-mini": 0.15 / 1_000_000,
  "claude-3-5-sonnet": 3 / 1_000_000,
};

async function main() {
  const workspace = await prisma.workspace.upsert({
    where: { slug: "default" },
    update: {},
    create: {
      slug: "default",
      name: "Default Workspace",
    },
  });

  const project = await prisma.project.upsert({
    where: {
      workspaceId_slug: {
        workspaceId: workspace.id,
        slug: "default",
      },
    },
    update: {
      tokenBudget: 100_000,
      costBudget: 5.0,
      tokenBudgetAlertThreshold: 80,
      costBudgetAlertThreshold: 80,
    },
    create: {
      id: "default",
      workspaceId: workspace.id,
      slug: "default",
      name: "Demo Project",
      tokenBudget: 100_000,
      costBudget: 5.0,
      tokenBudgetAlertThreshold: 80,
      costBudgetAlertThreshold: 80,
    },
  });

  const user = await prisma.user.upsert({
    where: {
      id: "default",
    },
    update: {},
    create: {
      id: "default",
      workspaceId: workspace.id,
      email: "dev@example.com",
      displayName: "Demo Developer",
    },
  });

  const pm = await prisma.user.upsert({
    where: {
      workspaceId_email: {
        workspaceId: workspace.id,
        email: "pm@example.com",
      },
    },
    update: {},
    create: {
      workspaceId: workspace.id,
      email: "pm@example.com",
      displayName: "Demo PM",
    },
  });

  await prisma.teamMember.upsert({
    where: {
      projectId_userId: {
        projectId: project.id,
        userId: pm.id,
      },
    },
    update: { role: "admin" },
    create: {
      projectId: project.id,
      userId: pm.id,
      role: "admin",
    },
  });

  const sprint = await prisma.sprint.upsert({
    where: {
      projectId_externalId: {
        projectId: project.id,
        externalId: "DEMO-1",
      },
    },
    update: {
      name: "Sprint 1",
      startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      status: "active",
      goal: "Prove PM value for token-based sprint planning.",
      tokenBudget: 60_000,
      costBudget: 3.0,
    },
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
      where: {
        projectId_externalId: {
          projectId: project.id,
          externalId: t.externalId,
        },
      },
      update: {},
      create: {
        projectId: project.id,
        sprintId: sprint.id,
        externalId: t.externalId,
        title: t.title,
        status: t.status,
        storyPoints: t.storyPoints,
        assigneeId: user.id,
      },
    });
    tickets.push(ticket);
  }

  // Seed realistic LLM response events for each ticket.
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
      const eventId = `seed-${eventSeq++}`;

      await prisma.event.upsert({
        where: { eventId },
        update: {},
        create: {
          eventId,
          eventType: "llm.response",
          timestamp: new Date(now - Math.floor(Math.random() * 14 * 24 * 60 * 60 * 1000)),
          source: "ide-plugin",
          workspaceId: workspace.id,
          projectId: project.id,
          userId: user.id,
          ticketId: ticket.id,
          payload: {
            provider: model.startsWith("gpt") ? "openai" : "anthropic",
            model,
            promptTokens,
            completionTokens,
            totalTokens,
            costUsd,
            latencyMs: 500 + Math.floor(Math.random() * 2000),
          },
          metadata: {
            seed: true,
            associationMethod: "explicit",
            associationConfidence: 1.0,
          },
        },
      });
    }
  }

  // Seed session activity events.
  for (let i = 0; i < 10; i++) {
    const ticket = tickets[Math.floor(Math.random() * tickets.length)];
    const durationSeconds = 300 + Math.floor(Math.random() * 3600);
    await prisma.event.upsert({
      where: { eventId: `seed-session-${i}` },
      update: {},
      create: {
        eventId: `seed-session-${i}`,
        eventType: "session.activity",
        timestamp: new Date(now - Math.floor(Math.random() * 14 * 24 * 60 * 60 * 1000)),
        source: "cli",
        workspaceId: workspace.id,
        projectId: project.id,
        userId: user.id,
        ticketId: ticket.id,
        payload: {
          activityType: "coding",
          durationSeconds,
          startTime: new Date(now - durationSeconds * 1000).toISOString(),
          endTime: new Date(now).toISOString(),
        },
        metadata: {
          seed: true,
          associationMethod: "explicit",
          associationConfidence: 1.0,
        },
      },
    });
  }

  // Seed CI/CD run events.
  const ciUser = await prisma.user.upsert({
    where: {
      workspaceId_email: {
        workspaceId: workspace.id,
        email: "ci@system",
      },
    },
    update: {},
    create: {
      workspaceId: workspace.id,
      email: "ci@system",
      displayName: "CI/CD",
    },
  });

  for (let i = 0; i < 8; i++) {
    const ticket = tickets[Math.floor(Math.random() * tickets.length)];
    const durationSeconds = 120 + Math.floor(Math.random() * 600);
    const costUsd = Number(((durationSeconds / 60) * 0.008).toFixed(4));
    await prisma.event.upsert({
      where: { eventId: `seed-ci-${i}` },
      update: {},
      create: {
        eventId: `seed-ci-${i}`,
        eventType: "ci.run",
        timestamp: new Date(now - Math.floor(Math.random() * 14 * 24 * 60 * 60 * 1000)),
        source: "ci",
        workspaceId: workspace.id,
        projectId: project.id,
        userId: ciUser.id,
        ticketId: ticket.id,
        payload: {
          pipelineName: "build-and-test",
          runId: `run-${i + 1}`,
          status: Math.random() > 0.2 ? "success" : "failure",
          durationSeconds,
          costUsd,
          triggerBranch: `feature/${ticket.externalId}`,
          triggerCommitSha: `deadbeef${i}`,
        },
        metadata: {
          seed: true,
          associationMethod: "explicit",
          associationConfidence: 1.0,
        },
      },
    });
  }

  console.log("Seeded default workspace, project, sprint, team, and demo events.");
  console.log(`Project ID: ${project.id}`);
  console.log(`Sprint ID: ${sprint.id}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
