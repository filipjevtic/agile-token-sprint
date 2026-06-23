import { useState, useEffect, useCallback } from "react";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

export type TeamRole = "owner" | "admin" | "member" | "viewer";

export interface TeamMember {
  id: string;
  userId: string;
  email: string;
  displayName: string | null;
  role: TeamRole;
  createdAt: string;
}

interface UseTeamResult {
  members: TeamMember[];
  loading: boolean;
  error: string | null;
  refresh: () => void;
  addMember: (input: { email: string; displayName?: string; role: TeamRole }) => Promise<void>;
  updateMember: (userId: string, role: TeamRole) => Promise<void>;
  removeMember: (userId: string) => Promise<void>;
}

export function useTeam(projectId: string): UseTeamResult {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const fetchMembers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_URL}/api/v1/team/${projectId}`);
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      setMembers(data.members || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load team members");
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    fetchMembers();
  }, [fetchMembers, refreshKey]);

  async function addMember(input: { email: string; displayName?: string; role: TeamRole }) {
    const res = await fetch(`${API_URL}/api/v1/team/${projectId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    if (!res.ok) throw new Error(await res.text());
    setRefreshKey((n) => n + 1);
  }

  async function updateMember(userId: string, role: TeamRole) {
    const res = await fetch(`${API_URL}/api/v1/team/${projectId}/${userId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role }),
    });
    if (!res.ok) throw new Error(await res.text());
    setRefreshKey((n) => n + 1);
  }

  async function removeMember(userId: string) {
    const res = await fetch(`${API_URL}/api/v1/team/${projectId}/${userId}`, {
      method: "DELETE",
    });
    if (!res.ok) throw new Error(await res.text());
    setRefreshKey((n) => n + 1);
  }

  return {
    members,
    loading,
    error,
    refresh: () => setRefreshKey((n) => n + 1),
    addMember,
    updateMember,
    removeMember,
  };
}
