FROM docker.io/library/node:22-alpine AS builder

RUN apk add --no-cache python3 make g++

RUN corepack enable && corepack prepare pnpm@11 --activate

WORKDIR /app

COPY pnpm-lock.yaml pnpm-workspace.yaml .npmrc package.json ./
COPY client/package.json client/
RUN pnpm install --frozen-lockfile --ignore-scripts

COPY prisma/schema.prisma prisma/
COPY src/db/prisma/schema.prisma prisma/schema.prisma
RUN npx prisma generate

COPY . .

RUN pnpm --filter @parqueadero/client build

RUN pnpm build

FROM docker.io/library/node:22-alpine AS runner

RUN apk add --no-cache python3 make g++

RUN corepack enable && corepack prepare pnpm@11 --activate

WORKDIR /app

COPY --from=builder /app/package.json /app/pnpm-lock.yaml /app/pnpm-workspace.yaml ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/client/dist ./client/dist
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/src/db/prisma/schema.prisma ./prisma/schema.prisma
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

RUN cd /app/node_modules/.pnpm/bcrypt@5.1.1/node_modules/bcrypt && npm run install --build-from-source 2>&1 || true
RUN ls /app/node_modules/.pnpm/bcrypt@5.1.1/node_modules/bcrypt/lib/binding/napi-v3/ 2>&1 || echo "Binding not found"

RUN apk del python3 make g++

ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000

ENTRYPOINT ["/entrypoint.sh"]
