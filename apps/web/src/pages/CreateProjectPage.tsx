import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card.js";
import { Input } from "../components/ui/input.js";
import { Label } from "../components/ui/label.js";
import { Button } from "../components/ui/button.js";
import { Alert, AlertDescription } from "../components/ui/alert.js";
import { AlertCircle, FolderKanban, Sparkles } from "lucide-react";
import { useAuth } from "../context/auth.js";

interface CreateProjectPageProps {
  onCreate: (name: string) => Promise<void>;
  onLoadDemo: () => Promise<void>;
}

export function CreateProjectPage({ onCreate, onLoadDemo }: CreateProjectPageProps) {
  const { user } = useAuth();
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [loadingDemo, setLoadingDemo] = useState(false);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setError(null);
    setCreating(true);
    try {
      await onCreate(name.trim());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create project");
    } finally {
      setCreating(false);
    }
  };

  const handleDemo = async () => {
    setError(null);
    setLoadingDemo(true);
    try {
      await onLoadDemo();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load demo data");
    } finally {
      setLoadingDemo(false);
    }
  };

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="w-full max-w-md space-y-6">
        <div className="flex flex-col items-center gap-2 text-center">
          <FolderKanban className="h-12 w-12 text-muted-foreground" />
          <h1 className="text-2xl font-semibold tracking-tight">
            Welcome{user?.displayName ? `, ${user.displayName}` : ""}
          </h1>
          <p className="text-sm text-muted-foreground">
            Create your first project to start tracking AI usage and costs.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Create a project</CardTitle>
            <CardDescription>Give your project a name to get started.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreate} className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              <div className="grid gap-1.5">
                <Label htmlFor="projectName">Project name</Label>
                <Input
                  id="projectName"
                  placeholder="My App"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
              <Button type="submit" className="w-full" disabled={creating || !name.trim()}>
                {creating ? "Creating..." : "Create project"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">or</span>
          </div>
        </div>

        <Button
          variant="outline"
          className="w-full"
          onClick={handleDemo}
          disabled={loadingDemo}
        >
          <Sparkles className="mr-2 h-4 w-4" />
          {loadingDemo ? "Loading demo data..." : "Explore with demo data"}
        </Button>
      </div>
    </div>
  );
}
