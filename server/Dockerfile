# API Contrat Manager (NestJS + Prisma + Puppeteer)
FROM node:20-bookworm-slim AS build
WORKDIR /app
ENV PUPPETEER_SKIP_DOWNLOAD=1
COPY package*.json ./
RUN npm ci --no-audit --no-fund
COPY prisma ./prisma
RUN npx prisma generate
COPY tsconfig.json nest-cli.json ./
COPY src ./src
RUN npm run build && npm prune --omit=dev

FROM node:20-bookworm-slim
WORKDIR /app
ENV NODE_ENV=production \
    PUPPETEER_SKIP_DOWNLOAD=1 \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium

# Chromium système pour la génération des PDF + polices
RUN apt-get update \
    && apt-get install -y --no-install-recommends \
       chromium fonts-liberation fonts-dejavu-core ca-certificates \
    && rm -rf /var/lib/apt/lists/*

COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY prisma ./prisma
COPY templates ./templates
COPY package.json ./

EXPOSE 3001
# Applique les migrations puis démarre l'API
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/main.js"]
