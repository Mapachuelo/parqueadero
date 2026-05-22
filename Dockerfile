FROM docker.io/library/node:22-alpine AS builder

RUN corepack enable && corepack prepare pnpm@11 --activate

WORKDIR /app

COPY pnpm-lock.yaml package.json .npmrc ./
RUN pnpm install --frozen-lockfile --ignore-scripts
RUN pnpm rebuild bcrypt @prisma/client @prisma/engines prisma esbuild

COPY prisma/schema.prisma prisma/
RUN npx prisma generate

COPY . .

RUN pnpm build

FROM docker.io/library/node:22-alpine AS runner

RUN corepack enable && corepack prepare pnpm@11 --activate

WORKDIR /app

COPY --from=builder /app/package.json /app/pnpm-lock.yaml ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/src/db/prisma/schema.prisma ./prisma/schema.prisma
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000

ENTRYPOINT ["/entrypoint.sh"]
