FROM node:22-alpine AS base

WORKDIR /usr/src/app

ENV NODE_ENV=production

# Install dependencies
FROM base AS deps
RUN apk add --no-cache libc6-compat

COPY package.json package-lock.json* ./
COPY prisma ./prisma
COPY prisma.config.ts ./
RUN npm install --only=production

# Build stage
FROM base AS build

WORKDIR /usr/src/app

COPY package.json package-lock.json* ./
COPY prisma ./prisma
COPY prisma.config.ts ./
RUN npm install

COPY . .

# Generate Prisma client and build NestJS
RUN npx prisma generate && npm run build

# Production runtime
FROM base AS runner

WORKDIR /usr/src/app

ENV NODE_ENV=production

COPY --from=build /usr/src/app/dist ./dist
COPY --from=build /usr/src/app/prisma ./prisma
COPY --from=build /usr/src/app/prisma.config.ts ./
COPY package.json package-lock.json* ./

RUN npm install --only=production

EXPOSE 3000

CMD ["node", "dist/src/main.js"]

