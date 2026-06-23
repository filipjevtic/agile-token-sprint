# Self-Hosting Guide

This document explains how to run Agile Token Sprint on your own infrastructure.

## Prerequisites

- Docker and Docker Compose, or a PostgreSQL 15+ database
- Node.js 20+ (for local development only)

## Option 1: Docker Compose (recommended)

```bash
# Copy and edit environment variables
cp .env.example .env

# Start everything
docker compose up -d

# Run migrations and seed demo data
npm run db:migrate --workspace=apps/server
npm run db:seed --workspace=apps/server

# The seed creates demo tickets, LLM events, session activity, and CI runs
# so the dashboard shows meaningful data immediately.

# Open the dashboard
open http://localhost:8080
```

## Option 2: External PostgreSQL

Set `DATABASE_URL` to your PostgreSQL instance:

```bash
export DATABASE_URL=postgresql://user:pass@your-db-host:5432/ats
npm run db:migrate --workspace=apps/server
npm run start --workspace=apps/server
```

## Reverse proxy / HTTPS

Put the web dashboard and server behind Nginx, Caddy, or Traefik. Set the following:

- `VITE_API_URL` to the public server URL
- `SERVER_URL` (for the proxy) to the public server URL
- Ensure CORS is configured if server and web are on different origins

## Security checklist

- Change `INGEST_API_KEY` from the default `dev-key`
- Use a strong PostgreSQL password
- Run the server behind HTTPS in production
- Restrict network access to the proxy (it forwards to your LLM provider)
- Store issue tracker tokens securely (they are saved in the database)

## Backups

Back up the PostgreSQL database regularly. The `Event` table will grow over time, so plan a retention policy.

## Updates

```bash
git pull
docker compose build --no-cache
docker compose up -d
npm run db:migrate --workspace=apps/server
```

## Troubleshooting

**Server fails to connect to Postgres**
- Verify `DATABASE_URL` points to the correct host
- If using Docker Compose, ensure the `postgres` service is healthy

**Proxy returns 401**
- Verify `INGEST_API_KEY` matches the server's `INGEST_API_KEY`

**No tickets appear in the dashboard**
- Sync from GitHub, Jira, or GitLab using the API or the dashboard
- Ensure the project ID in the dashboard matches the project used during sync
