# Chorific

A household chore chart and allowance tracker. Assign chores to family members, track completions with a swim-lane checklist, watch balances grow, and pay out earnings with a single tap.

---

## Features

- **Household members** — add members with custom avatar colors
- **Chores** — create chores with icons, dollar values, and daily or weekly schedules
- **Swim-lane checklist** — all members side-by-side, tap to check off chores and earn money
- **Balances & payouts** — live cash balances per member with a one-tap payout flow
- **History** — full log of completed chores, filterable by member

---

## Running Locally with Docker Compose

### Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (includes Docker Compose) — version 24 or later recommended
- No other dependencies required; everything runs inside containers

### Quick Start

**1. Clone the repository**

```bash
git clone <your-repo-url>
cd chorific
```

**2. Build and start all services**

```bash
docker compose up --build
```

This will:
- Pull the official Postgres 16 image
- Build the API server image locally (`chorific-api`)
- Build the frontend image locally (`chorific-web`)
- Run database migrations automatically on first start
- Start all three services

The first build takes a few minutes. Subsequent starts are much faster.

**3. Open the app**

Navigate to [http://localhost:8080](http://localhost:8080) in your browser.

The API is also directly accessible at [http://localhost:3000/api](http://localhost:3000/api).

---

## Services

| Service | Port | Description |
|---------|------|-------------|
| `web`   | 8080 | React frontend served by nginx. Proxies `/api/*` to the API. |
| `api`   | 3000 | Express API server |
| `db`    | 5432 | PostgreSQL 16 database |

---

## Common Commands

**Start (after the first build)**

```bash
docker compose up
```

**Start in the background**

```bash
docker compose up -d
```

**Stop all services**

```bash
docker compose down
```

**Rebuild after code changes**

```bash
docker compose up --build
```

**View logs**

```bash
# All services
docker compose logs -f

# A specific service
docker compose logs -f api
```

**Reset the database** (deletes all data)

```bash
docker compose down -v
docker compose up --build
```

---

## Configuration

Environment variables are set in `docker-compose.yml`. The defaults work out of the box for local development.

| Variable | Default | Description |
|----------|---------|-------------|
| `POSTGRES_USER` | `chorific` | Database user |
| `POSTGRES_PASSWORD` | `chorific` | Database password |
| `POSTGRES_DB` | `chorific` | Database name |
| `DATABASE_URL` | *(auto-constructed)* | Full Postgres connection string passed to the API |
| `PORT` | `3000` | Port the API server listens on |

To change any of these, edit `docker-compose.yml` before running.

---

## Project Structure

```
.
├── artifacts/
│   ├── api-server/       # Express API (TypeScript)
│   └── chorific/         # React + Vite frontend
├── lib/
│   ├── db/               # Drizzle ORM schema and database client
│   ├── api-spec/         # OpenAPI spec (source of truth)
│   ├── api-client-react/ # Generated React Query hooks
│   └── api-zod/          # Generated Zod validators
├── docker-compose.yml
├── Dockerfile.api
├── Dockerfile.web
├── nginx.conf
└── docker-entrypoint.sh
```

---

## License

MIT — see [LICENSE](./LICENSE)
