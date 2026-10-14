FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
COPY packages/shared ./packages/shared
COPY apps/web ./apps/web

RUN npm install
RUN npm run --workspace=packages/shared build
RUN npm run --workspace=apps/web build

FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

COPY --from=builder /app/apps/web/public ./public
COPY --from=builder /app/apps/web/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/apps/web/package.json ./package.json

EXPOSE 3000

CMD ["node_modules/.bin/next", "start", "-p", "3000"]
