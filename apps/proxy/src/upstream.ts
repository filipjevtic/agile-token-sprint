import { config } from "./config.js";

interface ForwardRequestInput {
  method: string;
  path: string;
  headers: Record<string, string | string[]>;
  body: unknown;
}

interface ForwardRequestOutput {
  response: Response;
  responseBody: string;
  statusCode: number;
  headers: Record<string, string | undefined>;
}

export async function forwardRequest(input: ForwardRequestInput): Promise<ForwardRequestOutput> {
  const url = new URL(input.path, config.upstreamUrl).toString();

  const forwardHeaders = new Headers();
  for (const [key, value] of Object.entries(input.headers)) {
    if (value === undefined) continue;
    if (["host", "connection", "content-length"].includes(key.toLowerCase())) continue;
    if (Array.isArray(value)) {
      for (const v of value) {
        forwardHeaders.append(key, v);
      }
    } else {
      forwardHeaders.set(key, value);
    }
  }

  const fetchInit: RequestInit = {
    method: input.method,
    headers: forwardHeaders,
  };

  if (input.body && input.method !== "GET" && input.method !== "HEAD") {
    fetchInit.body = JSON.stringify(input.body);
  }

  const response = await fetch(url, fetchInit);
  const responseBody = await response.text();

  const headers: Record<string, string | undefined> = {};
  response.headers.forEach((value, key) => {
    headers[key] = value;
  });

  return {
    response,
    responseBody,
    statusCode: response.status,
    headers,
  };
}
