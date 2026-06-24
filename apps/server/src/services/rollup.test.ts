import { describe, it } from "node:test";
import assert from "node:assert";
import { rollupEvents, rollupBy, emptyRollup } from "./rollup.js";

describe("rollupEvents", () => {
  it("returns an empty rollup for no events", () => {
    assert.deepStrictEqual(rollupEvents([]), emptyRollup());
  });

  it("sums tokens and cost from llm.response events", () => {
    const r = rollupEvents([
      { eventType: "llm.response", payload: { totalTokens: 100, costUsd: 0.5 } },
      { eventType: "llm.response", payload: { totalTokens: 50, costUsd: 0.25 } },
    ]);
    assert.strictEqual(r.tokens, 150);
    assert.strictEqual(r.cost, 0.75);
    assert.strictEqual(r.eventCount, 2);
  });

  it("sums duration from session.activity and cost from ci.run", () => {
    const r = rollupEvents([
      { eventType: "session.activity", payload: { durationSeconds: 600 } },
      { eventType: "ci.run", payload: { costUsd: 1.25 } },
    ]);
    assert.strictEqual(r.durationSeconds, 600);
    assert.strictEqual(r.cost, 1.25);
    assert.strictEqual(r.eventCount, 2);
  });

  it("ignores llm.request payloads and non-numeric values", () => {
    const r = rollupEvents([
      { eventType: "llm.request", payload: { promptText: "hi" } },
      { eventType: "llm.response", payload: { totalTokens: "oops", costUsd: null } },
    ]);
    assert.strictEqual(r.tokens, 0);
    assert.strictEqual(r.cost, 0);
    assert.strictEqual(r.eventCount, 2);
  });

  it("tolerates null/undefined payloads", () => {
    const r = rollupEvents([
      { eventType: "llm.response", payload: null },
      { eventType: "session.activity", payload: undefined },
    ]);
    assert.deepStrictEqual(r, { tokens: 0, cost: 0, durationSeconds: 0, eventCount: 2 });
  });
});

describe("rollupBy", () => {
  it("groups events by key and rolls up each group", () => {
    const groups = rollupBy(
      [
        { eventType: "llm.response", payload: { totalTokens: 10 }, userId: "a" },
        { eventType: "llm.response", payload: { totalTokens: 5 }, userId: "b" },
        { eventType: "session.activity", payload: { durationSeconds: 30 }, userId: "a" },
      ],
      (e) => e.userId
    );
    assert.strictEqual(groups.get("a")?.tokens, 10);
    assert.strictEqual(groups.get("a")?.durationSeconds, 30);
    assert.strictEqual(groups.get("a")?.eventCount, 2);
    assert.strictEqual(groups.get("b")?.tokens, 5);
    assert.strictEqual(groups.get("b")?.eventCount, 1);
  });

  it("skips events with null keys", () => {
    const groups = rollupBy(
      [{ eventType: "llm.response", payload: { totalTokens: 10 }, sessionId: null }],
      (e) => e.sessionId
    );
    assert.strictEqual(groups.size, 0);
  });
});
