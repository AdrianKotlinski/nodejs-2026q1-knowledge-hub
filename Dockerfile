FROM node:24-alpine AS build

WORKDIR /app

COPY package*.json ./
COPY tsconfig*.json ./
COPY nest-cli.json ./
COPY prisma/ ./prisma/
COPY prisma.config.ts ./

RUN npm ci

RUN npx prisma generate

COPY src/ ./src/

RUN npm run build

FROM node:24-alpine AS production

ENV NODE_ENV=production

WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force

COPY --from=build /app/dist ./dist

RUN apk add --no-cache curl

EXPOSE 4000

RUN addgroup -S appgroup && adduser -S appuser -G appgroup
USER appuser

CMD ["node", "dist/src/main"]
