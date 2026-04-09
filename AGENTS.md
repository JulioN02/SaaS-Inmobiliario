# AGENTS.md — Contexto del Proyecto Backend

> Este archivo es el contrato de contexto del sistema. Cualquier agente de IA, IDE o colaborador debe leerlo completo antes de generar, modificar o revisar código. Todo lo aquí definido tiene carácter de decisión arquitectónica congelada para la v1.

---

## 1. Propósito del Sistema

SaaS B2B vertical para **gestión administrativa interna de propiedades residenciales**. No es un marketplace. Cada cliente (tenant) obtiene un entorno aislado para operar su conjunto residencial, edificio o portafolio.

Entregables por cliente:
- **Website institucional estático** — configurable desde base de datos vía API, desplegable con dominio propio.
- **Panel administrativo SPA** — protegido por autenticación, con vistas diferenciadas por rol.

Segmento objetivo: conjuntos residenciales pequeños y medianos, torres de apartamentos, edificios mixtos, casas campestres, pequeñas inmobiliarias, propietarios con múltiples inmuebles.

---

## 2. Stack Tecnológico (Congelado)

| Capa | Tecnología |
|------|-----------|
| Runtime | Node.js |
| Framework HTTP | Express |
| Lenguaje | TypeScript (fundamentos: primitivos, union types, type aliases, interfaces) |
| Base de datos | PostgreSQL |
| ORM | Prisma |
| Autenticación | JWT (stateless, sin sesiones en memoria) |
| Contrato API | OpenAPI (docs/openapi.yaml) |
| Testing | Jest + Supertest |

**Prohibido proponer tecnologías fuera de este stack sin justificación arquitectónica documentada.**

TypeScript se usa con restricción deliberada: sin POO avanzada, sin decoradores, sin patrones de diseño complejos. Solo tipos primitivos, union types, type aliases e interfaces.

---

## 3. Arquitectura General

**Patrón: Monolito Modular por Dominio**

La separación es por bounded context funcional, no por tipo técnico. El objetivo es que cada módulo pueda migrarse a microservicio sin reescritura total si el negocio lo exige.

**Multi-tenancy: shared database, aislamiento por `tenant_id`.**

El `tenant_id` nunca proviene del frontend. Siempre se extrae del JWT o se resuelve desde el subdominio en el Tenant Middleware. Esta es la regla de seguridad más crítica del sistema.

### Flujo obligatorio de cada request
```
Route → TenantMiddleware → AuthMiddleware → RBACMiddleware → Controller → Service → Repository → DB
                                                                                          ↓
                                                                                   AuditService
```

### Estructura de carpetas del backend
```
src/
├── app/
│   ├── server.ts
│   └── app.ts
├── config/
│   ├── env.ts
│   ├── database.ts
│   └── logger.ts
├── shared/
│   ├── errors/
│   ├── utils/
│   ├── constants/
│   └── types/
├── infrastructure/
│   ├── prisma/
│   └── migrations/
├── middlewares/
│   ├── auth.middleware.ts
│   ├── tenant.middleware.ts
│   ├── rbac.middleware.ts
│   └── error.middleware.ts
├── modules/
│   ├── tenant/
│   ├── subscription/
│   ├── property/
│   ├── unit/
│   ├── resident/
│   ├── occupancy/
│   ├── fee/
│   ├── maintenance/
│   ├── visitor/
│   ├── announcement/
│   ├── user/
│   ├── role/
│   ├── audit/
│   ├── website/
│   └── metrics/
├── routes/
│   └── v1.routes.ts
└── docs/
    └── openapi.yaml
```

### Estructura interna de cada módulo
```
<modulo>/
├── <modulo>.routes.ts
├── <modulo>.controller.ts
├── <modulo>.service.ts
├── <modulo>.repository.ts
├── <modulo>.validators.ts
├── <modulo>.policies.ts
├── <modulo>.dto.ts
└── __tests__/
```

---

## 4. Responsabilidades por Capa

### Routes
- Definir endpoints y aplicar middlewares.
- Conectar con el controller.
- **Prohibido:** validaciones complejas, lógica de negocio, acceso a base de datos.

### Controller
- Recibir el request HTTP, transformar DTO, invocar el service y formatear la response.
- **Prohibido:** lógica de negocio, acceso directo a Prisma.
- Target: menos de 20 líneas promedio por método.

### Service (corazón del sistema)
- Validar reglas de dominio, aplicar límites por plan, orquestar repositories, emitir eventos auditables, gestionar transacciones.
- Debe ser testeable sin Express (sin dependencia del ciclo request/response).

### Repository (Prisma encapsulado)
- Única capa que accede a Prisma.
- **Ningún repository acepta operaciones sin `tenant_id`.**
- Todas las consultas incluyen filtro por `tenant_id`.
- Prisma no se expone fuera de esta capa bajo ninguna circunstancia.

### Validators
- Validaciones sintácticas: tipos, formato email, fechas, campos requeridos.
- La validación semántica (reglas de negocio) pertenece al Service.

### Policies (RBAC dinámico)
- Cada módulo declara los permisos que requiere.
- Roles no se hardcodean en código.
- El RBAC Middleware verifica JWT, resuelve `tenant_id` y evalúa si el rol tiene el permiso requerido.

---

## 5. Modelo de Dominio

### Jerarquía inmobiliaria oficial
```
Tenant (Cliente)
 └── Propiedad
      └── Torre (opcional)
           └── Unidad
                └── Ocupación ←→ Residente
```

### Reglas de jerarquía

- Un Tenant puede tener múltiples Propiedades.
- Una Propiedad pertenece a un único Tenant.
- Una Unidad puede pertenecer directamente a una Propiedad (sin Torres) o a una Torre. Nunca a ambas.
- Una Unidad no puede moverse entre Propiedades.
- Un Residente puede asociarse a múltiples Unidades a lo largo del tiempo.
- La relación Residente–Unidad se gestiona mediante la entidad `Ocupación`: fecha inicio, fecha fin y tipo (propietario / arrendatario).
- El historial de Ocupación es obligatorio e indestructible (nunca se elimina físicamente).
- No se permite eliminación física de Propiedad, Unidad o Residente si existen registros históricos. Usar soft delete.

**Tipos de Propiedad:** Conjunto, Torre, Edificio, Casa independiente.
**Tipos de Unidad:** Apartamento, Casa, Local, Parqueadero.
**Tipos de Residente:** Propietario, Arrendatario.

---

## 6. Módulos del Sistema

### Core SaaS
| Módulo | Descripción |
|--------|-------------|
| `tenant` | CRUD de clientes, suspensión, onboarding, asignación de plan, límites operativos |
| `user` | CRUD de usuarios internos, asignación de rol, suspensión, login JWT |
| `role` | RBAC dinámico, roles base por seed, permisos por tabla |
| `audit` | Registro inmutable de acciones críticas |
| `metrics` | Métricas internas (tenants activos, unidades, usuarios) |

### Dominio Inmobiliario
| Módulo | Descripción |
|--------|-------------|
| `property` | CRUD, soft delete, auditoría |
| `unit` | CRUD, estado de unidad, soft delete |
| `resident` | Datos personales, documentos asociados |
| `occupancy` | Historial residente–unidad, inmutable |

### Dominio Operativo
| Módulo | Descripción |
|--------|-------------|
| `maintenance` | Solicitudes, estados, responsable asignado |
| `visitor` | Registro manual de visitas, historial por unidad |
| `announcement` | Anuncios segmentados por rol |
| `fee` | Registro administrativo de cuotas, sin pasarelas |
| `website` | CMS mínimo: logo, colores, textos editables |

---

## 7. Reglas de Negocio Críticas

### Multi-tenancy
- `tenant_id` nunca viene del frontend. Siempre del JWT o del subdominio resuelto por Tenant Middleware.
- Sin `tenant_id` válido → 403 inmediato.
- Tenant suspendido: login bloqueado, website opcionalmente deshabilitado.
- Ninguna query a la base de datos puede ejecutarse sin filtro por `tenant_id`.

### Cuotas (módulo `fee`)
- Las cuotas son registros administrativos, no transacciones bancarias.
- No se procesan pagos en el MVP.
- Estados permitidos: Pendiente, Pagado (registro manual), Parcial.
- Historial de cambios de estado obligatorio.
- Cada cuota pertenece a una Unidad y a un periodo definido.
- No se gestionan intereses automáticos en v1.

### Auditoría
- Registro inmutable. No se permite borrado físico de logs.
- Cada log contiene: usuario, `client_id`, entidad afectada, tipo de acción, timestamp, snapshot mínimo del cambio.
- Solo SuperAdmin y AdminTenant pueden consultar la auditoría.
- Entidades auditables: Propiedad, Unidad, Residente, Cuotas, Solicitudes de mantenimiento, Cambios de rol, Suspensión de usuarios, Cambios de configuración.

### Límites operativos por plan
| Plan | Propiedades | Unidades | Usuarios internos |
|------|-------------|----------|-------------------|
| Básico | 1 | 100 | 5 |
| Premium | Múltiples | 500 | 15 |
| Enterprise | Sin límite | Sin límite | Sin límite |

Los límites se validan en el Service y los gestiona SuperAdmin desde la base de datos.

### Onboarding de Tenant (flujo oficial)
1. SuperAdmin crea el Tenant y asigna plan.
2. Se genera configuración base: roles iniciales, permisos base, plantilla website.
3. Se crea el usuario AdminTenant y se asigna subdominio.
4. El Tenant comienza la carga inicial (propiedades, unidades, residentes).

---

## 8. Modelo de Roles y Permisos (RBAC)

**Entidades del modelo:** `Role`, `Permission`, `RolePermission`, `UserRole`.

| Rol | Alcance |
|-----|---------|
| `SuperAdmin` | Global. Crear/suspender clientes, ver métricas globales. |
| `AdminTenant` | Control total sobre su tenant. Gestión de usuarios internos. |
| `Administrativo` | Gestión de residentes, registro manual de pagos, reportes. |
| `Portero` | Solo módulo de visitantes. Lectura de anuncios. |

Los permisos se evalúan por: Rol + `tenant_id`. No se hardcodean roles en el código.

---

## 9. Seguridad

- Contraseñas siempre hasheadas con bcrypt.
- JWT con expiración definida. Stateless, sin sesiones en memoria.
- `tenant_id` extraído del JWT, nunca del body ni de query params.
- Validación de entrada obligatoria antes de llegar al Service.
- Manejo centralizado de errores en el Error Middleware.

---

## 10. API REST

**Prefijo obligatorio:** `/api/v1/`

Cambios incompatibles requieren nueva versión (`/api/v2/`). No se elimina la versión anterior hasta migración completa. El contrato formal es `docs/openapi.yaml`.

### Endpoints congelados v1
El contrato completo de la API v1 vive en `API_REFERENCE.md` y `docs/openapi/openapi.yaml`. La lista a continuación es un resumen no exhaustivo para referencia rápida.

```
POST   /auth/login

GET    /tenants
POST   /tenants
PATCH  /tenants/:id/suspend
PATCH  /tenants/:id/activate

GET    /properties
POST   /properties
PATCH  /properties/:id
DELETE /properties/:id

GET    /units
POST   /units
PATCH  /units/:id
DELETE /units/:id

GET    /residents
POST   /residents
PATCH  /residents/:id
DELETE /residents/:id

GET    /occupancies
GET    /occupancies/:id
POST   /occupancies
PATCH  /occupancies/:id/close

GET    /fees
POST   /fees
PATCH  /fees/:id/status

GET    /maintenance
POST   /maintenance
PATCH  /maintenance/:id

GET    /visitors
POST   /visitors
PATCH  /visitors/:id/checkout

GET    /announcements
POST   /announcements

GET    /audit
GET    /metrics
```

---

## 11. Base de Datos

- Motor: PostgreSQL. ORM: Prisma exclusivamente.
- Toda modificación de esquema es una migración versionada con Prisma Migrate.
- No se permiten cambios manuales en producción. Las migraciones deben ser reversibles.

**Convenciones obligatorias:**
- Todos los modelos tienen `createdAt` y `updatedAt`.
- Soft delete con `deletedAt` para entidades con historial.
- Índices en: `tenant_id`, `unit_id`, `resident_id`, `createdAt`, `updatedAt`.

**Estrategia multi-tenant:** V1 usa shared database con `tenant_id` por tabla. La arquitectura de repositorios debe permitir migración futura a schema-per-tenant o db-per-tenant sin reescritura.

---

## 12. Testing

- Herramienta única: **Jest + Supertest**.
- Services testeables sin Express.
- **Unit tests:** Service, validación de reglas de dominio.
- **Integration tests:** Endpoints con tenant aislado, validación RBAC, validación de no fuga multi-tenant.

### Definition of Done por módulo
Un módulo está terminado cuando cumple todos estos criterios:
1. CRUD funcional.
2. Validación sintáctica en Validator.
3. Validación semántica en Service.
4. Auditoría integrada.
5. Filtro `tenant_id` obligatorio en Repository.
6. RBAC aplicado en Policies.
7. Tests unitarios del Service.
8. Tests de integración multi-tenant.
9. Documentado en `openapi.yaml`.

---

## 13. Infraestructura

- Contenedores: Docker (backend + base de datos).
- CI/CD: GitHub Actions.
- Logs estructurados (no `console.log` libre).
- Backend stateless. Sin Redis en v1.
- Todo lo configurable por cliente se resuelve en base de datos. No se permiten forks del código.

---

## 14. Reglas de Oro (No Negociables)

1. Nunca exponer Prisma fuera del Repository.
2. Nunca usar `req.body` directamente en el Repository.
3. Nunca confiar en `tenant_id` enviado por el frontend.
4. Nunca permitir una query sin `tenant_id`.
5. Toda acción crítica genera log de auditoría.
6. Controllers: menos de 20 líneas promedio por método.
7. Services: testeables sin Express.
8. No hardcodear roles en el código.
9. No mezclar lógica de negocio con Express.
10. Ningún fork, ningún código por cliente. Todo por configuración.

---

## 15. Alcance MVP v1

**Incluido:** propiedades, unidades, residentes (sin login), visitantes, mantenimiento, cuotas manuales, reportes básicos, panel por roles, website institucional básico, RBAC, auditoría.

**Excluido:** pasarelas de pago, app móvil, publicaciones automáticas, integraciones externas, login del residente, recuperación de contraseña automática, MFA, constructor visual de roles, blog, multi-idioma.

---

## 16. Roadmap (Referencia)

| Fase | Objetivo |
|------|----------|
| 1 | Core administrativo MVP v1 |
| 2 | Rol residente, mejoras de reportes |
| 3 | Automatizaciones premium |
| 4 | Integraciones externas, multi-instancia enterprise |