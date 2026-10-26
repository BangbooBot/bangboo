# Build a partir da RAIZ do monorepo (o bot depende de packages/shared):
#   docker build -f packages/bot/Dockerfile -t bangboo-bot .
FROM docker.io/oven/bun:1

WORKDIR /app

# manifests primeiro (cache de dependências)
COPY package.json bun.lock ./
COPY packages/shared/package.json packages/shared/package.json
COPY packages/bot/package.json packages/bot/package.json
COPY packages/backend/package.json packages/backend/package.json
COPY packages/frontend/package.json packages/frontend/package.json
RUN bun install --frozen-lockfile --filter bangboo-bot

COPY packages/shared packages/shared
COPY packages/bot packages/bot

WORKDIR /app/packages/bot
# as variáveis (BOT_TOKEN, DATABASE_URL...) vêm do ambiente do container
CMD ["bun", "src/index.ts"]
