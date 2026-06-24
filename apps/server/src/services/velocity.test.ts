import { describe, it } from "node:test";
import assert from "node:assert";
import { computeVelocity, isCompleted, recommendCapacity, type SprintInput } from "./velocity.js";

function sprint(id: string, tickets: Array<[string, number | null]>, status = "closed"): SprintInput {
  return {
    id,
    name: `Sprint ${id}`,
    status,
    tickets: tickets.map(([s, p]) => ({ status: s, storyPoints: p })),
  };
}

describe("isCompleted", () => {
  it("treats terminal statuses as completed (case-insensitive)", () => {
    assert.strictEqual(isCompleted("done"), true);
    assert.strictEqual(isCompleted("Closed"), true);
    assert.strictEqual(isCompleted("RESOLVED"), true);
    assert.strictEqual(isCompleted("completed"), true);
  });

  it("treats in-progress statuses as not completed", () => {
    assert.strictEqual(isCompleted("in_progress"), false);
    assert.strictEqual(isCompleted("todo"), false);
    assert.strictEqual(isCompleted(""), false);
  });
});

describe("computeVelocity", () => {
  it("computes committed vs completed points and completion rate", () => {
    const { sprints } = computeVelocity([
      sprint("1", [
        ["done", 5],
        ["done", 3],
        ["in_progress", 2],
      ]),
    ]);
    const s = sprints[0];
    assert.strictEqual(s.committedPoints, 10);
    assert.strictEqual(s.completedPoints, 8);
    assert.strictEqual(s.completionRate, 0.8);
    assert.strictEqual(s.committedTickets, 3);
    assert.strictEqual(s.completedTickets, 2);
  });

  it("handles null story points as zero", () => {
    const { sprints } = computeVelocity([sprint("1", [["done", null], ["done", 4]])]);
    assert.strictEqual(sprints[0].committedPoints, 4);
    assert.strictEqual(sprints[0].completedPoints, 4);
  });

  it("returns completion rate 0 when nothing committed", () => {
    const { sprints } = computeVelocity([sprint("1", [])]);
    assert.strictEqual(sprints[0].committedPoints, 0);
    assert.strictEqual(sprints[0].completionRate, 0);
  });

  it("computes a trailing rolling average of completed points", () => {
    const { sprints, latestRollingAveragePoints } = computeVelocity(
      [
        sprint("1", [["done", 10]]),
        sprint("2", [["done", 20]]),
        sprint("3", [["done", 30]]),
        sprint("4", [["done", 60]]),
      ],
      3
    );
    assert.strictEqual(sprints[0].rollingAveragePoints, 10); // [10]
    assert.strictEqual(sprints[1].rollingAveragePoints, 15); // [10,20]
    assert.strictEqual(sprints[2].rollingAveragePoints, 20); // [10,20,30]
    assert.strictEqual(sprints[3].rollingAveragePoints, 36.67); // [20,30,60] -> 110/3 = 36.67
    assert.strictEqual(latestRollingAveragePoints, sprints[3].rollingAveragePoints);
  });

  it("averages only sprints with committed work", () => {
    const summary = computeVelocity([
      sprint("1", [["done", 8]]),
      sprint("2", []), // no committed work -> excluded from averages
      sprint("3", [["done", 4], ["todo", 4]]),
    ]);
    // completed: 8 and 4 -> avg 6
    assert.strictEqual(summary.averageCompletedPoints, 6);
    // rates: 1.0 and 0.5 -> avg 0.75
    assert.strictEqual(summary.averageCompletionRate, 0.75);
  });

  it("returns zeros for empty input", () => {
    const summary = computeVelocity([]);
    assert.deepStrictEqual(summary.sprints, []);
    assert.strictEqual(summary.averageCompletedPoints, 0);
    assert.strictEqual(summary.averageCompletionRate, 0);
    assert.strictEqual(summary.latestRollingAveragePoints, 0);
    assert.strictEqual(summary.capacity.recommendedPoints, 0);
    assert.strictEqual(summary.capacity.sampleSize, 0);
  });

  it("includes a capacity recommendation in the summary", () => {
    const summary = computeVelocity([
      sprint("1", [["done", 8]]),
      sprint("2", [["done", 10]]),
      sprint("3", [["done", 12]]),
    ]);
    assert.strictEqual(summary.capacity.recommendedPoints, 10); // median of [8,10,12]
    assert.strictEqual(summary.capacity.median, 10);
    assert.strictEqual(summary.capacity.sampleSize, 3);
  });
});

describe("recommendCapacity", () => {
  it("returns an empty recommendation for no history", () => {
    const rec = recommendCapacity([]);
    assert.strictEqual(rec.recommendedPoints, 0);
    assert.strictEqual(rec.sampleSize, 0);
    assert.strictEqual(rec.confidence, "low");
  });

  it("uses the median as the recommended points", () => {
    const rec = recommendCapacity([5, 9, 7]); // sorted [5,7,9] -> median 7
    assert.strictEqual(rec.recommendedPoints, 7);
    assert.strictEqual(rec.median, 7);
  });

  it("averages two middle values for an even sample", () => {
    const rec = recommendCapacity([4, 6, 8, 10]); // median (6+8)/2 = 7
    assert.strictEqual(rec.median, 7);
  });

  it("drops a high outlier before estimating", () => {
    // One huge sprint among many normal ones should be excluded (z > 2).
    const history = [10, 10, 10, 10, 10, 10, 10, 100];
    const rec = recommendCapacity(history);
    assert.strictEqual(rec.sampleSize, 7); // the 100 is dropped
    assert.strictEqual(rec.recommendedPoints, 10);
  });

  it("escalates confidence with more samples", () => {
    assert.strictEqual(recommendCapacity([5, 6]).confidence, "low");
    assert.strictEqual(recommendCapacity([5, 6, 7, 8]).confidence, "medium");
    assert.strictEqual(recommendCapacity([5, 6, 7, 8, 9, 10]).confidence, "high");
  });
});
