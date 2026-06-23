import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card.js";
import { Select } from "../components/ui/select.js";
import { Skeleton } from "../components/ui/skeleton.js";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table.js";
import { SprintSummary } from "../hooks/use-project-data.js";

export function DashboardPage({
  sprints,
  selectedSprint,
  setSelectedSprint,
  summary,
  loading,
}: {
  sprints: Array<{ id: string; name: string }>;
  selectedSprint: string | null;
  setSelectedSprint: (id: string) => void;
  summary: SprintSummary | null;
  loading: boolean;
}) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <div className="flex items-center gap-2">
          <label htmlFor="sprint" className="text-sm font-medium">
            Sprint
          </label>
          <Select
            id="sprint"
            value={selectedSprint || ""}
            onChange={(e) => setSelectedSprint(e.target.value)}
            className="w-56"
          >
            {sprints.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </Select>
        </div>
      </div>

      {loading && <Skeleton className="h-32" />}

      {summary && (
        <>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
            <StatCard label="Tokens" value={summary.summary.totalTokens.toLocaleString()} />
            <StatCard label="Cost (USD)" value={`$${summary.summary.totalCost.toFixed(4)}`} />
            <StatCard label="Duration (h)" value={(summary.summary.totalDurationSeconds / 3600).toFixed(2)} />
            <StatCard label="Tickets" value={summary.summary.ticketCount} />
            <StatCard label="Events" value={summary.summary.eventCount} />
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Tickets</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Ticket</TableHead>
                    <TableHead className="text-right">Tokens</TableHead>
                    <TableHead className="text-right">Cost</TableHead>
                    <TableHead className="text-right">Events</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {summary.tickets.map((t) => (
                    <TableRow key={t.ticketId}>
                      <TableCell>
                        <div className="font-medium">{t.externalId}</div>
                        <div className="text-sm text-muted-foreground">{t.title}</div>
                      </TableCell>
                      <TableCell className="text-right">{t.tokens.toLocaleString()}</TableCell>
                      <TableCell className="text-right">${t.cost.toFixed(4)}</TableCell>
                      <TableCell className="text-right">{t.events}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </>
      )}

      {!loading && !summary && (
        <div className="rounded-lg border border-dashed p-8 text-center text-muted-foreground">
          No sprint selected. Select a sprint to see ticket-level usage.
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string | number }) {
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
