import { execSync } from "node:child_process";

export function getGitContext(): { branch?: string; commitSha?: string } {
  try {
    const branch = execSync("git branch --show-current", { encoding: "utf-8", stdio: ["pipe", "pipe", "ignore"] }).trim();
    const commitSha = execSync("git rev-parse HEAD", { encoding: "utf-8", stdio: ["pipe", "pipe", "ignore"] }).trim();
    return { branch, commitSha };
  } catch {
    return {};
  }
}
