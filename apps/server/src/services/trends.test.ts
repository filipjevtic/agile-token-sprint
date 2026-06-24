import { describe, it } from "node:test";
import assert from "node:assert";
import { periodKey, bucketEvents } from "./trends.js";

describe("periodKey", () => {
  it("returns the UTC date for day buckets", () => {
    assert.strictEqual(periodKey("2026-03-15T13:45:00.000Z", "day"), "2026-03-15");
  });

  it("returns the Monday of the week for week buckets", () => {
    // 2026-03-15 is a Sunday -> Monday is 2026-03-09.
    assert.strictEqual(periodKey("2026-03-15T13:45:00.000Z", "week"), "2026-03-09");
    // 2026-03-09 is a Monday -> itself.
    assert.strictEqual(periodKey("2026-03-09T00:00:00.000Z", "week"), "2026-03-09");
    // 2026-03-10 is a Tuesday -> Monday 2026-03-09.
    assert.strictEqual(periodKey("2026-03-10T23:59:59.000Z", "week"), "2026-03-09");
  });
});

describe("bucketEvents", () => {
  it("groups and rolls up events per day, sorted ascending", () => {
    const series = bucketEvents(
      [
        { timestamp: "2026-03-02T10:00:00Z", eventType: "llm.response", payload: { totalTokens: 50, costUsd: 0.5 } },
        { timestamp: "2026-03-01T10:00:00Z", eventType: "llm.response", payload: { totalTokens: 100, costUsd: 1 } },
        { timestamp: "2026-03-01T18:00:00Z", eventType: "session.activity", payload: { durationSeconds: 600 } },
      ],
      "day"
    );

    assert.strictEqual(series.length, 2);
    assert.deepStrictEqual(series.map((p) => p.period), ["2026-03-01", "2026-03-02"]);
    assert.strictEqual(series[0].tokens, 100);
    assert.strictEqual(series[0].durationSeconds, 600);
    assert.strictEqual(series[0].eventCount, 2);
    assert.strictEqual(series[1].tokens, 50);
  });

  it("collapses a week's events into one bucket", () => {
    const series = bucketEvents(
      [
        { timestamp: "2026-03-09T10:00:00Z", eventType: "llm.response", payload: { totalTokens: 10 } },
        { timestamp: "2026-03-12T10:00:00Z", eventType: "llm.response", payload: { totalTokens: 20 } },
      ],
      "week"
    );
    assert.strictEqual(series.length, 1);
    assert.strictEqual(series[0].period, "2026-03-09");
    assert.strictEqual(series[0].tokens, 30);
  });

  it("returns an empty series for no events", () => {
    assert.deepStrictEqual(bucketEvents([], "day"), []);
  });
});
