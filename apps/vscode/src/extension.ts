import * as vscode from "vscode";
import { type Event } from "@burnwise/schema";

let currentTicketId: string | undefined;
let lastActivityStart: number = Date.now();
let lastActiveFile: string | undefined;

interface Config {
  serverUrl: string;
  ingestApiKey: string;
  workspaceId: string;
  projectId: string;
  userId: string;
}

function getConfig(): Config {
  const cfg = vscode.workspace.getConfiguration("burnwise");
  return {
    serverUrl: cfg.get("serverUrl") || "http://localhost:3000",
    ingestApiKey: cfg.get("ingestApiKey") || "dev-key",
    workspaceId: cfg.get("workspaceId") || "default",
    projectId: cfg.get("projectId") || "default",
    userId: cfg.get("userId") || "default",
  };
}

async function emitEvent(event: Event): Promise<void> {
  const cfg = getConfig();
  try {
    await fetch(`${cfg.serverUrl}/api/v1/events/ingest`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${cfg.ingestApiKey}`,
      },
      body: JSON.stringify({ events: [event] }),
    });
  } catch (err) {
    console.error("[Burnwise] Failed to emit event:", err);
  }
}

function getGitContext(): { branch?: string; commitSha?: string } {
  try {
    const git = vscode.extensions.getExtension("vscode.git")?.exports?.getAPI(1);
    if (!git) return {};
    const repo = git.repositories[0];
    if (!repo) return {};
    return {
      branch: repo.state.HEAD?.name,
      commitSha: repo.state.HEAD?.commit,
    };
  } catch {
    return {};
  }
}

function emitSessionActivity(endTime: number, fileName?: string): void {
  const cfg = getConfig();
  const durationSeconds = Math.max(0, Math.round((endTime - lastActivityStart) / 1000));
  if (durationSeconds < 5) return;

  const gitContext = getGitContext();
  const now = new Date().toISOString();

  const event: Event = {
    eventId: crypto.randomUUID(),
    eventType: "session.activity",
    timestamp: now,
    source: "ide-plugin",
    workspaceId: cfg.workspaceId,
    projectId: cfg.projectId,
    userId: cfg.userId,
    ticketId: currentTicketId,
    metadata: {
      fileName,
      ...gitContext,
    },
    payload: {
      activityType: "coding",
      startTime: new Date(lastActivityStart).toISOString(),
      endTime: now,
      durationSeconds,
      branch: gitContext.branch,
      commitSha: gitContext.commitSha,
    },
  };

  void emitEvent(event);
  lastActivityStart = endTime;
}

export function activate(context: vscode.ExtensionContext): void {
  console.log("[Burnwise] Extension activated");

  const setTicketCommand = vscode.commands.registerCommand("burnwise.setTicket", async () => {
    const ticketId = await vscode.window.showInputBox({
      prompt: "Enter ticket ID (e.g., PROJ-123)",
      value: currentTicketId,
    });
    if (ticketId !== undefined) {
      currentTicketId = ticketId || undefined;
      vscode.window.showInformationMessage(`Current ticket: ${currentTicketId || "none"}`);
    }
  });

  const statusCommand = vscode.commands.registerCommand("burnwise.getStatus", () => {
    vscode.window.showInformationMessage(`Current ticket: ${currentTicketId || "none"}`);
  });

  const onChangeActive = vscode.window.onDidChangeActiveTextEditor((editor) => {
    const now = Date.now();
    emitSessionActivity(now, lastActiveFile);
    lastActiveFile = editor?.document.fileName;
  });

  const interval = setInterval(() => {
    const now = Date.now();
    emitSessionActivity(now, lastActiveFile);
  }, 60_000);

  context.subscriptions.push(setTicketCommand, statusCommand, onChangeActive);
  context.subscriptions.push({
    dispose: () => clearInterval(interval),
  });
}

export function deactivate(): void {
  emitSessionActivity(Date.now(), lastActiveFile);
}
