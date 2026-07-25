FROM node:22-alpine AS base
WORKDIR /app

COPY package.json ./
COPY backend/package.json ./backend/package.json
COPY frontend/package.json ./frontend/package.json
COPY backend/tsconfig.json ./backend/tsconfig.json
COPY frontend/tsconfig.json ./frontend/tsconfig.json
COPY backend/src ./backend/src
COPY backend/prisma ./backend/prisma
COPY frontend/index.html ./frontend/index.html
COPY frontend/public ./frontend/public
COPY frontend/src ./frontend/src
COPY frontend/vite.config.ts ./frontend/vite.config.ts

RUN npm install

FROM base AS dev
ENV NODE_ENV=development
EXPOSE 3000
CMD ["sh", "-c", "npx prisma migrate deploy && npm --workspace backend run dev"]
