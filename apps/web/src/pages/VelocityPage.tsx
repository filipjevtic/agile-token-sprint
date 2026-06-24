import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../components/ui/card.js";
import { Skeleton } from "../components/ui/skeleton.js";
import { Badge } from "../components/ui/badge.js";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table.js";
import { VelocityChart } from "../components/VelocityChart.js";
import { useVelocity } from "../hooks/use-velocity.js";
import { Gauge } from "lucide-react";

function pct(value: number): string {
  return `${Math.round(value * 100)}%`;
}

/**
 * Variance flag for a sprint's estimate accuracy. Leads with the sprint-planning
 * narrative: did the team complete what it committed to?
 */
function completionBadge(rate: number, committed: number) {
  if (committed === 0) return <Badge variant="secondary">No commitment</Badge>;
  if (rate >= 0.9) return <Badge variant="default">On target</Badge>;
  if (rate >= 0.7) return <Badge variant="warning">Slight miss</Badge>;
  return <Badge variant="destructive">Under-delivered</Badge>;
}

export function VelocityPage({ projectId }: { projectId: string }) {
  const { data, loading, error } = useVelocity(projectId, 3);

  const chartData = data.sprints.map((s) => ({
    label: s.name,
    committed: s.committedPoints,
    completed: s.completedPoints,
    rollingAverage: s.rollingAveragePoints,
  }));

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Velocity</h1>
        <p className="text-sm text-muted-foreground">
          Committed vs completed story points per sprint, with a rolling average to calibrate realistic capacity.
        </p>
      </div>

      {error && <div className="rounded-md bg-destructive/15 p-4 text-sm text-destructive">Error: {error}</div>}

      {loading ? (
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-24" />)}
          </div>
          <Skeleton className="h-64" />
        </div>
      ) : data.sprints.length === 0 ? (
        <div className="rounded-lg border border-dashed p-10 text-center">
          <Gauge className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
          <h3 className="text-base font-medium">No velocity data yet</h3>
          <p className="mt-1 max-w-sm mx-auto text-sm text-muted-foreground">
            Sync sprints with story points from your issue tracker to start measuring velocity.
          </p>
        </div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-3">
            <StatCard
              title="Avg completed / sprint"
              value={data.averageCompletedPoints.toLocaleString()}
              hint="Mean completed story points"
            />
            <StatCard
              title="Estimate accuracy"
              value={pct(data.averageCompletionRate)}
              hint="Avg completed ÷ committed"
            />
            <StatCard
              title="Rolling average"
              value={data.latestRollingAveragePoints.toLocaleString()}
              hint="Trailing 3-sprint completed points"
            />
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Committed vs completed</CardTitle>
              <CardDescription>Each sprint: committed (light) vs completed (solid) points, with the rolling-average line.</CardDescription>
            </CardHeader>
            <CardContent>
              <VelocityChart data={chartData} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Per-sprint breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Sprint</TableHead>
                    <TableHead className="text-right">Committed</TableHead>
                    <TableHead className="text-right">Completed</TableHead>
                    <TableHead className="text-right">Completion</TableHead>
                    <TableHead className="text-right">Rolling avg</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.sprints.map((s) => (
                    <TableRow key={s.sprintId}>
                      <TableCell className="font-medium">{s.name}</TableCell>
                      <TableCell className="text-right">
                        {s.committedPoints} <span className="text-muted-foreground">({s.committedTickets})</span>
                      </TableCell>
                      <TableCell className="text-right">
                        {s.completedPoints} <span className="text-muted-foreground">({s.completedTickets})</span>
                      </TableCell>
                      <TableCell className="text-right">{pct(s.completionRate)}</TableCell>
                      <TableCell className="text-right">{s.rollingAveragePoints}</TableCell>
                      <TableCell>{completionBadge(s.completionRate, s.committedPoints)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}

function StatCard({ title, value, hint }: { title: string; value: string; hint: string }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardDescription>{title}</CardDescription>
        <CardTitle className="text-3xl">{value}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-xs text-muted-foreground">{hint}</p>
      </CardContent>
    </Card>
  );
}
