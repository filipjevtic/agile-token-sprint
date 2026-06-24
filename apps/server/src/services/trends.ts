import { rollupBy, type RollupEvent } from "./rollup.js";

/**
 * Time-series bucketing for usage trends. Events are grouped into day or week
 * buckets (UTC) and rolled up with the shared rollup math, so trend lines stay
 * consistent with every other summary.
 */

export type Bucket = "day" | "week";

export interface TrendEvent extends RollupEvent {
  timestamp: Date | string;
}

export interface TrendPoint {
  period: string; // YYYY-MM-DD (day, or Monday of the ISO week)
  tokens: number;
  cost: number;
  durationSeconds: number;
  eventCount: number;
}

/** UTC date key for an event, bucketed to a day or the Monday of its week. */
export function periodKey(timestamp: Date | string, bucket: Bucket): string {
  const date = timestamp instanceof Date ? timestamp : new Date(timestamp);
  if (bucket === "week") {
    // Shift to the Monday of this UTC week (ISO weekday: Mon=1..Sun=7).
    const day = date.getUTCDay(); // 0=Sun..6=Sat
    const isoOffset = day === 0 ? 6 : day - 1;
    const monday = new Date(date);
    monday.setUTCDate(date.getUTCDate() - isoOffset);
    return monday.toISOString().slice(0, 10);
  }
  return date.toISOString().slice(0, 10);
}

/** Bucket events into a sorted (ascending) time series of usage rollups. */
export function bucketEvents(events: TrendEvent[], bucket: Bucket): TrendPoint[] {
  const groups = rollupBy(events, (e) => periodKey(e.timestamp, bucket));
  return [...groups.entries()]
    .map(([period, r]) => ({
      period,
      tokens: r.tokens,
      cost: r.cost,
      durationSeconds: r.durationSeconds,
      eventCount: r.eventCount,
    }))
    .sort((a, b) => (a.period < b.period ? -1 : a.period > b.period ? 1 : 0));
}
