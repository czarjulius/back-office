# Back-office

A production-aware back-office application built as a modular monolith with a React frontend, Express API, PostgreSQL database, and Prisma data layer.

## Stack

- Frontend: React + TypeScript + Vite
- Backend: Node.js + TypeScript + Express
- Database: PostgreSQL + Prisma
- Auth and sessions: custom session middleware with Bearer-token validation
- Testing: Vitest + Playwright
- Containerization: Docker and Docker Compose

## Project structure

- frontend/: React application and Vite build
- backend/: Express API and Prisma schema
- docker-compose.yml: local PostgreSQL, backend, and frontend services
- .env.example: shared environment defaults
- backend/.env.example: backend defaults

## Local development

Install dependencies and run the app in separate terminals:

```bash
npm install
npm run dev:frontend
npm run dev:backend
```

The frontend runs on http://localhost:5173 and the API runs on http://localhost:3000.

## Environment variables

Copy the example files before starting services:

```bash
cp .env.example .env
cp backend/.env.example backend/.env
```

Required values:

```env
# root .env
VITE_API_URL=http://localhost:3000

# backend/.env
PORT=3000
NODE_ENV=development
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/backoffice
```

For Docker Compose, the service environment uses:

```env
DATABASE_URL=postgresql://postgres:postgres@postgres:5432/backoffice
```

## Docker

Start the local stack with PostgreSQL, backend, and frontend:

```bash
docker compose up --build
```

Stop and clean the stack:

```bash
docker compose down -v
```

This is intended for the local development workflow. The containerized app uses the same code path as the local app, with database persistence enabled via the Docker volume.

## Production-style run

Build the app for production:

```bash
npm --prefix frontend run build
npm --prefix backend run build
npx prisma generate --prefix backend
```

Run the backend in production mode:

```bash
cd backend
NODE_ENV=production PORT=3000 DATABASE_URL="postgresql://postgres:postgres@localhost:5432/backoffice" node dist/index.js
```

Run the frontend as a static build behind a web server or proxy. The frontend reads the API origin from the VITE_API_URL environment variable at build time:

```bash
cd frontend
VITE_API_URL=http://localhost:3000 npm run build
```

## Production deployment notes

- Use managed PostgreSQL in production instead of the dockerized local database.
- Keep secrets out of source control and set them in the deployment environment.
- Use a reverse proxy or load balancer in front of the frontend and API if exposing both publicly.
- For production, run the backend as a Node process with a health check and restart policy.
- Keep the Prisma schema and generated client synchronized by running `npx prisma generate` after schema changes.

## Testing

Run the complete unit and integration suite:

```bash
npm test
```

Generate frontend or backend coverage reports:

```bash
npm run test:frontend:coverage
npm run test:backend:coverage
```

Open the generated HTML reports:

```bash
open frontend/coverage/index.html
open backend/coverage/index.html
```
