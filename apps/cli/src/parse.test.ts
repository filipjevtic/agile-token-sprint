import { describe, it } from "node:test";
import assert from "node:assert";
import { parseArgs } from "./parse.js";

describe("parseArgs", () => {
  it("parses ticket id and activity type", () => {
    const result = parseArgs(["--ticket-id", "PROJ-123", "--activity-type", "coding", "--", "npm", "test"]);
    assert.strictEqual(result.ticketId, "PROJ-123");
    assert.strictEqual(result.activityType, "coding");
    assert.deepStrictEqual(result.args, ["npm", "test"]);
    assert.strictEqual(result.error, undefined);
  });

  it("requires a command after --", () => {
    const result = parseArgs(["--ticket-id", "PROJ-123"]);
    assert.ok(result.error);
  });

  it("rejects unknown options", () => {
    const result = parseArgs(["--unknown", "value", "--", "npm", "test"]);
    assert.ok(result.error);
  });

  it("rejects invalid activity types", () => {
    const result = parseArgs(["--activity-type", "sleeping", "--", "npm", "test"]);
    assert.ok(result.error);
  });
});
