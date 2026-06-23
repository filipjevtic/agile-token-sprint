import { describe, it } from "node:test";
import assert from "node:assert";
import { extractTicketKeys } from "./association.js";

describe("extractTicketKeys", () => {
  it("finds Jira-style ticket keys in text", () => {
    const keys = extractTicketKeys("Working on PROJ-123 and another fix for PROJ-456.");
    assert.deepStrictEqual(keys, ["PROJ-123", "PROJ-456"]);
  });

  it("deduplicates repeated keys", () => {
    const keys = extractTicketKeys("PROJ-123 PROJ-123 PROJ-123");
    assert.deepStrictEqual(keys, ["PROJ-123"]);
  });

  it("ignores invalid patterns", () => {
    const keys = extractTicketKeys("No tickets here, just version 1.2.3 and abc-123.");
    assert.deepStrictEqual(keys, []);
  });

  it("finds keys in branch names", () => {
    const keys = extractTicketKeys("feature/PROJ-789-add-login");
    assert.deepStrictEqual(keys, ["PROJ-789"]);
  });

  it("finds keys in commit messages", () => {
    const keys = extractTicketKeys("[PROJ-42] fix: handle null pointer");
    assert.deepStrictEqual(keys, ["PROJ-42"]);
  });
});
