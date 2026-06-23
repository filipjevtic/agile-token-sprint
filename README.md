# Burnwise

[![GitHub](https://img.shields.io/badge/GitHub-filipjevtic%2Fagile--token--sprint-blue?logo=github)](https://github.com/filipjevtic/burnwise)

Self-hosted, open-source platform that captures developer LLM token usage, traces, and other effort signals from IDEs, API proxies, and CLI tools, associates them with Jira / GitHub / GitLab tickets, and helps PMs build more realistic sprint plans.

## Goal

Turn AI usage into a first-class planning signal. Instead of guessing story points or hours, teams use actual ticket-level data to forecast workload, budget, and achievable sprint scope.

## Status

M7 complete: budget alerts, real Jira/GitLab sync, team management, and CI/CD cost capture. M8 in progress: production polish and demo data.

## Quick Start

```bash
# Install dependencies
npm install --workspaces --include-workspace-root

# Start the database and services
docker compose up -d

# Run migrations and seed demo data
npm run db:migrate --workspace=apps/server
npm run db:seed --workspace=apps/server

# Start the server, proxy, and web dashboard
npm run dev --workspace=apps/server
npm run dev --workspace=apps/proxy
npm run dev --workspace=apps/web
```

See `SELFHOST.md` for detailed production deployment instructions.

## Environment Variables

### Server (`apps/server`)

| Variable | Default | Description |
|----------|---------|-------------|
| `DATABASE_URL` | `postgresql://ats:ats@localhost:5432/ats` | PostgreSQL connection string |
| `PORT` | `3000` | HTTP port |
| `INGEST_API_KEY` | `dev-key` | API key for event ingestion |

### Proxy (`apps/proxy`)

| Variable | Default | Description |
|----------|---------|-------------|
| `SERVER_URL` | `http://localhost:3000` | URL of the Burnwise server |
| `INGEST_API_KEY` | `dev-key` | Must match server `INGEST_API_KEY` |
| `UPSTREAM_URL` | `https://api.openai.com` | Target LLM provider URL |
| `PROVIDER` | `openai` | Provider name for events |
| `WORKSPACE_ID` | `default` | Default workspace for events |
| `PROJECT_ID` | `default` | Default project for events |
| `USER_ID` | `default` | Default user for events |

### Web (`apps/web`)

| Variable | Default | Description |
|----------|---------|-------------|
| `VITE_API_URL` | `http://localhost:3000` | Server URL for API calls |

## Collectors

### CLI (`apps/cli`)

Wrap any command to emit a `session.activity` event.

```bash
# From the workspace root
npm run build --workspace=@burnwise/cli
node apps/cli/dist/index.js --ticket-id PROJ-123 --activity-type coding -- npm test

# Or install globally
npm link apps/cli
ats --ticket-id PROJ-123 -- claude code "refactor login"
```

### VS Code Extension (`apps/vscode`)

Open the `apps/vscode` folder in VS Code and press F5 to run the extension in a new window.

Commands:
- `Burnwise: Set Current Ticket` â€” associate subsequent activity with a ticket.
- `Burnwise: Show Status` â€” show the current ticket.

### MCP Server (`apps/mcp`)

An MCP server exposing tools for Claude Code and other MCP clients:
- `set_ticket` â€” set the current ticket ID.
- `get_ticket` â€” read the current ticket ID.
- `emit_session_activity` â€” emit a `session.activity` event.

Add to your Claude Code or MCP config:

```json
{
  "mcpServers": {
    "burnwise": {
      "command": "node",
      "args": ["C:/Users/filip/CascadeProjects/burnwise/apps/mcp/dist/index.js"]
    }
  }
}
```

## API Endpoints

- `POST /api/v1/events/ingest` â€” Ingest usage events.
- `GET /api/v1/events/by-ticket/:ticketId` â€” List events for a ticket.
- `GET /api/v1/events/by-project/:projectId` â€” List events for a project.
- `GET /api/v1/tickets/project/:projectId` â€” List tickets in a project.
- `GET /api/v1/tickets/summary/:ticketId` â€” Get token/cost summary for a ticket.
- `GET /api/v1/sprints/project/:projectId` â€” List sprints in a project.
- `GET /api/v1/sprints/summary/:sprintId` â€” Get sprint token/cost summary.
- `POST /api/v1/integrations/github/:projectId` â€” Sync GitHub issues & milestones.
- `POST /api/v1/integrations/jira/:projectId` â€” Sync Jira issues & sprints.
- `POST /api/v1/integrations/gitlab/:projectId` â€” Sync GitLab issues & milestones.
- `GET /api/v1/forecast/project/:projectId` â€” Get historical capacity baseline.
- `POST /api/v1/forecast/project/:projectId` â€” Forecast recommended budget for a target.
- `PUT /api/v1/projects/:projectId` â€” Update project token/cost budgets and alert thresholds.
- `PUT /api/v1/projects/sprint/:sprintId` â€” Update sprint token/cost budgets and alert thresholds.
- `GET /api/v1/alerts/project/:projectId` â€” Get active budget alerts for a project.
- `GET /api/v1/alerts/sprint/:sprintId` â€” Get active budget alerts for a sprint.
- `GET /api/v1/team/:projectId` â€” List project team members.
- `POST /api/v1/team/:projectId` â€” Add or upsert a team member.
- `PUT /api/v1/team/:projectId/:userId` â€” Update a team member's role.
- `DELETE /api/v1/team/:projectId/:userId` â€” Remove a team member.
- `POST /api/v1/ci/webhook/:projectId` â€” Ingest CI/CD run events (GitHub Actions, GitLab CI, or generic).
- `GET /api/v1/ci/summary/:projectId` â€” Get aggregate CI/CD cost and duration.

## Architecture

See `ARCHITECTURE.md` for diagrams and a detailed system overview.

- **Collectors** â€” IDE plugins, API proxy, and CLI hooks emit usage events.
- **Ingestion API** â€” Accepts events, validates them, and persists them.
- **Association service** â€” Links events to tickets using git context, prompt metadata, or manual rules.
- **Aggregation database** â€” PostgreSQL for relational data and time-series metrics.
- **Web dashboard** â€” React frontend for PMs and developers.

## UI/UX

The dashboard (`apps/web`) uses:

- **Tailwind CSS** for styling
- **shadcn/ui** design system primitives
- **Lucide** icons
- **React Router** for navigation
- **Dark mode** toggle with system preference detection

Integration logos are stored in `apps/web/public/logos/`.

## Signals

The platform captures multiple signals to estimate ticket effort:

- LLM tokens, cost, and latency
- Agent traces (Claude Trace, LangChain, etc.)
- Wall-clock coding time
- CI/CD costs
- Git activity

## Development

```bash
# Type-check everything
npm run typecheck --workspaces

# Build everything
npm run build --workspaces

# Run unit tests
npm run test --workspace=packages/schema

# Run E2E tests (starts server and dashboard automatically, excludes visual regression)
npm run e2e --workspace=apps/web

# Run E2E tests in UI mode
npm run e2e:ui --workspace=apps/web

# Run visual regression tests
npm run e2e:visual --workspace=apps/web

# Update visual regression baselines (generated in CI, not committed)
npm run e2e:update-snapshots --workspace=apps/web
```

## License

Apache 2.0 â€” see `LICENSE`.

## Business Model

This is a fully self-hosted open-source project. Optional revenue paths:

- Commercial support and onboarding
- Sponsored / paid features that remain open source
- Future hosted offering only if the project grows beyond a one-person stage

