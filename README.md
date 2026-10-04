# node-express-mysql-boilerplate

An Express app backed by PostgreSQL through [Prisma ORM](https://www.prisma.io/) 7. PostgreSQL runs in Docker; the app can run on your machine or in Docker too.

> Despite the repository name, this project uses PostgreSQL, not MySQL.

## Prerequisites

- **Node.js 24** and npm
- **Docker** with Docker Compose (Docker Desktop on Windows/macOS)
- **Git**

**Windows users:** work inside WSL (Ubuntu), with Node installed *in WSL* (for example via [nvm](https://github.com/nvm-sh/nvm)). Running Windows Node against a project stored in WSL breaks npm install scripts and Prisma's config loading. Also enable Docker Desktop → Settings → Resources → WSL Integration → your distro, so `docker` works from the WSL terminal.

## Quick start

```sh
git clone <repository-url>
cd node-express-mysql-boilerplate

cp .env.example .env        # default credentials work as-is for local dev
npm install
npm run db:generate         # generate the Prisma client
npm run db:up               # start PostgreSQL in Docker
npm run db:deploy           # create the tables from prisma/migrations
npm run db:seed             # optional: add sample users
npm start
```

Open <http://localhost:3000/users>. With the sample data you should see:

```json
[{"id":1,"email":"alice@example.com","name":"Alice", ...}, {"id":2,"email":"bob@example.com","name":"Bob", ...}]
```

`npm run db:generate` is a separate step because recent npm versions don't run package install scripts until you approve them, so Prisma won't generate its client during `npm install`. Run it again whenever you reinstall packages or change the schema.

## Run everything in Docker

To run the app in a container too, skip `npm start` and run:

```sh
npm run app:up
```

This builds the app image, waits for the database health check, applies pending migrations, and serves the app on port 3000. Inside Docker the app reaches the database at host `postgres`; `docker-compose.yml` sets that `DATABASE_URL` for you.

## Configuration

All settings live in `.env` (copied from `.env.example`):

| Variable | Default | Used for |
| --- | --- | --- |
| `POSTGRES_DB` | `app_db` | Database name |
| `POSTGRES_USER` | `app_user` | Database user |
| `POSTGRES_PASSWORD` | `app_password` | Database password |
| `POSTGRES_PORT` | `5432` | Host port for PostgreSQL |
| `APP_PORT` | `3000` | Host port for the app container |
| `DATABASE_URL` | `postgresql://app_user:app_password@localhost:5432/app_db?schema=public` | Prisma's connection when the app runs outside Docker |

If you change a `POSTGRES_*` value, update `DATABASE_URL` to match: it is written out in full and does not read the other variables.

PostgreSQL applies `POSTGRES_*` only when its data volume is first created. To apply new credentials to an existing database, recreate it with `docker compose down -v` (this deletes all data).

## npm scripts

| Script | What it does |
| --- | --- |
| `npm start` | Start the app on your machine |
| `npm run db:up` | Start the PostgreSQL container |
| `npm run db:down` | Stop the containers (data is kept) |
| `npm run db:generate` | Generate the Prisma client |
| `npm run db:migrate` | Create and apply a migration after you edit `prisma/schema.prisma` |
| `npm run db:deploy` | Apply existing migrations without prompts |
| `npm run db:seed` | Run `prisma/seed.js` |
| `npm run db:studio` | Browse the database in Prisma Studio |
| `npm run db:reset` | Drop all data, re-apply migrations, and re-seed |
| `npm run app:up` | Build and start the app container alongside the database |

## Changing the database schema

1. Edit `prisma/schema.prisma`.
2. Run `npm run db:migrate -- --name describe_your_change`.
3. Commit the new folder under `prisma/migrations/` together with the schema change.

## Project layout

```
app.js                 Express app setup
bin/www                HTTP server entry point (closes DB connections on shutdown)
db.js                  Shared Prisma client
routes/                Route handlers (routes/users.js reads from the database)
prisma/schema.prisma   Data model
prisma/migrations/     Migration history (commit this)
prisma/seed.js         Sample data
prisma.config.ts       Prisma CLI config (loads .env, sets the database URL)
docker-compose.yml     PostgreSQL service and optional app service
Dockerfile             App image
```

## Troubleshooting

- **`The datasource.url property is required` / `Cannot resolve environment variable: DATABASE_URL`**: `.env` is missing or has no `DATABASE_URL`. Run `cp .env.example .env`.
- **`Can't reach database server at localhost:5432`**: the container isn't running or isn't ready yet. Check `docker compose ps` and wait for `healthy`.
- **Port 5432 or 3000 already in use**: another PostgreSQL install or dev server is using it. Set `POSTGRES_PORT` (and the port in `DATABASE_URL`) or `APP_PORT` in `.env`.
- **`Cannot find module '.prisma/client'` or `@prisma/client did not initialize yet`**: run `npm run db:generate`.
- **`failed to connect to the docker API` in WSL**: turn on Docker Desktop's WSL integration for your distro (see Prerequisites).
