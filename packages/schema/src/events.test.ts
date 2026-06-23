import { describe, it } from "node:test";
import assert from "node:assert";
import { eventSchema, ingestBatchSchema } from "./events.js";

const baseEvent = {
  eventId: "550e8400-e29b-41d4-a716-446655440000",
  eventType: "llm.response" as const,
  timestamp: "2026-06-22T12:00:00Z",
  source: "proxy" as const,
  workspaceId: "ws-1",
  projectId: "proj-1",
  userId: "user-1",
  traceId: "trace-1",
};

describe("eventSchema", () => {
  it("accepts a valid llm.response event", () => {
    const result = eventSchema.safeParse({
      ...baseEvent,
      payload: {
        provider: "openai",
        model: "gpt-4o",
        promptTokens: 100,
        completionTokens: 50,
        totalTokens: 150,
        costUsd: 0.001,
        latencyMs: 1200,
      },
    });
    assert.strictEqual(result.success, true);
  });

  it("rejects an event with missing required fields", () => {
    const result = eventSchema.safeParse({
      eventId: baseEvent.eventId,
      eventType: "llm.response",
      timestamp: baseEvent.timestamp,
      source: "proxy",
      workspaceId: "ws-1",
      projectId: "proj-1",
      // userId intentionally omitted.
      payload: {
        provider: "openai",
        model: "gpt-4o",
        promptTokens: 100,
        completionTokens: 50,
        totalTokens: 150,
      },
    });
    assert.strictEqual(result.success, false);
  });

  it("accepts a trace.span event with attributes", () => {
    const result = eventSchema.safeParse({
      ...baseEvent,
      eventType: "trace.span",
      payload: {
        name: "agent-planning",
        startTime: "2026-06-22T12:00:00Z",
        endTime: "2026-06-22T12:00:05Z",
        status: "ok",
        attributes: { ticketId: "PROJ-123" },
      },
    });
    assert.strictEqual(result.success, true);
  });

  it("rejects unknown event types", () => {
    const result = eventSchema.safeParse({
      ...baseEvent,
      eventType: "unknown",
      payload: {},
    });
    assert.strictEqual(result.success, false);
  });
});

describe("ingestBatchSchema", () => {
  it("accepts a batch of events", () => {
    const result = ingestBatchSchema.safeParse({
      events: [
        {
          ...baseEvent,
          payload: {
            provider: "openai",
            model: "gpt-4o",
            promptTokens: 10,
            completionTokens: 5,
            totalTokens: 15,
          },
        },
      ],
    });
    assert.strictEqual(result.success, true);
  });

  it("rejects an empty batch", () => {
    const result = ingestBatchSchema.safeParse({ events: [] });
    assert.strictEqual(result.success, false);
  });
});
