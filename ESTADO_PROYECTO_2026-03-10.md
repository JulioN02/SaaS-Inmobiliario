# Estado del Proyecto SaaS Inmobiliario (2026-03-10)

## 1. Resumen ejecutivo

Estado actual: **backend MVP validado manualmente**, **frontend no iniciado en este repositorio**.

- La base de datos y el dominio principal están modelados de forma completa en Prisma.
- La API v1 está estructurada por módulos y protegida por middlewares de auth, tenant y RBAC.
- Hay contrato OpenAPI modular y artefacto compilado en `backend/dist/openapi.yaml`.
- Existen pruebas de integración para módulos core, dominio y operativos.
- Se ejecutaron pruebas manuales E2E con Postman y todas pasaron (segun ejecucion del 2026-03-10).

Conclusión: el proyecto está en una fase de **MVP backend validado manualmente**, pendiente de automatizacion CI y pendiente de construir frontend (panel/website) en este repo.

---

## 2. Alcance implementado

### 2.1 Arquitectura y base técnica

Implementado:

- Backend Node.js + Express + TypeScript + Prisma.
- Arquitectura monolito modular por dominio.
- API versionada en `/api/v1`.
- OpenAPI 3.0.3 modularizado por paths/components.
- Middlewares críticos:
  - `tenant.middleware`
  - `auth.middleware`
  - `rbac.middleware`
  - `error.middleware`

Evidencia:

- `backend/src/routes/v1.routes.ts`
- `backend/src/app/app.ts`
- `backend/src/docs/openapi/openapi.yaml`

### 2.2 Modelo de datos (Prisma)

Implementado:

- Núcleo SaaS: `Tenant`, `User`, `Role`, `Permission`, `RolePermission`.
- Dominio inmobiliario: `Property`, `Tower`, `Unit`, `Resident`, `Occupancy`.
- Operación: `Fee`, `FeeStatusHistory`, `MaintenanceRequest`, `Visitor`, `Announcement`, `WebsiteConfig`.
- Auditoría: `AuditLog`.
- Enums de negocio y seguridad (roles, estados, tipos de entidad, acciones de auditoría, etc.).

Evidencia:

- `backend/prisma/schema.prisma`

### 2.3 Módulos API implementados

Implementados con rutas + controller + service + repository:

- Core SaaS:
  - `auth`
  - `tenant`
  - `user`
  - `role`
  - `audit`
  - `metrics`
- Dominio:
  - `property`
  - `tower`
  - `unit`
  - `resident`
  - `occupancy`
- Operativo:
  - `fee`
  - `maintenance`
  - `visitor`
  - `announcement`
  - `website`

Evidencia:

- `backend/src/modules/*`
- `backend/src/routes/v1.routes.ts`

---

## 3. Features funcionales detectadas

## 3.1 Seguridad y multi-tenant

- JWT con `sub`, `client_id`, `role`.
- Resolución de tenant por JWT o subdominio (login).
- Bloqueo cuando no se puede resolver tenant.
- Validación de estado de tenant activo.
- RBAC dinámico por recurso/acción (tabla de permisos).

## 3.2 Reglas de negocio relevantes ya codificadas

- Límites por plan para propiedades (BASIC/PREMIUM/ENTERPRISE).
- Límites por plan para usuarios activos.
- Onboarding de tenant con creación de usuario administrador.
- En ocupación:
  - 1 ocupación activa por unidad.
  - apertura/cierre atómico de ocupación y cambio de estado de unidad.
- En cuotas:
  - estados `PENDING/PARTIAL/PAID`.
  - transición con historial obligatorio.
  - cierre automático a `PAID` al cubrir monto total.
- Soft delete en entidades clave (tenant/property/unit/resident/user/announcement).

## 3.3 Observabilidad funcional

- Auditoría integrada en varios módulos de negocio.
- Métricas globales SaaS (`tenantsActive`, `totalUnits`, etc.).

---

## 4. Testing y calidad actual

## 4.1 Pruebas existentes

Hay pruebas de integración para:

- Infraestructura (`health`, rutas protegidas, contrato auth).
- Core SaaS.
- Dominio inmobiliario.
- Operación (maintenance/visitor/announcement/website).
- Fees.
- Metrics.

Evidencia:

- `backend/src/tests/integration/*.test.ts`

## 4.2 Resultado de ejecucion manual (Postman)

Se ejecuto la coleccion Postman `backend/postman/SaaS-Inmobiliario-E2E.postman_collection.json`
con el environment `backend/postman/SaaS-Inmobiliario.local.postman_environment.json`.

Resultado:

- **Todos los runs pasaron** siguiendo la guia.
- Validacion E2E manual completa de flujos core, dominio y operativos.

---

## 5. Estado por capas (qué tan avanzado está)

## 5.1 Backend

Estado: **avanzado (MVP tecnico completo en estructura y modulos)**.

Listo o muy avanzado:

- Modelado de datos.
- API modular.
- Seguridad base (auth + tenant + RBAC).
- Reglas de negocio críticas en services.
- Contrato OpenAPI.
- Testing de integración definido.

Pendiente para cerrar “MVP productivo”:

- Automatizar validaciones en CI con `newman` + Postgres test.
- Ejecutar y estabilizar `npm test` con DB real de pruebas.
- Validar consistencia total entre AGENTS/README/OpenAPI y comportamiento real.
- Completar vacios menores (ej. `enterprise: 0` en metricas por plan).
- Robustecer hardening operativo (CI, despliegue, monitoreo, migraciones automatizadas).

## 5.2 Frontend

Estado: **no iniciado en este repositorio**.

- Carpeta `frontend/` existe pero está vacía.
- No se observan SPA administrativa ni website Vite implementados aquí.

---

## 6. Riesgos tecnicos actuales

- Sin base de datos de prueba activa no hay validacion automatica confiable.
- La validacion E2E esta confirmada solo de forma manual (Postman).
- No hay historial de commits aún (rama `main` sin commits), lo que dificulta trazabilidad de cambios.
- Existe una diferencia entre documentación aspiracional y estado real en algunas partes (normal en fase MVP), por lo que conviene una revisión de contrato final antes de exponer a clientes.

---

## 7. Punto exacto de la aplicacion hoy

La aplicacion esta en **fase “Backend MVP validado manualmente”**:

- **No está en fase prototipo inicial**, porque ya tiene dominio, reglas, seguridad, rutas, contrato y tests.
- **Tampoco está en fase de release productivo**, porque falta cerrar validación de integración con infraestructura estable y falta frontend en este repo.

Lectura práctica:

- Con CI + `newman` + `npm test`, pasas a validacion automatica real.
- Para producto usable por cliente final, el siguiente bloque critico es **frontend + integracion end-to-end + hardening de despliegue**.

---

## 8. Siguiente hito recomendado (prioridad)

1. Integrar CI con `newman` y Postgres para validacion automatica.
2. Ejecutar y estabilizar `npm test` con DB real de pruebas.
3. Congelar contrato OpenAPI v1 final y generar checklist de cumplimiento por modulo.
4. Iniciar frontend (panel admin) consumiendo endpoints ya consolidados.
5. Preparar plan de arquitectura frontend con base en flujos ya validados.

---

## 9. Insumos listos para frontend

- Coleccion y environment Postman para contratos reales de backend.
- Flujos E2E ya probados: auth, tenants, properties, units, residents, occupancies, fees, maintenance, visitors, announcements, website, audit.
- Esto permite iniciar la definicion de pantallas y journeys sin incertidumbre de API.

---

## 10. Requisitos de frontend (basado en flujos validados)

- Autenticacion por subdominio: el login requiere `Host` con subdominio del tenant.
- Gestion de sesion con JWT: guardar `accessToken` y adjuntar `Authorization: Bearer` en cada request.
- Manejo de roles y permisos (RBAC): la UI debe ocultar o bloquear acciones sin permiso.
- Seleccion de tenant no expuesta en UI: el `tenantId` nunca se envia en el body, viene del token.
- Manejo de estados y transiciones: unidades, ocupaciones, cuotas y mantenimiento deben reflejar estados reales.
- Flujos base para pantallas:
  - Login tenant.
  - Dashboard basico (metricas locales o resumen).
  - CRUD: properties, units, residents.
  - Ocupaciones: abrir/cerrar.
  - Cuotas: crear y cambiar estado.
  - Mantenimiento: crear y actualizar.
  - Visitantes: registro y checkout.
  - Anuncios: listar/crear/editar.
  - Website config: editar branding.
  - Auditoria: listado por filtros (solo ADMIN_TENANT).
