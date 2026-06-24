import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../context/auth.js";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

export interface SprintVelocity {
  sprintId: string;
  name: string;
  startDate: string | null;
  endDate: string | null;
  status: string;
  committedPoints: number;
  completedPoints: number;
  completionRate: number;
  committedTickets: number;
  completedTickets: number;
  rollingAveragePoints: number;
}

export interface VelocitySummary {
  sprints: SprintVelocity[];
  averageCompletedPoints: number;
  averageCompletionRate: number;
  latestRollingAveragePoints: number;
}

const EMPTY: VelocitySummary = {
  sprints: [],
  averageCompletedPoints: 0,
  averageCompletionRate: 0,
  latestRollingAveragePoints: 0,
};

export function useVelocity(projectId: string, window = 3) {
  const { token } = useAuth();
  const [data, setData] = useState<VelocitySummary>(EMPTY);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const authHeaders: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};

  const fetchVelocity = useCallback(async () => {
    if (!projectId) return;
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ projectId, window: String(window) });
      const res = await fetch(`${API_URL}/api/v1/analytics/velocity?${params}`, { headers: authHeaders });
      if (!res.ok) throw new Error(await res.text());
      const body = await res.json();
      setData({ ...EMPTY, ...body });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load velocity");
    } finally {
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId, window, token]);

  useEffect(() => {
    fetchVelocity();
  }, [fetchVelocity]);

  return { data, loading, error, refresh: fetchVelocity };
}
