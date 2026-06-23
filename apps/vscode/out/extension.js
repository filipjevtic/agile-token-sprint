"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.activate = activate;
exports.deactivate = deactivate;
const vscode = __importStar(require("vscode"));
let currentTicketId;
let lastActivityStart = Date.now();
let lastActiveFile;
function getConfig() {
    const cfg = vscode.workspace.getConfiguration("burnwise");
    return {
        serverUrl: cfg.get("serverUrl") || "http://localhost:3000",
        ingestApiKey: cfg.get("ingestApiKey") || "dev-key",
        workspaceId: cfg.get("workspaceId") || "default",
        projectId: cfg.get("projectId") || "default",
        userId: cfg.get("userId") || "default",
    };
}
async function emitEvent(event) {
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
    }
    catch (err) {
        console.error("[Burnwise] Failed to emit event:", err);
    }
}
function getGitContext() {
    try {
        const git = vscode.extensions.getExtension("vscode.git")?.exports?.getAPI(1);
        if (!git)
            return {};
        const repo = git.repositories[0];
        if (!repo)
            return {};
        return {
            branch: repo.state.HEAD?.name,
            commitSha: repo.state.HEAD?.commit,
        };
    }
    catch {
        return {};
    }
}
function emitSessionActivity(endTime, fileName) {
    const cfg = getConfig();
    const durationSeconds = Math.max(0, Math.round((endTime - lastActivityStart) / 1000));
    if (durationSeconds < 5)
        return;
    const gitContext = getGitContext();
    const now = new Date().toISOString();
    const event = {
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
function activate(context) {
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
function deactivate() {
    emitSessionActivity(Date.now(), lastActiveFile);
}
