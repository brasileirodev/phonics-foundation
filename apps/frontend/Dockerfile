FROM node:24-bookworm-slim AS build
RUN npm install -g pnpm@10.34.5
WORKDIR /app
COPY . .
RUN pnpm install --frozen-lockfile
ARG VITE_API_URL=http://localhost:4000
ENV VITE_API_URL=$VITE_API_URL
RUN pnpm --filter @phonics/shared build && pnpm --filter @phonics/frontend build
FROM nginx:1.28-alpine
COPY apps/frontend/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/apps/frontend/dist /usr/share/nginx/html
EXPOSE 80
