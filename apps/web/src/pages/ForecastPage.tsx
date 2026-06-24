import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card.js";
import { Input } from "../components/ui/input.js";
import { Label } from "../components/ui/label.js";
import { Badge } from "../components/ui/badge.js";
import { Skeleton } from "../components/ui/skeleton.js";
import { Forecast } from "../hooks/use-project-data.js";
import { useCISummary } from "../hooks/use-ci-summary.js";
import { useVelocity } from "../hooks/use-velocity.js";
import { TrendingUp, Wallet, Timer, Target, Activity, Cpu, Users, Gauge } from "lucide-react";

export function ForecastPage({
  projectId,
  forecast,
  forecastTarget,
  setForecastTarget,
  loading,
}: {
  projectId: string;
  forecast: Forecast | null;
  forecastTarget: string;
  setForecastTarget: (value: string) => void;
  loading: boolean;
}) {
  const { summary: ciSummary, loading: ciLoading } = useCISummary(projectId);
  const { data: velocity, loading: velocityLoading } = useVelocity(projectId, 3);
  const capacity = velocity.capacity;

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Forecast & Capacity</h1>
        <p className="text-sm text-muted-foreground">
          Plan the next sprint from historical token, cost, and duration baselines.
        </p>
      </div>

      {loading && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      )}

      {forecast && (
        <>
          <Card>
            <CardHeader>
              <CardTitle>Historical baseline</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
                <StatCard label="Completed tickets" value={forecast.historical.completedTickets} icon={Target} />
                <StatCard label="Total story points" value={forecast.historical.totalStoryPoints} icon={TrendingUp} />
                <StatCard label="Tokens / SP" value={forecast.historical.tokensPerStoryPoint.toFixed(0)} icon={Activity} />
                <StatCard label="Cost / SP" value={`$${forecast.historical.costPerStoryPoint.toFixed(4)}`} icon={Wallet} />
                <StatCard label="Duration / SP (h)" value={(forecast.historical.durationSecondsPerStoryPoint / 3600).toFixed(2)} icon={Timer} />
              </div>
            </CardContent>
          </Card>

          {forecast.developers.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-muted-foreground" />
                  Team capacity (completed work)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b text-left text-muted-foreground">
                        <th className="py-2 font-medium">Developer</th>
                        <th className="py-2 text-right font-medium">Tokens</th>
                        <th className="py-2 text-right font-medium">Cost</th>
                        <th className="py-2 text-right font-medium">Time (h)</th>
                        <th className="py-2 text-right font-medium">Tickets</th>
                      </tr>
                    </thead>
                    <tbody>
                      {forecast.developers.map((d) => (
                        <tr key={d.userId} className="border-b last:border-0">
                          <td className="py-2 font-medium">{d.name || d.userId}</td>
                          <td className="py-2 text-right">{d.tokens.toLocaleString()}</td>
                          <td className="py-2 text-right">${d.cost.toFixed(4)}</td>
                          <td className="py-2 text-right">{(d.durationSeconds / 3600).toFixed(2)}</td>
                          <td className="py-2 text-right">{d.ticketCount}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Gauge className="h-5 w-5 text-muted-foreground" />
                Velocity-based capacity
              </CardTitle>
            </CardHeader>
            <CardContent>
              {velocityLoading ? (
                <Skeleton className="h-24" />
              ) : capacity.sampleSize === 0 ? (
                <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
                  No completed sprints yet. Capacity is recommended from completed story points across past sprints.
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <StatCard label="Recommended points" value={capacity.recommendedPoints} icon={Target} />
                    <StatCard label="Planning range" value={`${capacity.low}–${capacity.high}`} icon={TrendingUp} />
                    <StatCard label="Avg / median" value={`${capacity.mean} / ${capacity.median}`} icon={Activity} />
                    <StatCard
                      label="Confidence"
                      value={<Badge variant={confidenceVariant(capacity.confidence)}>{capacity.confidence}</Badge>}
                      icon={Gauge}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Based on {capacity.sampleSize} sprint{capacity.sampleSize === 1 ? "" : "s"} of completed story points (high outliers excluded). Use the median as a realistic commit target.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Plan next sprint</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
                <div className="grid w-full max-w-xs items-center gap-1.5">
                  <Label htmlFor="forecastTarget">Target story points</Label>
                  <Input
                    id="forecastTarget"
                    type="number"
                    value={forecastTarget}
                    onChange={(e) => setForecastTarget(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <StatCard label="Recommended tokens" value={forecast.recommendation.recommendedTokenBudget?.toLocaleString() || "-"} icon={Activity} />
                <StatCard label="Recommended cost" value={`$${forecast.recommendation.recommendedCostBudget?.toFixed(4) || "-"}`} icon={Wallet} />
                <StatCard
                  label="Recommended duration (h)"
                  value={
                    forecast.recommendation.recommendedDurationSeconds
                      ? (forecast.recommendation.recommendedDurationSeconds / 3600).toFixed(2)
                      : "-"
                  }
                  icon={Timer}
                />
                <StatCard
                  label="Confidence"
                  value={
                    <Badge variant={confidenceVariant(forecast.recommendation.confidence)}>
                      {forecast.recommendation.confidence}
                    </Badge>
                  }
                  icon={TrendingUp}
                />
              </div>
            </CardContent>
          </Card>

          {forecast.budget && (
            <Card>
              <CardHeader>
                <CardTitle>Budget status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-6 md:grid-cols-2">
                  <BudgetMeter
                    label="Token usage"
                    used={forecast.budget.tokenUsagePercent || 0}
                    budget={forecast.budget.tokenBudget || 0}
                    unit="tokens"
                  />
                  <BudgetMeter
                    label="Cost usage"
                    used={forecast.budget.costUsagePercent || 0}
                    budget={forecast.budget.costBudget || 0}
                    unit="USD"
                    prefix="$"
                  />
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>CI/CD cost</CardTitle>
            </CardHeader>
            <CardContent>
              {ciLoading ? (
                <Skeleton className="h-12" />
              ) : ciSummary ? (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                  <StatCard label="CI runs" value={ciSummary.runCount} icon={Cpu} />
                  <StatCard label="CI cost" value={`$${ciSummary.totalCost.toFixed(4)}`} icon={Wallet} />
                  <StatCard label="CI duration (h)" value={(ciSummary.totalDurationSeconds / 3600).toFixed(2)} icon={Timer} />
                  <StatCard
                    label="Cost / run"
                    value={ciSummary.runCount > 0 ? `$${(ciSummary.totalCost / ciSummary.runCount).toFixed(4)}` : "-"}
                    icon={Wallet}
                  />
                </div>
              ) : (
                <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
                  No CI data available.
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}

      {!loading && !forecast && (
        <div className="rounded-lg border border-dashed p-10 text-center">
          <TrendingUp className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
          <h3 className="text-base font-medium">No forecast data</h3>
          <p className="mt-1 max-w-xs mx-auto text-sm text-muted-foreground">
            Select a project with completed sprints to generate a forecast.
          </p>
        </div>
      )}
    </div>
  );
}

function confidenceVariant(confidence: "low" | "medium" | "high") {
  switch (confidence) {
    case "high":
      return "default";
    case "medium":
      return "secondary";
    case "low":
      return "outline";
  }
}

function StatCard({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: React.ReactNode;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
      </CardContent>
    </Card>
  );
}

function BudgetMeter({
  label,
  used,
  budget,
  unit,
  prefix = "",
}: {
  label: string;
  used: number;
  budget: number;
  unit: string;
  prefix?: string;
}) {
  const percent = Math.min(100, used);
  const color = percent >= 100 ? "bg-red-500" : percent >= 80 ? "bg-yellow-500" : "bg-green-500";
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium">{label}</span>
        <span className={percent >= 100 ? "text-destructive font-medium" : ""}>
          {prefix}
          {budget.toLocaleString()} {unit} budget
        </span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
        <div className={"h-full rounded-full transition-all " + color} style={{ width: `${percent}%` }} />
      </div>
      <p className="text-xs text-muted-foreground">{percent.toFixed(1)}% used</p>
    </div>
  );
}
