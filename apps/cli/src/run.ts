import { spawn } from "node:child_process";
import { config } from "./config.js";
import { getGitContext } from "./git.js";
import { emitEvent } from "./events.js";
import type { Event } from "@burnwise/schema";

export interface RunCommandOptions {
  command: string;
  args: string[];
  activityType?: "coding" | "review" | "planning" | "debugging" | "other";
  ticketId?: string;
}

export async function runCommand(options: RunCommandOptions): Promise<number> {
  const startTime = new Date().toISOString();
  const gitContext = getGitContext();
  const ticketId = options.ticketId || config.ticketId;

  return new Promise((resolve, reject) => {
    const useShell = process.platform === "win32";
    const child = useShell
      ? spawn(`${options.command} ${options.args.map((a) => `"${a.replace(/"/g, '""')}"`).join(" ")}`, {
          stdio: "inherit",
          shell: true,
        })
      : spawn(options.command, options.args, { stdio: "inherit" });

    child.on("error", (err) => reject(err));
    child.on("close", async (code) => {
      const endTime = new Date().toISOString();
      const startMs = new Date(startTime).getTime();
      const endMs = new Date(endTime).getTime();
      const durationSeconds = Math.max(0, Math.round((endMs - startMs) / 1000));

      const event: Event = {
        eventId: crypto.randomUUID(),
        eventType: "session.activity",
        timestamp: startTime,
        source: "cli",
        workspaceId: config.workspaceId,
        projectId: config.projectId,
        userId: config.userId,
        ticketId,
        metadata: {
          command: options.command,
          args: options.args,
          exitCode: code,
          ...gitContext,
        },
        payload: {
          activityType: options.activityType || "other",
          startTime,
          endTime,
          durationSeconds,
          branch: gitContext.branch,
          commitSha: gitContext.commitSha,
        },
      };

      try {
        await emitEvent(event);
      } catch (err) {
        console.error("Failed to emit session activity event:", err);
      }

      resolve(code ?? 1);
    });
  });
}
