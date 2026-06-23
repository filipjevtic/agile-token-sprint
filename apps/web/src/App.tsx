import { useState } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AppLayout } from "./components/layout/AppLayout.js";
import { useProjectData } from "./hooks/use-project-data.js";
import { DashboardPage } from "./pages/DashboardPage.js";
import { ForecastPage } from "./pages/ForecastPage.js";
import { IntegrationsPage } from "./pages/IntegrationsPage.js";
import { SettingsPage } from "./pages/SettingsPage.js";
import { Button } from "./components/ui/button.js";
import { Input } from "./components/ui/input.js";
import { Label } from "./components/ui/label.js";
import { AlertCircle } from "lucide-react";
import { useAlerts } from "./hooks/use-alerts.js";
import { Alert, AlertTitle, AlertDescription } from "./components/ui/alert.js";

export function App() {
  const [projectId, setProjectId] = useState<string>("default");
  const [alertRefresh, setAlertRefresh] = useState(0);
  const data = useProjectData(projectId);
  const { alerts } = useAlerts(projectId, alertRefresh);

  return (
    <BrowserRouter>
      <AppLayout>
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end">
          <div className="grid w-full max-w-xs items-center gap-1.5">
            <Label htmlFor="projectId">Project ID</Label>
            <Input
              id="projectId"
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
              placeholder="default"
            />
          </div>
          <Button variant="outline" onClick={() => data.refreshForecast(data.forecastTarget)}>
            Refresh forecast
          </Button>
        </div>

        {data.error && (
          <div className="mb-6 flex items-center gap-2 rounded-md bg-destructive/15 p-4 text-sm text-destructive">
            <AlertCircle className="h-4 w-4" />
            {data.error}
          </div>
        )}
        {data.syncMessage && (
          <div className="mb-6 rounded-md bg-green-100 p-4 text-sm text-green-800">{data.syncMessage}</div>
        )}

        {alerts.length > 0 && (
          <div className="mb-6 space-y-3">
            {alerts.map((alert, index) => (
              <Alert key={index} variant={alert.level === "critical" ? "destructive" : "warning"}>
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Budget alert</AlertTitle>
                <AlertDescription>
                  {alert.message} ({alert.usage.toLocaleString()} / {alert.budget.toLocaleString()})
                </AlertDescription>
              </Alert>
            ))}
          </div>
        )}

        <Routes>
          <Route
            path="/"
            element={
              <DashboardPage
                sprints={data.sprints}
                selectedSprint={data.selectedSprint}
                setSelectedSprint={data.setSelectedSprint}
                summary={data.summary}
                loading={data.summaryLoading}
              />
            }
          />
          <Route
            path="/forecast"
            element={
              <ForecastPage
                projectId={projectId}
                forecast={data.forecast}
                forecastTarget={data.forecastTarget}
                setForecastTarget={data.setForecastTarget}
                loading={data.forecastLoading}
              />
            }
          />
          <Route
            path="/integrations"
            element={
              <IntegrationsPage
                projectId={projectId}
                onSync={(message) => {
                  data.setSyncMessage(message);
                  // Refresh sprints after a sync.
                  fetch(`${import.meta.env.VITE_API_URL || "http://localhost:3000"}/api/v1/sprints/project/${projectId}`)
                    .then((res) => res.json())
                    .then((d) => data.sprints !== d.sprints && d.sprints)
                    .catch(() => null);
                }}
              />
            }
          />
          <Route
            path="/settings"
            element={
              <SettingsPage
                projectId={projectId}
                onBudgetUpdated={() => {
                  data.refreshForecast(data.forecastTarget);
                  setAlertRefresh((n) => n + 1);
                }}
              />
            }
          />
        </Routes>
      </AppLayout>
    </BrowserRouter>
  );
}
