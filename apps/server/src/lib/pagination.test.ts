import { test } from "node:test";
import assert from "node:assert/strict";
import {
  parsePagination,
  buildPaginationMeta,
  DEFAULT_LIMIT,
  MAX_LIMIT,
} from "./pagination.js";

test("parsePagination", async (t) => {
  await t.test("defaults when params are absent", () => {
    const { limit, offset } = parsePagination({});
    assert.equal(limit, DEFAULT_LIMIT);
    assert.equal(offset, 0);
  });

  await t.test("parses valid numeric strings", () => {
    const { limit, offset } = parsePagination({ limit: "25", offset: "50" });
    assert.equal(limit, 25);
    assert.equal(offset, 50);
  });

  await t.test("clamps limit to the max", () => {
    const { limit } = parsePagination({ limit: "100000" });
    assert.equal(limit, MAX_LIMIT);
  });

  await t.test("honors a custom default and max", () => {
    assert.equal(parsePagination({}, { defaultLimit: 50 }).limit, 50);
    assert.equal(parsePagination({ limit: "999" }, { maxLimit: 200 }).limit, 200);
  });

  await t.test("falls back to defaults for invalid or non-positive values", () => {
    assert.equal(parsePagination({ limit: "abc" }).limit, DEFAULT_LIMIT);
    assert.equal(parsePagination({ limit: "0" }).limit, DEFAULT_LIMIT);
    assert.equal(parsePagination({ limit: "-5" }).limit, DEFAULT_LIMIT);
    assert.equal(parsePagination({ offset: "-10" }).offset, 0);
    assert.equal(parsePagination({ offset: "abc" }).offset, 0);
  });

  await t.test("floors fractional values", () => {
    const { limit, offset } = parsePagination({ limit: "10.9", offset: "5.7" });
    assert.equal(limit, 10);
    assert.equal(offset, 5);
  });
});

test("buildPaginationMeta", async (t) => {
  await t.test("reports hasMore when more rows remain", () => {
    const meta = buildPaginationMeta({ limit: 10, offset: 0 }, 25);
    assert.deepEqual(meta, { limit: 10, offset: 0, total: 25, hasMore: true });
  });

  await t.test("reports no more rows on the last page", () => {
    const meta = buildPaginationMeta({ limit: 10, offset: 20 }, 25);
    assert.equal(meta.hasMore, false);
  });

  await t.test("reports no more rows for an exact fit", () => {
    const meta = buildPaginationMeta({ limit: 10, offset: 0 }, 10);
    assert.equal(meta.hasMore, false);
  });
});
