# Agile Token Sprint Architecture

This document describes the high-level architecture of the platform.

## System Overview

```mermaid
flowchart TB
    subgraph Collectors["Collectors"]
        A[IDE plugins]
        B[API proxy]
        C[CLI]
        D[CI/CD webhooks]
    end

    subgraph Server["apps/server Fastify API"]
        E[Events /ingest]
        F[Association service]
        G[Integrations GitHub/Jira/GitLab]
        H[Forecast]
        I[Alerts]
        J[Team]
        K[CI/CD]
    end

    subgraph Frontend["apps/web React Dashboard"]
        L[Dashboard]
        M[Forecast & CI]
        N[Integrations]
        O[Settings & Team]
    end

    subgraph Data["Data"]
        P[(PostgreSQL)]
        Q[Prisma ORM]
    end

    A -->|usage events| E
    B -->|LLM events| E
    C -->|session activity| E
    D -->|ci.run| K
    E -->|validate| F
    F -->|link to ticket| P
    G -->|sync sprints/tickets| P
    H -->|read history| P
    I -->|read usage| P
    J -->|read/write| P
    K -->|persist| P
    P -->|query| L
    P -->|query| M
    P -->|query| N
    P -->|query| O
    L -->|REST| Server
    M -->|REST| Server
    N -->|REST| Server
    O -->|REST| Server
```

## Data Model

```mermaid
erDiagram
    Workspace ||--o{ Project : has
    Workspace ||--o{ User : has
    Project ||--o{ Ticket : has
    Project ||--o{ Sprint : has
    Project ||--o{ Event : has
    Project ||--o{ TeamMember : has
    Project ||--o| IssueTrackerConfig : has
    Sprint ||--o{ Ticket : contains
    User ||--o{ Event : emits
    User ||--o{ TeamMember : belongs
    Ticket ||--o{ Event : linked
    TeamMember }o--|| User : member
```

## Event Flow

1. Collectors emit events (IDE, proxy, CLI, CI)
2. Ingestion API validates the batch schema
3. Association service links events to tickets by explicit ID, prompt text, or git context
4. Events are persisted in PostgreSQL
5. Dashboard queries aggregated summaries per ticket, sprint, and project

## Integration Flow

```mermaid
sequenceDiagram
    participant UI as Dashboard
    participant API as Server
    participant GH as GitHub API
    participant JI as Jira API
    participant GL as GitLab API
    participant DB as PostgreSQL

    UI->>API: POST /integrations/github/:id
    API->>GH: fetch milestones & issues
    GH-->>API: milestones + issues
    API->>DB: upsert sprints & tickets

    UI->>API: POST /integrations/jira/:id
    API->>JI: board -> sprints -> issues
    JI-->>API: issues
    API->>DB: upsert sprints & tickets

    UI->>API: POST /integrations/gitlab/:id
    API->>GL: milestones & issues
    GL-->>API: issues
    API->>DB: upsert sprints & tickets
```

## Components

| Component | Location | Responsibility |
|-----------|----------|----------------|
| Web dashboard | `apps/web` | React UI, Tailwind + shadcn/ui |
| Server API | `apps/server` | Fastify REST API, Prisma, integrations |
| Proxy | `apps/proxy` | Forward LLM calls, emit events |
| CLI | `apps/cli` | Wrap commands, emit session activity |
| VS Code extension | `apps/vscode` | IDE collector |
| Schema | `packages/schema` | Zod event schemas |

## Deployment

```mermaid
flowchart LR
    subgraph Host
        Nginx
        Web[Web static files]
        Server[Fastify server]
        Proxy[API proxy]
        Postgres[(PostgreSQL)]
    end
    Client[Browser] -->|HTTPS| Nginx
    Nginx -->|/| Web
    Nginx -->|/api| Server
    Server -->|read/write| Postgres
    IDE -->|HTTP| Proxy
    Proxy -->|forward| LLMProvider
    Proxy -->|events| Server
```

See `SELFHOST.md` for detailed deployment instructions.
