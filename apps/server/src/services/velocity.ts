/**
 * Sprint velocity math. Velocity is the heart of Burnwise's sprint-planning
 * story: how many story points a team commits to vs actually completes each
 * sprint, the completion rate (estimate accuracy), and a rolling average that
 * smooths noise so planners can forecast realistic capacity.
 *
 * Pure functions only — no Prisma — so the math is unit-testable in isolation.
 */

export interface SprintTicketInput {
  status: string;
  storyPoints: number | null;
}

export interface SprintInput {
  id: string;
  name: string;
  startDate?: Date | string | null;
  endDate?: Date | string | null;
  status: string;
  tickets: SprintTicketInput[];
}

export interface SprintVelocity {
  sprintId: string;
  name: string;
  startDate: string | null;
  endDate: string | null;
  status: string;
  committedPoints: number;
  completedPoints: number;
  /** completedPoints / committedPoints, in [0,1]; 0 when nothing committed. */
  completionRate: number;
  committedTickets: number;
  completedTickets: number;
  /** Rolling average of completedPoints over the trailing window (inclusive). */
  rollingAveragePoints: number;
}

export interface VelocitySummary {
  sprints: SprintVelocity[];
  /** Mean completed points across sprints with any committed work. */
  averageCompletedPoints: number;
  /** Mean completion rate across sprints with any committed work. */
  averageCompletionRate: number;
  /** Most recent sprint's rolling average, the headline planning number. */
  latestRollingAveragePoints: number;
}

const DONE_STATUSES = new Set(["done", "closed", "completed", "resolved"]);

/** A ticket counts as completed when its status is a terminal/done state. */
export function isCompleted(status: string): boolean {
  return DONE_STATUSES.has(status.trim().toLowerCase());
}

function toIso(value: Date | string | null | undefined): string | null {
  if (value == null) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

/**
 * Compute per-sprint velocity with a trailing rolling average of completed
 * points. Sprints are processed in the order given (caller sorts chronologically).
 */
export function computeVelocity(
  sprints: SprintInput[],
  rollingWindow = 3
): VelocitySummary {
  const window = Math.max(1, Math.floor(rollingWindow));
  const completedHistory: number[] = [];

  const result: SprintVelocity[] = sprints.map((sprint) => {
    let committedPoints = 0;
    let completedPoints = 0;
    let committedTickets = 0;
    let completedTickets = 0;

    for (const ticket of sprint.tickets) {
      const points = ticket.storyPoints ?? 0;
      committedPoints += points;
      committedTickets += 1;
      if (isCompleted(ticket.status)) {
        completedPoints += points;
        completedTickets += 1;
      }
    }

    completedHistory.push(completedPoints);
    const windowSlice = completedHistory.slice(-window);
    const rollingAveragePoints =
      windowSlice.reduce((sum, v) => sum + v, 0) / windowSlice.length;

    return {
      sprintId: sprint.id,
      name: sprint.name,
      startDate: toIso(sprint.startDate),
      endDate: toIso(sprint.endDate),
      status: sprint.status,
      committedPoints,
      completedPoints,
      completionRate: committedPoints > 0 ? completedPoints / committedPoints : 0,
      committedTickets,
      completedTickets,
      rollingAveragePoints: round(rollingAveragePoints),
    };
  });

  const scored = result.filter((s) => s.committedPoints > 0);
  const averageCompletedPoints =
    scored.length > 0
      ? scored.reduce((sum, s) => sum + s.completedPoints, 0) / scored.length
      : 0;
  const averageCompletionRate =
    scored.length > 0
      ? scored.reduce((sum, s) => sum + s.completionRate, 0) / scored.length
      : 0;

  return {
    sprints: result,
    averageCompletedPoints: round(averageCompletedPoints),
    averageCompletionRate: round(averageCompletionRate),
    latestRollingAveragePoints:
      result.length > 0 ? result[result.length - 1].rollingAveragePoints : 0,
  };
}

function round(value: number): number {
  return Math.round(value * 100) / 100;
}
