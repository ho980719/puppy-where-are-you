# Puppy: Where Are You

Monorepo for a Dog Walk & Pet-Friendly Places app.

Structure
- apps/mobile: Expo (React Native, TypeScript)
- services/api: NestJS API (TypeScript, Prisma, PostgreSQL + PostGIS)
- packages/shared: Shared types/DTOs
- infra: docker-compose (PostgreSQL+PostGIS, Redis)

Getting Started
1) Start infra (DB/Redis)
   - prerequisites: Docker Desktop
   - command:
     - Windows PowerShell
       docker compose -f ./infra/docker-compose.yml up -d

2) Install deps (root + workspaces)
   - npm i -g pnpm (optional)
   - pnpm i  (or yarn / npm - configure workspaces accordingly)

3) Backend env
   - copy services/api/.env.example to services/api/.env and fill values
   - run migrations (Prisma): pnpm --filter @puppy/api prisma migrate dev
   - start API: pnpm --filter @puppy/api dev

4) Mobile env
   - install Expo CLI: npm i -g expo
   - start app: pnpm --filter @puppy/mobile start

Notes
- Default stack: NestJS + Prisma + Postgres(PostGIS) + Redis
- Maps: Google Maps on RN; switchable later to Kakao/Naver as needed
- Auth: email/password; add Google/Apple/Kakao later

