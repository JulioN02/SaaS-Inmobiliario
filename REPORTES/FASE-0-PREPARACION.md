# Reporte Fase 0 — Preparación del Backend
**Fecha:** 2026-04-09
**Estado:** ✅ COMPLETADA

---

## Archivos Creados

| # | Archivo | Propósito |
|---|---------|-----------|
| 1 | `backend/Dockerfile` | Multi-stage build (builder → production) |
| 2 | `backend/.dockerignore` | Excluir archivos innecesarios del contexto Docker |
| 3 | `docker-compose.yml` | Servicios postgres + backend con healthchecks |
| 4 | `backend/.env.example` | Variables de entorno documentadas |
| 5 | `backend/.env.docker` | Variables listas para Docker |
| 6 | `backend/prisma/seed-dev.js` | Datos de demostración (tenant, usuarios, unidades, etc.) |
| 7 | `backend/.github/workflows/ci.yml` | CI: build + tests + Docker |
| 8 | `backend/scripts/validate.sh` | Script de verificación del entorno |
| 9 | `backend/package.json` | Nuevos scripts: seed, seed:dev, db:setup |

---

## Dockerfile (Multi-Stage)

```
Stage 1 (builder):  node:20-alpine → npm ci → tsc → openapi:bundle
Stage 2 (production): node:20-alpine → npm ci --omit=dev → copiar dist/ → non-root user
CMD: prisma migrate deploy && node dist/app/server.js
```

## Docker Compose

```yaml
servicios:
  postgres:   postgres:16-alpine, puerto 5432, volumen persistente, healthcheck
  backend:    construye desde Dockerfile, depende de postgres healthy, puerto 3000
```

## Seed de Desarrollo

```
Tenant:          Conjunto Residencial Las Palmas (laspalmas)
Usuarios:        admin@laspalmas.com / porteria@laspalmas.com
Propiedades:     2 (Torre A + Casa Campestre)
Unidades:        13 (10 apartamentos + 2 parqueaderos + 1 casa)
Residentes:      5
Ocupaciones:     3 activas
Cuotas:          5 (2 pagadas, 3 pendientes)
Mantenimientos:  2
Visitantes:      3
Anuncios:        2
```

## CI Pipeline (GitHub Actions)

```
Trigger:    push a main/develop, PR a main
Jobs:
  build:    lint + tsc + openapi:bundle + openapi:lint
  test:     PostgreSQL service → migrate → seed → jest --forceExit
  docker:   verificar que Dockerfile compila
```

---

## Comandos Disponibles

| Comando | Descripción |
|---------|-------------|
| `npm run dev` | Iniciar servidor en desarrollo (hot reload) |
| `npm run build` | Compilar TypeScript a dist/ |
| `npm run seed` | Ejecutar seed base (roles, permisos, superadmin) |
| `npm run seed:dev` | Ejecutar seed de demostración |
| `npm run db:setup` | migrate + seed + seed:dev (setup completo) |
| `npm test` | Ejecutar tests de integración |
| `npm run prisma:studio` | Abrir Prisma Studio (explorador de DB) |
| `docker compose up -d` | Iniciar servicios (postgres + backend) |
| `./scripts/validate.sh` | Verificar entorno |

---

## Próximos Pasos

1. Ejecutar `docker compose up -d` en `Saas-Inmobiliario/`
2. Ejecutar `cd backend && npm run db:setup`
3. Abrir `http://localhost:3000/docs` (Swagger UI)
4. Verificar login con `admin@laspalmas.com` / `Admin_2026!`
5. **Iniciar Fase 1:** Frontend (React + Vite + CSS Modules)

---

## Observaciones

- El seed principal (`seed.js`) ya existía y estaba excelente — no fue necesario modificarlo
- El backend ya tenía configuración Jest funcional
- El docker-compose está en la raíz del repo (`Saas-Inmobiliario/`), no dentro de `backend/`
- Los workflows de CI requieren que el repo esté en GitHub para ejecutarse
