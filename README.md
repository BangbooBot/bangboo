# Bangboo

An intelligent Dashboard built using tanstack start, constatic and nestjs.

Hi, I’m @NathanMiguel, and I’m developing a bot to help me moderate my community and streamline some tasks using AI.

This project is currently for my personal use, but I hope to monetize it in the future and turn it public for everyone to use. 😄

## Estrutura

| Pacote | Descrição |
| --- | --- |
| `packages/shared` | Código compartilhado: env, banco (Drizzle), auth (Better Auth), RBAC e DTOs |
| `packages/backend` | API NestJS (auth Discord OAuth2, RBAC) |
| `packages/bot` | Bot Discord (constatic) |
| `packages/frontend` | Dashboard (TanStack Start) |

> [!WARNING]
> [Bun](https://bun.sh) é o runtime oficial (backend e bot). Banco: **PostgreSQL 18+** (`uuidv7()`).

## Começando

```bash
bun install
docker compose up -d db
cp packages/shared/.env.example packages/shared/.env   # preencha os valores
bun run db:migrate
bun run dev:backend   # e/ou dev:bot, dev:frontend
```

## `bangboo-shared` — como importar

O pacote é consumido como TypeScript (sem build). Cada módulo tem seu *subpath*, para que um app só carregue o que usa:

| Import | Conteúdo | Efeitos colaterais |
| --- | --- | --- |
| `bangboo-shared` | `Role`, helpers de RBAC, DTOs/schemas Zod | nenhum (seguro p/ frontend) |
| `bangboo-shared/rbac`, `/dtos` | idem, separados | nenhum |
| `bangboo-shared/env` | `env` base (`DATABASE_URL`...) | valida env |
| `bangboo-shared/env/bot` | `botEnv` (+ `BOT_TOKEN`) | valida env |
| `bangboo-shared/env/backend` | `backendEnv` (OAuth, JWT, URLs...) | valida env |
| `bangboo-shared/db` | `db`, schema, `userRepository` | abre pool (lazy) |
| `bangboo-shared/auth` | instância `auth` (Better Auth) | requer `backendEnv` |

O bot **não** recebe `DISCORD_CLIENT_SECRET`/`BETTER_AUTH_SECRET` (menor privilégio).

## Banco de dados

```bash
bun run db:generate   # gera migration a partir do schema (packages/shared/src/db/schema)
bun run db:migrate    # aplica
```

## Autenticação (Discord OAuth2 + Better Auth)

1. No [portal do Discord](https://discord.com/developers/applications) → OAuth2 → Redirects, cadastre **exatamente** `DISCORD_REDIRECT_URI` (padrão `http://localhost:8080/auth/callback`).
2. Preencha `DISCORD_CLIENT_ID`, `DISCORD_CLIENT_SECRET`, `BETTER_AUTH_SECRET` (≥ 32 chars) e, opcionalmente, `ROOT_DISCORD_IDS`.

| Rota | Auth | Função |
| --- | --- | --- |
| `GET /auth/login?redirect=/rota` | pública | Redireciona ao Discord (gera `state`) |
| `GET /auth/callback` | pública | Valida `state`, cria/atualiza usuário, cria sessão, emite JWT |
| `POST /auth/refresh` | cookie de sessão | Novo access token (estende a sessão) |
| `POST /auth/logout` | pública/idempotente | Revoga a sessão e apaga cookies |
| `GET /auth/me` | `@Auth()` | Usuário autenticado |
| `GET /auth/jwks` | pública | Chaves públicas para validar o JWT |

**Tokens e cookies** (todos `HttpOnly`, `SameSite=Lax`, `Secure` quando a API é HTTPS):

- **Access token** — JWT EdDSA curto (`ACCESS_TOKEN_TTL`, padrão 15 min), cookie `bangboo.access_token` (`path=/`) ou `Authorization: Bearer`. Validado localmente via JWKS.
- **Refresh token** — sessão opaca no banco (`REFRESH_TOKEN_TTL`, padrão 30 dias, deslizante), cookie `bangboo.session_token` com `path=/auth`. Revogável (logout).
- **Proteções** — `state` + cookie de state (anti login-CSRF), checagem de `Origin`/`Referer` em métodos mutáveis, redirect restrito a caminhos do frontend, rate limit, helmet, CORS só para `FRONTEND_URL`, tokens do Discord criptografados em repouso.

> O role vai no JWT: uma mudança de papel vale a partir do próximo refresh (≤ `ACCESS_TOKEN_TTL`). Use `GET /auth/me` para o dado fresco.

## RBAC

`Role`: `ROOT > ADMIN > PREMIUM > USER` (hierárquico — `ADMIN` satisfaz `PREMIUM`).

```ts
@Auth()                       // qualquer usuário logado (toda rota já exige login por padrão)
@Auth(Role.ADMIN)             // ADMIN ou ROOT
@Roles(Role.PREMIUM)          // idem, só a restrição de papel
@Public()                     // libera do guard global
me(@CurrentUser() user) {}
```

`ROOT` é definido **exclusivamente** por `ROOT_DISCORD_IDS` (sincronizado a cada login; quem sai da lista vira `ADMIN`).

## Testes

```bash
bun run test                                   # unitários (shared + backend)
# fluxo OAuth completo contra um Postgres real, com o Discord simulado:
cd packages/backend && bun run build && bun run start:e2e   # em um terminal (copie packages/shared/.env.e2e.example → .env.e2e e ajuste o DATABASE_URL)
cd packages/backend && bun run test:e2e                      # em outro
```
