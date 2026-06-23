export const config = {
  port: Number(process.env.PORT || "4000"),
  serverUrl: process.env.SERVER_URL || "http://localhost:3000",
  ingestApiKey: process.env.INGEST_API_KEY || "dev-key",
  upstreamUrl: process.env.UPSTREAM_URL || "https://api.openai.com",
  provider: process.env.PROVIDER || "openai",
  // Optional default project/workspace to associate events with.
  workspaceId: process.env.WORKSPACE_ID || "default",
  projectId: process.env.PROJECT_ID || "default",
  userId: process.env.USER_ID || "default",
};
