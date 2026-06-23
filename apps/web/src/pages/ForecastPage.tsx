import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card.js";
import { Input } from "../components/ui/input.js";
import { Label } from "../components/ui/label.js";
import { Badge } from "../components/ui/badge.js";
import { Skeleton } from "../components/ui/skeleton.js";
import { Forecast } from "../hooks/use-project-data.js";
import { useCISummary } from "../hooks/use-ci-summary.js";

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

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">Forecast & Capacity</h1>

      {loading && <Skeleton className="h-32" />}

      {forecast && (
        <>
          <Card>
            <CardHeader>
              <CardTitle>Historical baseline</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
                <StatCard label="Completed tickets" value={forecast.historical.completedTickets} />
                <StatCard label="Total story points" value={forecast.historical.totalStoryPoints} />
                <StatCard label="Tokens / SP" value={forecast.historical.tokensPerStoryPoint.toFixed(0)} />
                <StatCard label="Cost / SP" value={`$${forecast.historical.costPerStoryPoint.toFixed(4)}`} />
                <StatCard
                  label="Duration / SP (h)"
                  value={(forecast.historical.durationSecondsPerStoryPoint / 3600).toFixed(2)}
                />
              </div>
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
                <StatCard label="Recommended tokens" value={forecast.recommendation.recommendedTokenBudget?.toLocaleString() || "-"} />
                <StatCard label="Recommended cost" value={`$${forecast.recommendation.recommendedCostBudget?.toFixed(4) || "-"}`} />
                <StatCard
                  label="Recommended duration (h)"
                  value={
                    forecast.recommendation.recommendedDurationSeconds
                      ? (forecast.recommendation.recommendedDurationSeconds / 3600).toFixed(2)
                      : "-"
                  }
                />
                <StatCard
                  label="Confidence"
                  value={
                    <Badge variant={confidenceVariant(forecast.recommendation.confidence)}>
                      {forecast.recommendation.confidence}
                    </Badge>
                  }
                />
              </div>
            </CardContent>
          </Card>

          {forecast.budget && (
            <Card>
              <CardHeader>
                <CardTitle>Budget status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                  <StatCard label="Token budget" value={forecast.budget.tokenBudget?.toLocaleString() || "-"} />
                  <StatCard label="Token usage" value={`${forecast.budget.tokenUsagePercent?.toFixed(1) || "-"}%`} />
                  <StatCard label="Cost budget" value={`$${forecast.budget.costBudget?.toFixed(2) || "-"}`} />
                  <StatCard label="Cost usage" value={`${forecast.budget.costUsagePercent?.toFixed(1) || "-"}%`} />
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
                  <StatCard label="CI runs" value={ciSummary.runCount} />
                  <StatCard label="CI cost" value={`$${ciSummary.totalCost.toFixed(4)}`} />
                  <StatCard
                    label="CI duration (h)"
                    value={(ciSummary.totalDurationSeconds / 3600).toFixed(2)}
                  />
                  <StatCard
                    label="Cost / run"
                    value={
                      ciSummary.runCount > 0
                        ? `$${(ciSummary.totalCost / ciSummary.runCount).toFixed(4)}`
                        : "-"
                    }
                  />
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No CI data available.</p>
              )}
            </CardContent>
          </Card>
        </>
      )}

      {!loading && !forecast && (
        <div className="rounded-lg border border-dashed p-8 text-center text-muted-foreground">
          No forecast data available.
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

function StatCard({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{label}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
      </CardContent>
    </Card>
  );
}
