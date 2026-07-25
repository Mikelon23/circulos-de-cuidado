FROM node:22-alpine AS base
WORKDIR /app

COPY package.json ./
COPY backend/package.json ./backend/package.json
COPY frontend/package.json ./frontend/package.json
COPY backend/tsconfig.json ./backend/tsconfig.json
COPY frontend/tsconfig.json ./frontend/tsconfig.json
COPY backend/src ./backend/src
COPY frontend/index.html ./frontend/index.html
COPY frontend/public ./frontend/public
COPY frontend/src ./frontend/src
COPY frontend/vite.config.ts ./frontend/vite.config.ts

RUN npm install

FROM base AS dev
ENV NODE_ENV=development
EXPOSE 5173
CMD ["sh", "-c", "npm --workspace frontend run dev -- --host 0.0.0.0 --port 5173"]
