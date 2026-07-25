FROM node:22-alpine AS base
WORKDIR /app

COPY package.json ./
COPY package-lock.json ./
COPY apps/api/package.json ./apps/api/package.json
COPY apps/web/package.json ./apps/web/package.json
COPY apps/api/src ./apps/api/src
COPY apps/web/index.html ./apps/web/index.html
COPY apps/web/src ./apps/web/src
COPY apps/web/vite.config.js ./apps/web/vite.config.js
COPY packages/shared/package.json ./packages/shared/package.json
COPY packages/shared/index.js ./packages/shared/index.js
COPY packages/shared/index.ts ./packages/shared/index.ts

RUN npm install

FROM base AS dev
ENV NODE_ENV=development
EXPOSE 3000
CMD ["sh", "-c", "npm --workspace apps/api run dev"]
