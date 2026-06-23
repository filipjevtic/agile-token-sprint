import { describe, it } from "node:test";
import assert from "node:assert";
import { estimateCost } from "./events.js";

function assertApprox(actual: number, expected: number, message?: string) {
  assert.ok(Math.abs(actual - expected) < 1e-10, message ?? `expected ${expected}, got ${actual}`);
}

describe("estimateCost", () => {
  it("estimates cost for gpt-4o", () => {
    const cost = estimateCost("openai", "gpt-4o", 1_000_000, 500_000);
    assertApprox(cost, 12.5);
  });

  it("estimates cost for gpt-4o-mini", () => {
    const cost = estimateCost("openai", "gpt-4o-mini", 1_000_000, 500_000);
    assertApprox(cost, 0.45);
  });

  it("estimates cost for claude-3-5-sonnet", () => {
    const cost = estimateCost("anthropic", "claude-3-5-sonnet", 1_000_000, 500_000);
    assertApprox(cost, 10.5);
  });

  it("falls back to default pricing for unknown models", () => {
    const cost = estimateCost("unknown", "custom-model", 1_000_000, 500_000);
    assertApprox(cost, 2.5);
  });
});
