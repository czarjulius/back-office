# Back-office

A production-ready back-office application built as a modular monolith.

## Stack

- Frontend: React + TypeScript + Vite
- Backend: Node.js + TypeScript + Express
- Database: PostgreSQL + Prisma
- Testing: Vitest + Playwright
- Containerization: Docker Compose

## Monorepo scripts

```bash
npm install
npm run dev:frontend
npm run dev:backend
```

## Environment

Copy the example environment files before running the app:

```bash
cp .env.example .env
cp backend/.env.example backend/.env
```

## Working folders

- frontend/
- backend/

## Current status

- Frontend foundation scaffolded and running
- Backend TypeScript foundation scaffolded and compiling
- Root workspace prepared for the next implementation phases
