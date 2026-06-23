import type { PrismaClient } from "@prisma/client";

export interface HistoricalStats {
  completedTickets: number;
  totalStoryPoints: number;
  totalTokens: number;
  totalCost: number;
  totalDurationSeconds: number;
  tokensPerStoryPoint: number;
  costPerStoryPoint: number;
  durationSecondsPerStoryPoint: number;
}

interface PrismaEvent {
  eventType: string;
  payload: Record<string, unknown>;
}

interface TicketWithEvents {
  storyPoints: number | null;
  events: PrismaEvent[];
}

export interface ForecastInput {
  targetStoryPoints?: number;
  targetTokenBudget?: number;
  targetCostBudget?: number;
  targetDurationSeconds?: number;
}

export interface ForecastResult {
  projectId: string;
  historical: HistoricalStats;
  recommendation: {
    recommendedStoryPoints?: number;
    recommendedTokenBudget?: number;
    recommendedCostBudget?: number;
    recommendedDurationSeconds?: number;
    confidence: "low" | "medium" | "high";
  };
  budget: {
    tokenBudget?: number;
    costBudget?: number;
    tokenUsagePercent?: number;
    costUsagePercent?: number;
  } | null;
}

export async function generateForecast(
  prisma: PrismaClient,
  projectId: string,
  input: ForecastInput
): Promise<ForecastResult> {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: {
      tickets: {
        where: { status: "done" },
        include: { events: true },
      },
    },
  });

  if (!project) {
    throw new Error("Project not found");
  }

  const historical = computeHistoricalStats(project.tickets as unknown as TicketWithEvents[]);

  const recommendation = buildRecommendation(historical, input);

  const budget = buildBudgetStatus(
    { tokenBudget: project.tokenBudget, costBudget: project.costBudget },
    historical,
    input
  );

  return {
    projectId,
    historical,
    recommendation,
    budget,
  };
}

function computeHistoricalStats(
  tickets: Array<{ storyPoints: number | null; events: PrismaEvent[] }>
): HistoricalStats {
  const completedTickets = tickets.filter((t) => t.storyPoints && t.storyPoints > 0);
  const totalStoryPoints = completedTickets.reduce((sum, t) => sum + (t.storyPoints || 0), 0);

  let totalTokens = 0;
  let totalCost = 0;
  let totalDurationSeconds = 0;

  for (const ticket of completedTickets) {
    for (const event of ticket.events) {
      const payload = event.payload as Record<string, unknown>;
      if (event.eventType === "llm.response") {
        totalTokens += (payload.totalTokens as number) || 0;
        totalCost += (payload.costUsd as number) || 0;
      } else if (event.eventType === "session.activity") {
        totalDurationSeconds += (payload.durationSeconds as number) || 0;
      } else if (event.eventType === "ci.run") {
        totalCost += (payload.costUsd as number) || 0;
      }
    }
  }

  return {
    completedTickets: completedTickets.length,
    totalStoryPoints,
    totalTokens,
    totalCost,
    totalDurationSeconds,
    tokensPerStoryPoint: totalStoryPoints > 0 ? totalTokens / totalStoryPoints : 0,
    costPerStoryPoint: totalStoryPoints > 0 ? totalCost / totalStoryPoints : 0,
    durationSecondsPerStoryPoint: totalStoryPoints > 0 ? totalDurationSeconds / totalStoryPoints : 0,
  };
}

export function buildRecommendation(
  historical: HistoricalStats,
  input: ForecastInput
): ForecastResult["recommendation"] {
  const confidence = historical.completedTickets < 3 ? "low" : historical.completedTickets < 8 ? "medium" : "high";

  if (input.targetStoryPoints !== undefined) {
    return {
      recommendedTokenBudget: Math.ceil(input.targetStoryPoints * historical.tokensPerStoryPoint),
      recommendedCostBudget: input.targetStoryPoints * historical.costPerStoryPoint,
      recommendedDurationSeconds: Math.ceil(input.targetStoryPoints * historical.durationSecondsPerStoryPoint),
      confidence,
    };
  }

  if (input.targetTokenBudget !== undefined) {
    return {
      recommendedStoryPoints: Math.floor(input.targetTokenBudget / Math.max(historical.tokensPerStoryPoint, 1)),
      recommendedCostBudget: (input.targetTokenBudget / Math.max(historical.tokensPerStoryPoint, 1)) * historical.costPerStoryPoint,
      recommendedDurationSeconds: Math.ceil((input.targetTokenBudget / Math.max(historical.tokensPerStoryPoint, 1)) * historical.durationSecondsPerStoryPoint),
      confidence,
    };
  }

  if (input.targetCostBudget !== undefined) {
    return {
      recommendedStoryPoints: Math.floor(input.targetCostBudget / Math.max(historical.costPerStoryPoint, 0.01)),
      recommendedTokenBudget: (input.targetCostBudget / Math.max(historical.costPerStoryPoint, 0.01)) * historical.tokensPerStoryPoint,
      recommendedDurationSeconds: Math.ceil((input.targetCostBudget / Math.max(historical.costPerStoryPoint, 0.01)) * historical.durationSecondsPerStoryPoint),
      confidence,
    };
  }

  if (input.targetDurationSeconds !== undefined) {
    return {
      recommendedStoryPoints: Math.floor(input.targetDurationSeconds / Math.max(historical.durationSecondsPerStoryPoint, 1)),
      recommendedTokenBudget: (input.targetDurationSeconds / Math.max(historical.durationSecondsPerStoryPoint, 1)) * historical.tokensPerStoryPoint,
      recommendedCostBudget: (input.targetDurationSeconds / Math.max(historical.durationSecondsPerStoryPoint, 1)) * historical.costPerStoryPoint,
      confidence,
    };
  }

  return { confidence };
}

function buildBudgetStatus(
  project: { tokenBudget: number | null; costBudget: number | null },
  historical: HistoricalStats,
  input: ForecastInput
): ForecastResult["budget"] {
  const tokenBudget = input.targetTokenBudget ?? project.tokenBudget ?? undefined;
  const costBudget = input.targetCostBudget ?? project.costBudget ?? undefined;

  if (tokenBudget === undefined && costBudget === undefined) {
    return null;
  }

  return {
    tokenBudget,
    costBudget,
    tokenUsagePercent: tokenBudget !== undefined && historical.totalTokens > 0 ? (historical.totalTokens / tokenBudget) * 100 : undefined,
    costUsagePercent: costBudget !== undefined && historical.totalCost > 0 ? (historical.totalCost / costBudget) * 100 : undefined,
  };
}
