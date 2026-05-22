# =============================================================================
# Backend SaaS Inmobiliario (NestJS) — Dockerfile
# Single-stage: instala deps, genera Prisma, ejecuta con ts-node
# =============================================================================
# NOTA: Se usa ts-node en producción porque tsc v6 tiene un bug de emisión
# con Node.js 26. Al actualizar tsc a una versión estable, reemplazar por
# node dist/main.js con compilación previa.
# =============================================================================

FROM node:22-alpine AS base

WORKDIR /app

# ── System dependencies ───────────────────────────────────────────────────
RUN apk add --no-cache dumb-init wget

# ── Dependency manifests ──────────────────────────────────────────────────
COPY package.json package-lock.json ./
RUN npm ci --legacy-peer-deps && npm cache clean --force

# ── Prisma ────────────────────────────────────────────────────────────────
COPY prisma ./prisma/
RUN npx prisma generate

# ── Source code ───────────────────────────────────────────────────────────
COPY tsconfig.json ./
COPY src ./src/

# ── Non-root user ─────────────────────────────────────────────────────────
RUN addgroup -g 1001 -S appgroup && \
    adduser -S appuser -u 1001 -G appgroup && \
    chown -R appuser:appgroup /app

USER appuser

EXPOSE 3000

ENTRYPOINT ["dumb-init", "--"]

# Run migrations then start with ts-node
CMD ["sh", "-c", "npx prisma migrate deploy && node -r ts-node/register/transpile-only -r tsconfig-paths/register src/main.ts"]
