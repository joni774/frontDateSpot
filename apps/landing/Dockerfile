FROM node:20-alpine

WORKDIR /app
RUN corepack enable && corepack prepare pnpm@9.15.0 --activate

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/landing/package.json ./apps/landing/

RUN pnpm install --frozen-lockfile --filter landing...

COPY apps/landing ./apps/landing

ARG VITE_API_URL=https://datespot-server-production-ecb2.up.railway.app
ENV VITE_API_URL=$VITE_API_URL

RUN pnpm --filter landing build

WORKDIR /app/apps/landing
EXPOSE 3000

CMD ["sh", "-c", "npx --yes serve dist -l tcp://0.0.0.0:${PORT:-3000}"]
