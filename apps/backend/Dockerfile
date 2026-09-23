FROM node:24-bookworm-slim
RUN apt-get update && apt-get install -y --no-install-recommends openssl ca-certificates && rm -rf /var/lib/apt/lists/*
RUN npm install -g pnpm@10.34.5
WORKDIR /app
COPY . .
RUN pnpm install --frozen-lockfile
RUN pnpm --filter @phonics/shared build && pnpm --filter @phonics/backend build
WORKDIR /app/apps/backend
EXPOSE 4000
CMD ["node", "dist/src/main.js"]
