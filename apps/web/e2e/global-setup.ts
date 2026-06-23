import { request } from "@playwright/test";

const API_URL = "http://localhost:3000";
const E2E_EMAIL = "e2e@test.com";
const E2E_PASSWORD = "e2epassword";

async function waitForServer(url: string, retries = 30) {
  const ctx = await request.newContext();
  for (let i = 0; i < retries; i++) {
    try {
      const res = await ctx.get(url);
      if (res.ok()) return;
    } catch {
      // not ready yet
    }
    await new Promise((r) => setTimeout(r, 1000));
  }
  throw new Error(`Server at ${url} did not become ready`);
}

export default async function globalSetup() {
  await waitForServer(`${API_URL}/health`);

  const ctx = await request.newContext();

  // Check if setup is required (fresh DB) or if user already exists.
  const setupRes = await ctx.get(`${API_URL}/api/v1/auth/setup-required`);
  const { setupRequired } = await setupRes.json();

  let token: string;

  if (setupRequired) {
    const res = await ctx.post(`${API_URL}/api/v1/auth/setup`, {
      data: {
        email: E2E_EMAIL,
        password: E2E_PASSWORD,
        displayName: "E2E User",
        workspaceName: "E2E Workspace",
      },
    });
    const body = await res.json();
    token = body.token;
  } else {
    const loginRes = await ctx.post(`${API_URL}/api/v1/auth/login`, {
      data: { email: E2E_EMAIL, password: E2E_PASSWORD },
    });
    if (!loginRes.ok()) {
      console.warn("E2E user login failed — tests requiring auth may fail.");
      return;
    }
    const body = await loginRes.json();
    token = body.token;
  }

  // Seed demo data so tests have a project + sprint to work with.
  await ctx.post(`${API_URL}/api/v1/admin/seed-demo`, {
    headers: { Authorization: `Bearer ${token}` },
  });
}
