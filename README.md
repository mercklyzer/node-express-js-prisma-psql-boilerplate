# node-express-mysql-boilerplate

An Express app backed by PostgreSQL through [Prisma ORM](https://www.prisma.io/) 7. PostgreSQL runs in Docker and the app runs on your machine. It also calls Claude on [AWS Bedrock](https://aws.amazon.com/bedrock/) and logs every LLM call to the database.

> Despite the repository name, this project uses PostgreSQL, not MySQL.

## Prerequisites

- **Node.js 24** and npm
- **Docker** with Docker Compose (Docker Desktop on Windows/macOS)
- **Git**
- **AWS credentials** with access to `apac.anthropic.claude-3-haiku-20240307-v1:0` in Bedrock region `ap-southeast-1` (only needed for `/sample-call`)

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

## LLM calls (AWS Bedrock)

`GET /sample-call` sends "Hello world" to Claude 3 Haiku on Bedrock and returns the reply:

```sh
curl http://localhost:3000/sample-call
# {"data":"Hello! I'm an AI assistant created by Anthropic. How can I assist you today?"}
```

Set `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY` (plus `AWS_SESSION_TOKEN` for temporary credentials) in `.env` first. The AWS SDK's default credential chain also picks up `~/.aws/credentials` or `AWS_PROFILE`.

All LLM calls go through `services/llmService.js`, whose `invoke(prompt)` sends the prompt to Bedrock and saves the prompt and reply to the `llm_logs` table (`input`, `output`). To add an LLM feature, call `llmService.invoke` from a controller, not the AWS SDK directly, so the call is logged. If Bedrock returns an error, nothing is logged and the error reaches the Express error handler.

## Inspecting the database

- **Prisma Studio**: `npm run db:studio` opens a browser view of every table.
- **Node REPL**, similar to `rails console`: run `node` in the project root, then:

  ```js
  const prisma = require('./db')
  await prisma.llmLog.findMany({ orderBy: { id: 'desc' }, take: 5 })
  ```

- **psql**: `docker exec -it node-express-postgres-db psql -U app_user -d app_db -c 'SELECT * FROM llm_logs;'`

## Configuration

All settings live in `.env` (copied from `.env.example`):

| Variable | Default | Used for |
| --- | --- | --- |
| `POSTGRES_DB` | `app_db` | Database name |
| `POSTGRES_USER` | `app_user` | Database user |
| `POSTGRES_PASSWORD` | `app_password` | Database password |
| `POSTGRES_PORT` | `5432` | Host port for PostgreSQL |
| `DATABASE_URL` | `postgresql://app_user:app_password@localhost:5432/app_db?schema=public` | Prisma's connection to the database |
| `AWS_ACCESS_KEY_ID` | (empty) | AWS credentials for Bedrock |
| `AWS_SECRET_ACCESS_KEY` | (empty) | AWS credentials for Bedrock |
| `AWS_SESSION_TOKEN` | (unset) | Only for temporary AWS credentials |

If you change a `POSTGRES_*` value, update `DATABASE_URL` to match: it is written out in full and does not read the other variables.

PostgreSQL applies `POSTGRES_*` only when its data volume is first created. To apply new credentials to an existing database, recreate it with `docker compose down -v` (this deletes all data).

## npm scripts

| Script | What it does |
| --- | --- |
| `npm start` | Start the app on your machine |
| `npm run db:up` | Start the PostgreSQL container |
| `npm run db:down` | Stop the database container (data is kept) |
| `npm run db:generate` | Generate the Prisma client |
| `npm run db:migrate` | Create and apply a migration after you edit `prisma/schema.prisma` |
| `npm run db:deploy` | Apply existing migrations without prompts |
| `npm run db:seed` | Run `prisma/seed.js` |
| `npm run db:studio` | Browse the database in Prisma Studio |
| `npm run db:reset` | Drop all data, re-apply migrations, and re-seed |

## Changing the database schema

1. Edit `prisma/schema.prisma`.
2. Run `npm run db:migrate -- --name describe_your_change`.
3. Commit the new folder under `prisma/migrations/` together with the schema change.

## Project layout

```
app.js                 Express app setup
bin/www                HTTP server entry point (closes DB connections on shutdown)
db.js                  Shared Prisma client
routes/                URL routing (routes/users.js reads from the database; routes/sample.js maps /sample-call)
controllers/           Request handlers (controllers/sampleController.js)
services/              Business logic (services/llmService.js calls Bedrock and logs each call)
models/                Database access through Prisma (models/llmLog.js)
prisma/schema.prisma   Data model (User, LlmLog → llm_logs)
prisma/migrations/     Migration history (commit this)
prisma/seed.js         Sample data
prisma.config.ts       Prisma CLI config (loads .env, sets the database URL)
docker-compose.yml     PostgreSQL service
```

## Troubleshooting

- **`The datasource.url property is required` / `Cannot resolve environment variable: DATABASE_URL`**: `.env` is missing or has no `DATABASE_URL`. Run `cp .env.example .env`.
- **`Can't reach database server at localhost:5432`**: the container isn't running or isn't ready yet. Check `docker compose ps` and wait for `healthy`.
- **Port 5432 or 3000 already in use**: another PostgreSQL install or dev server is using it. For the database, set `POSTGRES_PORT` (and the port in `DATABASE_URL`) in `.env`. For the app, start it on another port with `PORT=3001 npm start`.
- **`CredentialsProviderError` / `Could not load credentials` on `/sample-call`**: set the AWS variables in `.env` (see Configuration).
- **`AccessDeniedException` on `/sample-call`**: the AWS identity lacks `bedrock:InvokeModel` permission, or the model isn't enabled in the Bedrock console for `ap-southeast-1`.
- **`Cannot find module '.prisma/client'` or `@prisma/client did not initialize yet`**: run `npm run db:generate`.
- **`failed to connect to the docker API` in WSL**: turn on Docker Desktop's WSL integration for your distro (see Prerequisites).
