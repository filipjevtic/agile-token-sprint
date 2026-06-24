import { describe, it } from "node:test";
import assert from "node:assert";
import { buildRecommendation, computeDeveloperCapacity } from "./forecast.js";

function makeHistorical(overrides: Partial<Parameters<typeof buildRecommendation>[0]> = {}) {
  return {
    completedTickets: 5,
    totalStoryPoints: 10,
    totalTokens: 10000,
    totalCost: 0.5,
    totalDurationSeconds: 3600,
    tokensPerStoryPoint: 1000,
    costPerStoryPoint: 0.05,
    durationSecondsPerStoryPoint: 360,
    ...overrides,
  };
}

describe("buildRecommendation", () => {
  it("recommends budget from target story points", () => {
    const historical = makeHistorical();
    const recommendation = buildRecommendation(historical, { targetStoryPoints: 20 });
    assert.strictEqual(recommendation.recommendedTokenBudget, 20000);
    assert.strictEqual(recommendation.recommendedCostBudget, 1);
    assert.strictEqual(recommendation.recommendedDurationSeconds, 7200);
    assert.strictEqual(recommendation.confidence, "medium");
  });

  it("recommends story points from token budget", () => {
    const historical = makeHistorical();
    const recommendation = buildRecommendation(historical, { targetTokenBudget: 5000 });
    assert.strictEqual(recommendation.recommendedStoryPoints, 5);
  });

  it("marks low confidence with few samples", () => {
    const historical = makeHistorical({ completedTickets: 2 });
    const recommendation = buildRecommendation(historical, {});
    assert.strictEqual(recommendation.confidence, "low");
  });
});

describe("computeDeveloperCapacity", () => {
  it("aggregates only completed tickets' events per developer", () => {
    const result = computeDeveloperCapacity([
      {
        storyPoints: 3,
        events: [
          { eventType: "llm.response", payload: { totalTokens: 100 }, userId: "a", ticketId: "t1" },
          { eventType: "session.activity", payload: { durationSeconds: 60 }, userId: "b", ticketId: "t1" },
        ],
      },
      {
        // Not completed (no story points) -> excluded.
        storyPoints: null,
        events: [{ eventType: "llm.response", payload: { totalTokens: 999 }, userId: "a", ticketId: "t2" }],
      },
    ]);

    const a = result.find((d) => d.userId === "a")!;
    assert.strictEqual(a.tokens, 100);
    assert.strictEqual(a.ticketCount, 1);
    const b = result.find((d) => d.userId === "b")!;
    assert.strictEqual(b.durationSeconds, 60);
  });

  it("ignores events without a userId", () => {
    const result = computeDeveloperCapacity([
      {
        storyPoints: 2,
        events: [{ eventType: "llm.response", payload: { totalTokens: 10 } }],
      },
    ]);
    assert.strictEqual(result.length, 0);
  });
});
