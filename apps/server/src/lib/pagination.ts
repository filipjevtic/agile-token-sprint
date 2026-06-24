/**
 * Offset-based pagination helpers shared across list endpoints.
 *
 * Endpoints accept `limit` and `offset` query params and return a `pagination`
 * object alongside their items so clients can page through large result sets
 * without unbounded queries.
 */

export interface PaginationParams {
  limit: number;
  offset: number;
}

export interface PaginationMeta {
  limit: number;
  offset: number;
  total: number;
  hasMore: boolean;
}

export const DEFAULT_LIMIT = 100;
export const MAX_LIMIT = 500;

/**
 * Parse and clamp pagination query params. `limit` is bounded to
 * [1, maxLimit] and defaults to `defaultLimit`; `offset` is clamped to >= 0.
 * Invalid/non-numeric values fall back to the defaults.
 */
export function parsePagination(
  query: { limit?: string; offset?: string },
  opts?: { defaultLimit?: number; maxLimit?: number }
): PaginationParams {
  const defaultLimit = opts?.defaultLimit ?? DEFAULT_LIMIT;
  const maxLimit = opts?.maxLimit ?? MAX_LIMIT;

  const rawLimit = Number(query.limit);
  const limit = Number.isFinite(rawLimit) && rawLimit > 0
    ? Math.min(Math.floor(rawLimit), maxLimit)
    : defaultLimit;

  const rawOffset = Number(query.offset);
  const offset = Number.isFinite(rawOffset) && rawOffset > 0 ? Math.floor(rawOffset) : 0;

  return { limit, offset };
}

/** Build the pagination metadata returned to clients. */
export function buildPaginationMeta(params: PaginationParams, total: number): PaginationMeta {
  return {
    limit: params.limit,
    offset: params.offset,
    total,
    hasMore: params.offset + params.limit < total,
  };
}
