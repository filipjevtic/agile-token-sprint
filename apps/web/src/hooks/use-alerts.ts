import { useEffect, useState } from "react";
import { useAuth } from "../context/auth.js";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

export interface Alert {
  type: "token" | "cost";
  level: "warning" | "critical";
  message: string;
  usagePercent: number;
  budget: number;
  usage: number;
}

export function useAlerts(projectId: string, refreshToken: number = 0) {
  const { token } = useAuth();
  const authHeader: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!projectId) return;
    setLoading(true);
    setError(null);
    fetch(`${API_URL}/api/v1/alerts/project/${projectId}`, { headers: authHeader })
      .then(async (res) => {
        if (!res.ok) throw new Error(await res.text());
        return res.json();
      })
      .then((data) => setAlerts(data.alerts || []))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId, refreshToken, token]);

  return { alerts, loading, error };
}
