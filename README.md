<div align="center">
  <h1>SaaS Inmobiliario</h1>
  <p>
    <strong>SaaS B2B para gestión administrativa interna de propiedades residenciales</strong>
  </p>
  <p>
    Panel administrativo multi-tenant con website institucional por cliente.
  </p>
  <p>
    <a href="#-demo">Demo</a> •
    <a href="#-stack">Stack</a> •
    <a href="#-arquitectura">Arquitectura</a> •
    <a href="#-ejecutar-local">Ejecutar</a> •
    <a href="#-credenciales">Credenciales</a> •
    <a href="#-deploy">Deploy</a>
  </p>
</div>

---

## 📋 Demo (GitHub Pages)

> ⚠️ **Importante:** GitHub Pages solo aloja el frontend (SPA estática).  
> La API backend debe ejecutarse localmente o desplegarse por separado para que el sistema funcione completo.

**Frontend:** [`https://julion02.github.io/SaaS-Inmobiliario/`](https://julion02.github.io/SaaS-Inmobiliario/)

Para probar el sistema completo, sigue las instrucciones de [ejecución local](#-ejecutar-local).

---

## 🛠 Stack

| Capa | Tecnología |
|------|-----------|
| **Backend** | NestJS 10 (Express) + TypeScript |
| **Frontend** | React 19 + Vite + TypeScript |
| **Base de datos** | PostgreSQL 16 |
| **ORM** | Prisma 5 |
| **Autenticación** | JWT (stateless) |
| **Documentación API** | Swagger / OpenAPI |
| **Testing** | Jest (backend) |
| **Infraestructura** | Docker, GitHub Actions |

---

## 🏗 Arquitectura

**Patrón: Monolito Modular por Dominio**

```
SaaS-Inmobiliario/
├── backend-nest/          # API REST NestJS
│   ├── src/
│   │   ├── common/        # Guards, decorators
│   │   ├── config/        # PrismaService
│   │   ├── shared/        # AuditService, constantes
│   │   └── modules/       # Módulos por dominio
│   │       ├── tenant/
│   │       ├── user/
│   │       ├── role/      # RBAC dinámico
│   │       ├── auth/      # Login JWT
│   │       ├── property/
│   │       ├── tower/
│   │       ├── unit/
│   │       ├── resident/
│   │       ├── occupancy/
│   │       ├── fee/
│   │       ├── maintenance/
│   │       ├── visitor/
│   │       ├── announcement/
│   │       ├── website/   # CMS por tenant
│   │       ├── audit/     # Log inmutable
│   │       └── metrics/
│   ├── prisma/
│   │   ├── schema.prisma
│   │   ├── seed.ts
│   │   └── migrations/
│   └── package.json
│
├── frontend/              # SPA React
│   ├── src/
│   │   ├── components/
│   │   ├── pages/         # Dashboard, Fee, Maintenance...
│   │   ├── services/      # API client (axios)
│   │   ├── stores/        # Zustand stores
│   │   └── types/
│   └── package.json
│
├── docker-compose.yml     # PostgreSQL + pgAdmin
└── README.md
```

**Multi-tenancy:** Base de datos compartida con aislamiento por `tenant_id` (extraído del JWT, nunca del frontend).

---

## 🚀 Ejecutar Local

### Prerrequisitos

- Node.js 20+
- Docker (para PostgreSQL)
- npm

### 1. Base de datos

```bash
docker compose up -d
# PostgreSQL en localhost:5435
# Usuario: saas_admin / Contraseña: saas_dev_password_2026
# Base de datos: saas_inmobiliario
```

### 2. Backend

```bash
cd backend-nest

# Variables de entorno (ya existe .env por defecto con DATABASE_URL)
npm install

# Aplicar migraciones y sembrar datos de prueba
npx prisma db push
npx prisma db seed

# Iniciar en desarrollo
npm run start:dev

# O en producción (usando ts-node, compatible con Node 26)
npm run start:prod
```

El backend arranca en **http://localhost:3000**  
Swagger UI: **http://localhost:3000/docs**

### 3. Frontend

```bash
cd frontend

# Variables de entorno (opcional — por defecto apunta a localhost:3000)
cp .env.example .env

npm install
npm run dev
```

El frontend arranca en **http://localhost:5173**

### 4. Tests

```bash
cd backend-nest
npm test                # Todos los tests (167 tests)
npm run test:cov        # Con cobertura
```

---

## 🔐 Credenciales de Acceso

### Super Admin (Acceso completo)

| Campo | Valor |
|-------|-------|
| **URL** | `http://localhost:5173` |
| **Email** | `admin@platform.com` |
| **Contraseña** | `Admin_Pass_2026!` |
| **Rol** | SUPER_ADMIN |
| **Header requerido** | `x-tenant-id: platform` (en login) |

### Usuarios de prueba (AdminTenant del tenant demo)

| Email | Contraseña | Rol |
|-------|-----------|-----|
| `carlos.mendoza@email.com` | `Admin_Pass_2026!` | ADMIN_TENANT |
| `maria.gonzalez@email.com` | `Admin_Pass_2026!` | ADMIN_TENANT |
| `andres.lopez@email.com` | `Admin_Pass_2026!` | ADMIN_TENANT |

### Endpoints principales

| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | `/auth/login` | Inicio de sesión (requiere header `x-tenant-id`) |
| GET | `/metrics` | Dashboard con métricas del tenant |
| GET | `/fees` | Cuotas (filtro por periodo, estado, unidad) |
| GET | `/maintenance` | Solicitudes de mantenimiento |
| GET | `/visitors` | Registro de visitantes |
| GET | `/occupancies` | Ocupaciones (historial residente-unidad) |
| GET | `/audit` | Log de auditoría |
| GET | `/public/:subdomain/website` | Website público del tenant |
| GET | `/public/:subdomain/units` | Unidades publicadas del tenant |

---

## 🌐 Deploy a GitHub Pages

El frontend puede desplegarse a GitHub Pages automáticamente.

### Requisitos

1. En el repositorio de GitHub, ir a **Settings → Pages**
2. En "Build and deployment", seleccionar **"GitHub Actions"**
3. El workflow `.github/workflows/deploy-pages.yml` se activa automáticamente al pushear a `main`

### API URL en producción

Para que el frontend desplegado se conecte a un backend, configura el secret en el repositorio:

1. **Settings → Secrets and variables → Actions**
2. Crear secret: `VITE_API_URL` con valor `https://url-de-tu-backend`

Si no se configura, el frontend apuntará a `http://localhost:3000` (solo funciona localmente).

---

## 📊 Estado del Proyecto

- **Backend:** 20 módulos funcionales, 167 tests unitarios
- **Frontend:** 16 rutas con Error Boundaries, dashboard con métricas reales
- **Auth:** JWT + RBAC dinámico por permisos
- **Multi-tenancy:** Aislamiento por tenant_id vía JWT
- **API Documentada:** Swagger en `/docs`

### Módulos implementados

- [x] Tenant (CRUD, suspensión, planes)
- [x] Usuarios y Roles (RBAC dinámico)
- [x] Propiedades, Torres, Unidades
- [x] Residentes y Ocupaciones (con historial)
- [x] Cuotas (registro manual, estados, historial)
- [x] Mantenimiento (solicitudes, estados, transiciones)
- [x] Visitantes (registro, checkout)
- [x] Anuncios (segmentados por rol)
- [x] Website (CMS básico por tenant)
- [x] Auditoría (log inmutable)
- [x] Métricas / Dashboard
- [x] Endpoints públicos (website, unidades publicadas)

---

## 📄 Licencia

Proyecto privado — JSoft Solutions.
