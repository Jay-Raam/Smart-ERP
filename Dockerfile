# ==============================================================================
# Multi-Stage Production Dockerfile for SaaS-Core
# ==============================================================================

FROM node:22-alpine AS base
WORKDIR /app
RUN npm install -g pnpm

# ------------------------------------------------------------------------------
# Build Server
# ------------------------------------------------------------------------------
FROM base AS server-builder
WORKDIR /app/server
COPY server/package*.json ./
RUN npm install
COPY server/ ./
RUN npm run build

# ------------------------------------------------------------------------------
# Build Client
# ------------------------------------------------------------------------------
FROM base AS client-builder
WORKDIR /app/client
COPY client/package*.json ./
RUN npm install
COPY client/ ./
RUN npm run build

# ------------------------------------------------------------------------------
# Production Server Target
# ------------------------------------------------------------------------------
FROM node:22-alpine AS server
WORKDIR /app
ENV NODE_ENV=production
COPY server/package*.json ./
RUN npm install --omit=dev
COPY --from=server-builder /app/server/dist ./dist
EXPOSE 4000
CMD ["node", "dist/index.js"]

# ------------------------------------------------------------------------------
# Static Nginx Host for Client Target
# ------------------------------------------------------------------------------
FROM nginx:alpine AS client
COPY --from=client-builder /app/client/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
