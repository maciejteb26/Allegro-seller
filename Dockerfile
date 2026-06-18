FROM node:20-slim AS builder
WORKDIR /app

COPY package.json package-lock.json ./
COPY server/package.json server/package.json
COPY client/package.json client/package.json
RUN npm ci

COPY . .
RUN npm run prisma:generate --workspace=server
RUN npm run build --workspace=server

FROM node:20-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/server/dist ./server/dist
COPY --from=builder /app/server/prisma ./server/prisma
COPY --from=builder /app/server/package.json ./server/package.json

EXPOSE 3001
CMD ["node", "server/dist/index.js"]
