# =============================================================================
# Backend SaaS Inmobiliario (NestJS) — Dockerfile
# Multi-stage: build → production
# =============================================================================
# Nota: Se usa ts-node en producción porque tsc v6 tiene un bug de emisión
# con Node.js 26. Al actualizar tsc a una versión estable, reemplazar por
# node dist/main.js con compilación previa.
# =============================================================================

# ── Stage 1: Install production deps + Prisma ──────────────────────────────
FROM node:20-alpine AS base

WORKDIR /app

# Install dumb-init
RUN apk add --no-cache dumb-init

# Copy dependency manifests
COPY package.json package-lock.json ./
RUN npm ci && npm cache clean --force

# Copy Prisma schema and generate client
COPY prisma ./prisma/
RUN npx prisma generate

# Copy source code
COPY tsconfig.json ./
COPY src ./src/

# Create non-root user
RUN addgroup -g 1001 -S appgroup && \
    adduser -S appuser -u 1001 -G appgroup && \
    chown -R appuser:appgroup /app

USER appuser

EXPOSE 3000

ENTRYPOINT ["dumb-init", "--"]

# Run migrations, then start with ts-node (transpile-only para velocidad)
CMD ["sh", "-c", "npx prisma migrate deploy && node -r ts-node/register/transpile-only -r tsconfig-paths/register src/main.ts"]
