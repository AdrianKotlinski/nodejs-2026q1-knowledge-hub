FROM node:24-alpine AS build

WORKDIR /app

COPY package*.json ./
COPY tsconfig*.json ./
COPY nest-cli.json ./
COPY prisma/ ./prisma/
COPY prisma.config.ts ./

RUN apk add --no-cache python3 make g++

RUN npm ci

RUN npx prisma generate

COPY src/ ./src/

RUN npm run build

FROM node:24-alpine AS production

ENV NODE_ENV=production

WORKDIR /app

COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist

COPY package*.json ./

RUN npm prune --omit=dev && npm cache clean --force

RUN apk add --no-cache curl

EXPOSE 4000

RUN addgroup -S appgroup && adduser -S appuser -G appgroup && \
    mkdir -p /app/logs && \
    chown -R appuser:appgroup /app/logs

USER appuser

CMD ["node", "dist/src/main"]
