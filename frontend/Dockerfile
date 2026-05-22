# =============================================================================
# Frontend SaaS Inmobiliario (React + Vite) — Dockerfile
# Multi-stage: build → nginx
# =============================================================================

# ── Stage 1: Build ──────────────────────────────────────────────────────────
FROM node:22-alpine AS build

# Re-declare ARG so it's available in this build stage
ARG VITE_API_URL=/api/v1

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci && npm cache clean --force

COPY . .
RUN VITE_API_URL=$VITE_API_URL npm run build

# ── Stage 2: Serve with nginx ──────────────────────────────────────────────
FROM nginx:1.27-alpine

# Copy built assets
COPY --from=build /app/dist /usr/share/nginx/html

# Copy nginx configuration
COPY nginx/default.conf /etc/nginx/conf.d/default.conf

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost:80/ || exit 1

EXPOSE 80

# Run nginx in foreground
CMD ["nginx", "-g", "daemon off;"]
