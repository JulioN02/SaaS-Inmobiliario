# API Reference - Real Estate SaaS (Compact)

## Introducción
- **Versión**: 1.0.0
- **Modelo**: SaaS multi-tenant con jerarquía: Tenant → Property → Tower? → Unit → Occupancy ← Resident
- **Seguridad**: JWT Bearer (excepto login), RBAC dinámico, `client_id` del JWT
- **Roles**: SUPER_ADMIN (plataforma), ADMIN_TENANT (tenant), ADMINISTRATIVA (residentes/cuotas), PORTERIA (visitantes)
- **Servidores**: Local `/api/v1`, Production `https://api.tudominio.com/api/v1`

## Endpoints por Módulo

### Auth
- **POST /auth/login**: Autenticar usuario → JWT con sub (user_id), client_id, role, plan, permissions[]

### Tenants (SUPER_ADMIN)
- **GET /tenants**: Listar tenants (paginated)
- **POST /tenants**: Crear tenant + usuario ADMIN_TENANT inicial
- **GET /tenants/{id}**: Obtener tenant
- **PATCH /tenants/{id}**: Actualizar tenant
- **PATCH /tenants/{id}/suspend**: Suspender tenant
- **PATCH /tenants/{id}/activate**: Reactivar tenant
- **PATCH /tenants/{id}/plan**: Cambiar plan

### Users
- **GET /users**: Listar usuarios del tenant
- **POST /users**: Crear usuario interno
- **GET /users/{id}**: Obtener usuario
- **PATCH /users/{id}**: Actualizar usuario
- **PATCH /users/{id}/suspend**: Suspender usuario
- **PATCH /users/{id}/activate**: Reactivar usuario

### Roles
- **GET /roles**: Listar roles y permisos (seed)

### Properties
- **GET /properties**: Listar propiedades
- **POST /properties**: Crear propiedad
- **GET /properties/{id}**: Obtener propiedad
- **PATCH /properties/{id}**: Actualizar propiedad
- **DELETE /properties/{id}**: Soft delete propiedad
- **GET /properties/{propertyId}/towers**: Listar torres
- **POST /properties/{propertyId}/towers**: Crear torre
- **PATCH /properties/{propertyId}/towers/{id}**: Actualizar torre
- **DELETE /properties/{propertyId}/towers/{id}**: Soft delete torre

### Units
- **GET /units**: Listar unidades (filtros: propertyId, towerId, status)
- **POST /units**: Crear unidad
- **GET /units/{id}**: Obtener unidad
- **PATCH /units/{id}**: Actualizar unidad
- **DELETE /units/{id}**: Soft delete unidad

### Residents
- **GET /residents**: Listar residentes (búsqueda por nombre/documento)
- **POST /residents**: Crear residente
- **GET /residents/{id}**: Obtener residente
- **PATCH /residents/{id}**: Actualizar residente
- **DELETE /residents/{id}**: Soft delete residente

### Occupancies
- **GET /occupancies**: Listar ocupaciones (historial inmutable)
- **POST /occupancies**: Crear ocupación (asigna residente a unidad)
- **GET /occupancies/{id}**: Obtener ocupación
- **PATCH /occupancies/{id}/close**: Cerrar ocupación

### Fees
- **GET /fees**: Listar cuotas (filtros: unitId, status, period)
- **POST /fees**: Registrar cuota (estado PENDING)
- **GET /fees/{id}**: Obtener cuota + historial
- **PATCH /fees/{id}/status**: Cambiar estado (PENDING→PAID/PARTIAL, PARTIAL→PAID)

### Maintenance
- **GET /maintenance**: Listar solicitudes
- **POST /maintenance**: Crear solicitud
- **GET /maintenance/{id}**: Obtener solicitud
- **PATCH /maintenance/{id}**: Actualizar solicitud

### Visitors
- **GET /visitors**: Listar visitantes (filtros: unitId, fechas)
- **POST /visitors**: Registrar entrada
- **PATCH /visitors/{id}/checkout**: Registrar salida

### Announcements
- **GET /announcements**: Listar anuncios (filtrado por rol)
- **POST /announcements**: Crear anuncio segmentado
- **GET /announcements/{id}**: Obtener anuncio
- **PATCH /announcements/{id}**: Actualizar anuncio
- **DELETE /announcements/{id}**: Eliminar anuncio

### Website
- **GET /website**: Obtener config sitio
- **PATCH /website**: Actualizar config (ADMIN_TENANT)

### Audit (SUPER_ADMIN/ADMIN_TENANT)
- **GET /audit**: Log inmutable (filtros: entity, action, fechas)

### Metrics (SUPER_ADMIN)
- **GET /metrics**: Métricas SaaS

## Esquemas Clave
- **Tenant**: name, subdomain, plan (BASIC/PREMIUM/ENTERPRISE), status (ACTIVE/SUSPENDED/INACTIVE)
- **User**: email, role, isActive, firstName?, lastName?
- **Property**: name, propertyType (CONJUNTO/EDIFICIO/TORRE/CASA_INDEPENDIENTE), address?, description?
- **Unit**: propertyId, towerId?, identifier, unitType (APARTMENT/HOUSE/COMMERCIAL/PARKING), status (AVAILABLE/OCCUPIED/MAINTENANCE), monthlyFeeAmount?
- **Resident**: firstName, lastName, documentType (CC/CE/PASSPORT/NIT), documentNumber, email?, phone?, emergencyContact?
- **Occupancy**: unitId, residentId, type (OWNER/TENANT), startDate, endDate?, notes?
- **Fee**: unitId, type (PERIODIC/EXTRAORDINARY/ADJUSTMENT), amount, period (YYYY-MM), status (PENDING/PAID/PARTIAL), paidAmount?, dueDate?, description?
- **ApiError**: statusCode, error, message, details?

## Ejemplos
- **Login**: `POST /auth/login` → `{"email":"admin@tenant.com","password":"pass"}` → JWT
- **Crear Propiedad**: `POST /properties` → `{"name":"El Prado","propertyType":"CONJUNTO"}`
- **Listar Unidades**: `GET /units?status=AVAILABLE`
- **Registrar Cuota**: `POST /fees` → `{"unitId":"uuid","amount":350000,"period":"2025-01"}`