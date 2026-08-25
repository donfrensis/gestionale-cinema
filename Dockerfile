# syntax=docker/dockerfile:1
FROM node:22-alpine AS deps
WORKDIR /app
RUN apk add --no-cache libc6-compat
COPY package.json package-lock.json ./
RUN npm ci

FROM node:22-alpine AS builder
WORKDIR /app
RUN apk add --no-cache libc6-compat
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# build-arg per le sole variabili NEXT_PUBLIC_* (finiscono inline nel bundle client)
ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_VAPID_PUBLIC_KEY
ENV NEXT_PUBLIC_VAPID_PUBLIC_KEY=$NEXT_PUBLIC_VAPID_PUBLIC_KEY
# non NEXT_PUBLIC_: serve solo perché /api/push/send inizializza web-push all'import
ARG VAPID_PRIVATE_KEY
ENV VAPID_PRIVATE_KEY=$VAPID_PRIVATE_KEY
# Prisma: il generate non contatta il DB, serve solo lo schema
ARG DATABASE_URL="mysql://build:build@127.0.0.1:3306/build"
ENV DATABASE_URL=$DATABASE_URL
ENV NEXT_TELEMETRY_DISABLED=1
RUN npx prisma generate
RUN npm run build

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production PORT=3000 HOSTNAME=0.0.0.0
RUN apk add --no-cache libc6-compat
# public DAL BUILDER, non dal contesto: next-pwa ci genera sw.js/workbox-*.js a build time
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
# cintura e bretelle: il client Prisma generato (engine musl) accanto allo standalone
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
EXPOSE 3000
CMD ["node", "server.js"]
