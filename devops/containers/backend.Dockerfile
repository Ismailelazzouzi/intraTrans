FROM node:22-alpine AS builder

WORKDIR /app

COPY backend/package*.json ./
RUN npm ci

COPY backend/ .

ARG DATABASE_URL=postgresql://build:build@localhost:5432/build
ENV DATABASE_URL=$DATABASE_URL
RUN npx prisma generate --schema=prisma/schema.prisma

RUN npm run build

FROM node:22-alpine

RUN apk add --no-cache dumb-init

WORKDIR /app

COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/prisma.config.ts ./

COPY backend/docker-entrypoint.sh ./
RUN mkdir -p /app/uploads && \
    chown -R node:node /app && \
    chmod +x docker-entrypoint.sh

USER node

EXPOSE 3000

ENTRYPOINT ["/usr/bin/dumb-init", "--"]
CMD ["./docker-entrypoint.sh"]
