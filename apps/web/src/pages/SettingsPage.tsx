import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card.js";
import { Button } from "../components/ui/button.js";
import { Input } from "../components/ui/input.js";
import { Label } from "../components/ui/label.js";
import { Select } from "../components/ui/select.js";
import { useTeam, type TeamRole } from "../hooks/use-team.js";
import { useAuth } from "../context/auth.js";
import { Wallet, Users } from "lucide-react";
import { cn } from "../lib/utils.js";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

const ROLES: TeamRole[] = ["owner", "admin", "member", "viewer"];

export function SettingsPage({
  projectId,
  onBudgetUpdated,
}: {
  projectId: string;
  onBudgetUpdated: () => void;
}) {
  const [tokenBudget, setTokenBudget] = useState<string>("");
  const [costBudget, setCostBudget] = useState<string>("");
  const [tokenThreshold, setTokenThreshold] = useState<string>("80");
  const [costThreshold, setCostThreshold] = useState<string>("80");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const { token, user } = useAuth();
  const isAdmin = user?.role === "admin";
  const authHeader: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};
  const { members, loading: teamLoading, error: teamError, addMember, removeMember, updateMember } = useTeam(projectId);
  const [memberEmail, setMemberEmail] = useState("");
  const [memberDisplayName, setMemberDisplayName] = useState("");
  const [memberRole, setMemberRole] = useState<TeamRole>("member");
  const [teamActionLoading, setTeamActionLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"budget" | "team">("budget");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      const res = await fetch(`${API_URL}/api/v1/projects/${projectId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", ...authHeader },
        body: JSON.stringify({
          tokenBudget: tokenBudget ? Number(tokenBudget) : null,
          costBudget: costBudget ? Number(costBudget) : null,
          tokenBudgetAlertThreshold: tokenThreshold ? Number(tokenThreshold) : null,
          costBudgetAlertThreshold: costThreshold ? Number(costThreshold) : null,
        }),
      });
      if (!res.ok) throw new Error(await res.text());
      setSuccess("Budget updated successfully.");
      onBudgetUpdated();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update budget");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground">Manage project budgets and team access.</p>
      </div>

      {error && <div className="rounded-md bg-destructive/15 p-4 text-sm text-destructive">Error: {error}</div>}
      {success && <div className="rounded-md bg-green-100 p-4 text-sm text-green-800">{success}</div>}

      <div className="border-b">
        <div className="flex gap-4">
          <button
            onClick={() => setActiveTab("budget")}
            className={cn(
              "flex items-center gap-2 border-b-2 px-1 py-3 text-sm font-medium transition-colors",
              activeTab === "budget"
                ? "border-primary text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            <Wallet className="h-4 w-4" />
            Budget
          </button>
          <button
            onClick={() => setActiveTab("team")}
            className={cn(
              "flex items-center gap-2 border-b-2 px-1 py-3 text-sm font-medium transition-colors",
              activeTab === "team"
                ? "border-primary text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            <Users className="h-4 w-4" />
            Team
          </button>
        </div>
      </div>

      {activeTab === "budget" && (
        <Card className="max-w-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wallet className="h-5 w-5 text-muted-foreground" />
              Project budget
            </CardTitle>
            <CardDescription>Set token and cost budgets for project {projectId}.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-1.5">
                  <Label htmlFor="tokenBudget">Token budget</Label>
                  <Input
                    id="tokenBudget"
                    type="number"
                    value={tokenBudget}
                    onChange={(e) => setTokenBudget(e.target.value)}
                    placeholder="e.g. 50000"
                  />
                </div>
                <div className="grid gap-1.5">
                  <Label htmlFor="costBudget">Cost budget (USD)</Label>
                  <Input
                    id="costBudget"
                    type="number"
                    step="0.01"
                    value={costBudget}
                    onChange={(e) => setCostBudget(e.target.value)}
                    placeholder="e.g. 5.00"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-1.5">
                  <Label htmlFor="tokenThreshold">Token alert threshold (%)</Label>
                  <Input
                    id="tokenThreshold"
                    type="number"
                    min="0"
                    max="100"
                    value={tokenThreshold}
                    onChange={(e) => setTokenThreshold(e.target.value)}
                    placeholder="80"
                  />
                </div>
                <div className="grid gap-1.5">
                  <Label htmlFor="costThreshold">Cost alert threshold (%)</Label>
                  <Input
                    id="costThreshold"
                    type="number"
                    min="0"
                    max="100"
                    value={costThreshold}
                    onChange={(e) => setCostThreshold(e.target.value)}
                    placeholder="80"
                  />
                </div>
              </div>
              <Button type="submit" disabled={saving || !isAdmin}>
                {saving ? "Saving..." : "Save budget"}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {activeTab === "team" && (
        <Card className="max-w-3xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-muted-foreground" />
              Team members
            </CardTitle>
            <CardDescription>Manage who can access project {projectId}.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {teamError && <div className="rounded-md bg-destructive/15 p-4 text-sm text-destructive">Error: {teamError}</div>}

            {!isAdmin && (
              <p className="text-sm text-muted-foreground">
                You have read-only access. Contact an admin to make changes.
              </p>
            )}
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                if (!memberEmail || !isAdmin) return;
                setTeamActionLoading(true);
                try {
                  await addMember({
                    email: memberEmail,
                    displayName: memberDisplayName || undefined,
                    role: memberRole,
                  });
                  setMemberEmail("");
                  setMemberDisplayName("");
                  setMemberRole("member");
                } catch (err) {
                  setError(err instanceof Error ? err.message : "Failed to add member");
                } finally {
                  setTeamActionLoading(false);
                }
              }}
              className={cn("space-y-4", !isAdmin && "opacity-50 pointer-events-none")}
            >
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div className="grid gap-1.5">
                  <Label htmlFor="memberEmail">Email</Label>
                  <Input
                    id="memberEmail"
                    type="email"
                    value={memberEmail}
                    onChange={(e) => setMemberEmail(e.target.value)}
                    placeholder="colleague@example.com"
                  />
                </div>
                <div className="grid gap-1.5">
                  <Label htmlFor="memberDisplayName">Display name (optional)</Label>
                  <Input
                    id="memberDisplayName"
                    value={memberDisplayName}
                    onChange={(e) => setMemberDisplayName(e.target.value)}
                    placeholder="Jane Doe"
                  />
                </div>
                <div className="grid gap-1.5">
                  <Label htmlFor="memberRole">Role</Label>
                  <Select
                    id="memberRole"
                    value={memberRole}
                    onChange={(e) => setMemberRole(e.target.value as TeamRole)}
                  >
                    {ROLES.map((role) => (
                      <option key={role} value={role}>
                        {role}
                      </option>
                    ))}
                  </Select>
                </div>
              </div>
              <Button type="submit" disabled={teamActionLoading || !memberEmail || !isAdmin}>
                {teamActionLoading ? "Adding..." : "Add member"}
              </Button>
            </form>

            <div className="space-y-2">
              <h3 className="text-sm font-medium">Members</h3>
              {teamLoading ? (
                <p className="text-sm text-muted-foreground">Loading...</p>
              ) : members.length === 0 ? (
                <p className="text-sm text-muted-foreground">No members yet.</p>
              ) : (
                <ul className="divide-y rounded-md border">
                  {members.map((member) => (
                    <li key={member.id} className="flex items-center justify-between p-3">
                      <div className="flex flex-col gap-0.5">
                        <span className="text-sm font-medium">
                          {member.displayName || member.email}
                        </span>
                        <span className="text-xs text-muted-foreground">{member.email}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {isAdmin ? (
                          <>
                            <Select
                              value={member.role}
                              onChange={async (e) => {
                                const role = e.target.value as TeamRole;
                                setTeamActionLoading(true);
                                try {
                                  await updateMember(member.userId, role);
                                } catch (err) {
                                  setError(err instanceof Error ? err.message : "Failed to update role");
                                } finally {
                                  setTeamActionLoading(false);
                                }
                              }}
                              aria-label="Member role"
                            >
                              {ROLES.map((role) => (
                                <option key={role} value={role}>
                                  {role}
                                </option>
                              ))}
                            </Select>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={async () => {
                                setTeamActionLoading(true);
                                try {
                                  await removeMember(member.userId);
                                } catch (err) {
                                  setError(err instanceof Error ? err.message : "Failed to remove member");
                                } finally {
                                  setTeamActionLoading(false);
                                }
                              }}
                              disabled={teamActionLoading}
                            >
                              Remove
                            </Button>
                          </>
                        ) : (
                          <span className="text-xs text-muted-foreground">{member.role}</span>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
