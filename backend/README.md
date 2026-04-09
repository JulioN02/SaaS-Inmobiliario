# 🏢 Backend de la Plataforma SaaS de Administración de Inmuebles

**Versión:** 1.0.0 (MVP)  
**Modelo:** SaaS B2B Multi-Tenant  
**Arquitectura:** Monolito Modular Profesional  
**Stack:** Node.js + Express | PostgreSQL | Prisma | TypeScript | OpenAPI

---

# 🧩 Requisitos

- Node.js LTS
- PostgreSQL
- NPM

---

# 📌 Descripción General

API backend especializada en la **gestión administrativa interna de propiedades residenciales**.

Diseñada para proporcionar una API robusta y segura para:

- Conjuntos residenciales
- Torres de apartamentos
- Edificios mixtos
- Casas campestres
- Pequeñas inmobiliarias
- Propietarios con múltiples inmuebles

El sistema **no es un marketplace**.  
Es una plataforma privada por cliente para administrar su operación interna con control total y aislamiento seguro de datos a través de APIs REST.

---

# 🎯 Propuesta de Valor

## 1️⃣ Core Administrativo Replicable

Un núcleo administrativo sólido, reutilizable y configurable por cliente.

## 2️⃣ Aislamiento Multi-Tenant Seguro

Cada cliente opera dentro de su propio entorno lógico mediante `client_id`.

## 3️⃣ Paneles Diferenciados por Rol

RBAC dinámico con control por:

- Rol
- Permiso
- Tenant

## 4️⃣ Preparado para Escalar a Enterprise

Migración futura a:

- Schema por tenant
- Base de datos dedicada
- Instancia backend exclusiva

---

# 🧱 Dominio del Sistema

## Jerarquía Oficial

Tenant (Cliente)
└── Propiedad
└── Torre (opcional)
└── Unidad
└── Ocupación (Residente)

### Reglas Críticas

- Una Unidad pertenece exclusivamente a una Propiedad.
- No se permite mover unidades entre propiedades.
- El historial de ocupación es obligatorio e inmutable.
- No se permite eliminación física si existe historial (soft delete obligatorio).

---

# 🚀 Funcionalidades del MVP

## 🏘 Gestión de Propiedades

- CRUD completo
- Auditoría obligatoria
- Soft delete

## 🏢 Gestión de Unidades

- Estados:
  - Disponible
  - Ocupado
  - Mantenimiento
- Historial asociado

## 👥 Gestión de Residentes

- Datos personales
- Documento identificación
- Teléfono / Email
- Historial por unidad

## 🔄 Ocupación (Entidad Obligatoria)

- Crear ocupación
- Cerrar ocupación
- Tipo:
  - Propietario
  - Arrendatario
- Historial inmutable

## 💰 Gestión de Cuotas (Administrativa)

- Cuotas periódicas o extraordinarias
- Estados:
  - Pendiente
  - Pagado
  - Parcial
- Histórico de cambios
- Sin pasarelas de pago en MVP

## 🛠 Mantenimiento

- Crear solicitud
- Cambiar estado
- Asignar responsable
- Historial completo

## 🚪 Control de Visitantes

- Registro manual
- Filtro por fechas
- Consulta por unidad

## 📢 Comunicaciones

- Anuncios
- Circulares
- Segmentación por rol

## 🔐 Seguridad

- JWT con expiración
- Hash seguro de contraseñas
- RBAC dinámico
- Validación server-side
- Middleware obligatorio de tenant

## 📊 Métricas SaaS

- Tenants activos
- Unidades totales
- Usuarios activos
- Uso por módulo

---

# 🏗 Arquitectura Técnica

## Modelo Arquitectónico

- Monolito Modular por dominio
- Backend stateless
- Multi-tenant por `client_id`
- Versionado de API obligatorio (`/api/v1/`)

---

# 📂 Estructura Backend

src/
├── app/
├── config/
├── shared/
├── middlewares/
├── modules/
│ ├── tenant/
│ ├── property/
│ ├── unit/
│ ├── resident/
│ ├── occupancy/
│ ├── fee/
│ ├── maintenance/
│ ├── visitor/
│ ├── announcement/
│ ├── user/
│ ├── role/
│ ├── audit/
│ ├── website/
│ └── metrics/
└── routes/

---

# 🔒 Middlewares Críticos

- `tenant.middleware` → Resuelve y valida tenant activo.
- `auth.middleware` → Verifica JWT.
- `rbac.middleware` → Evalúa permisos dinámicamente.
- `error.middleware` → Manejo centralizado de errores.

---

# 📡 Endpoints Principales (v1)

POST /api/v1/auth/login

GET /api/v1/properties
POST /api/v1/properties

GET /api/v1/units
POST /api/v1/units

GET /api/v1/residents
POST /api/v1/residents

POST /api/v1/occupancies
PATCH /api/v1/occupancies/:id/close

GET /api/v1/fees
POST /api/v1/fees

GET /api/v1/maintenance
POST /api/v1/maintenance

GET /api/v1/visitors
POST /api/v1/visitors

GET /api/v1/announcements
POST /api/v1/announcements

GET /api/v1/audit
GET /api/v1/metrics

Contrato formal definido en `openapi.yaml`.

---

# 🧪 Testing Obligatorio

Un módulo se considera terminado cuando cumple:

- ✔ CRUD funcional
- ✔ Validación sintáctica
- ✔ Validación semántica en Service
- ✔ Auditoría integrada
- ✔ Filtro tenant obligatorio
- ✔ RBAC aplicado
- ✔ Unit tests del Service
- ✔ Integration tests multi-tenant
- ✔ Documentación en OpenAPI

Si falta uno → no está terminado.

---

# 🛡 Reglas de Gobierno del Producto

- No se permiten forks por cliente.
- No se permiten desarrollos personalizados fuera de configuración.
- Todo debe resolverse vía base de datos y migraciones versionadas.
- El core es único y compartido.

---

# 📌 Estado del Proyecto

En desarrollo activo bajo enfoque **API-First** y arquitectura preparada para producción.

---

# 👨‍💻 Autor

Proyecto diseñado como producto SaaS escalable, mantenible y preparado para crecimiento comercial y técnico.
