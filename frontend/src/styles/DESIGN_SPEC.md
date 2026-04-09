# SaaS Inmobiliario — Especificación de Diseño Frontend
**Fecha:** 2026-04-09

---

## 1. Estilo Visual

**Dirección:** Corporativo/formal con intención minimalista.
**Principio:** Simplicidad para uso, no para estilo. Que sea familiar y natural para cualquier usuario, profesional pero no sobrecargado.

**Tono de diseño:**
- Líneas limpias, sin adornos innecesarios
- Tipografía clara, pesos semibold para títulos, normal para cuerpo
- Bordes sutiles, sombras mínimas (solo en cards importantes)
- Colores azul corporativo (#2563EB) como primario
- Grises para todo lo secundario (fondos, bordes, texto muted)

---

## 2. Paleta de Colores

**Primario:** Azul corporativo (#2563EB)
- Variaciones: 50 (#EFF6FF) → 900 (#1E3A8A)
- Uso: Botones primarios, links activos, sidebar activo

**Secundario:** Verde (#22C55E)
- Uso: Estados positivos, éxito

**Semánticos:**
- Error: #EF4444 (rojo)
- Warning: #F59E0B (amarillo)
- Info: #3B82F6 (azul)

**Neutros:** Grises 50-900
- Background: #F8FAFC
- Surface: #FFFFFF
- Border: #E2E8F0
- Text primary: #0F172A
- Text secondary: #475569
- Text muted: #94A3B8

---

## 3. Densidad de Información

### Por rol:

**Media-alta (SuperAdmin, AdminTenant, Administrativa):**
- Tablas densas con columnas relevantes
- Espaciado moderado entre filas
- Múltiples datos visibles simultáneamente
- Eficiencia sobre estética visual

**Baja (Portería):**
- Texto grande, fácil lectura
- Tablas simples, pocas columnas
- Botones grandes para acciones frecuentes
- Priorizar velocidad de uso en tareas repetitivas

---

## 4. Layout Principal

### Estructura:
```
┌─────────────────────────────────────────────────────────────┐
│  [≡] <Nombre Tenant>                      [🔔] [Usuario ▾] │  ← Header
├──────────┬──────────────────────────────────────────────────┤
│          │                                                  │
│  Sidebar │              Contenido Principal                 │
│          │                                                  │
│          │  < Breadcrumb / Título página >                  │
│          │                                                  │
│          │  ┌──────────────────────────────────────────┐   │
│          │  │  Filtros / Búsqueda                      │   │
│          │  ├──────────────────────────────────────────┤   │
│          │  │  Tabla de datos / Cards                  │   │
│          │  │                                           │   │
│          │  │  [✓] ID │ Nombre │ Estado │ Acciones    │   │
│          │  │                                           │   │
│          │  ├──────────────────────────────────────────┤   │
│          │  │  Paginación                              │   │
│          │  └──────────────────────────────────────────┘   │
│          │                                                  │
├──────────┴──────────────────────────────────────────────────┤
│                    [Logo SaaS] ®                            │  ← Footer mínimo
└─────────────────────────────────────────────────────────────┘
```

### Header:
- Izquierda: botón hamburger (si sidebar colapsada) + nombre del tenant
- Derecha: campana de notificaciones + dropdown de usuario (nombre + rol, logout)

### Sidebar:
- Izquierda fija
- Navegación por módulos (icono + texto, colapsable a solo icono)
- Abajo: logo del SaaS como marca de agua sutil
- No mostrar nombre del tenant (va en header)

### Footer:
- Mínimo. Solo logo/nombre del SaaS, sutil, no invasivo.

---

## 5. Navegación por Rol

### AdminTenant (máxima):
- Dashboard
- Propiedades
- Unidades
- Residentes
- Ocupaciones
- Cuotas
- Mantenimiento
- Visitantes
- Anuncios
- Website Config
- Auditoría
- Usuarios
- Roles

### Administrativa:
- Dashboard
- Propiedades (solo lectura)
- Unidades (lectura + cambio de estado)
- Residentes (CRUD)
- Ocupaciones (CRUD)
- Cuotas (CRUD)
- Mantenimiento (CRUD)
- Visitantes (lectura)
- Anuncios (CRUD)
- Website Config (solo lectura)

### Portería:
- Dashboard
- Visitantes (solo este módulo grande y fácil)
- Anuncios (lectura)
- Unidades (solo lectura de identificador/estado)

### SuperAdmin:
- Dashboard global
- Tenants (CRUD + suspensión + activación)
- Métricas de plataforma
- Auditoría global

---

## 6. Tablas

### Características:
- Encabezado gris oscuro (#1E293B), texto blanco
- Filas con bordes sutiles, hover con fondo gris claro
- Columnas relevantes según densidad del rol
- Acciones inline: botones de editar/eliminar por fila (solo iconos)
- Checkboxes para selección múltiple
- Botón de acciones bulk arriba de la tabla cuando hay selección
- Filtros arriba: búsqueda + selects de estado + filtro por fecha
- Paginación abajo: anterior/siguiente, indicador de página

### Densidad media-alta:
```
┌─────────────────────────────────────────────────────────────────────┐
│  [🔍 Buscar...]    [Estado ▾]    [Tipo ▾]    [+ Nueva] [Eliminar  ]│
├────┬────┬──────────┬──────────┬──────────┬──────────┬──────────────┤
│ ✓  │ #  │ Nombre   │ Tipo     │ Dirección│ Estado   │  Acciones    │
├────┼────┼──────────┼──────────┼──────────┼──────────┼──────────────┤
│ □  │ 01 │ Torre A  │ EDIFICIO │ Cr 15... │ ACTIVA   │  ✏️  🗑️       │
│ □  │ 02 │ Casa 1   │ CASA     │ Km 5     │ ACTIVA   │  ✏️  🗑️       │
└────┴────┴──────────┴──────────┴──────────┴──────────┴──────────────┘
              ◀ 1 2 3 4 5 ▶                    Mostrando 1-10 de 23
```

### Densidad baja (Portería):
```
┌──────────────────────────────────────────────────────────────┐
│  [🔍 Buscar visitante...]                          [+ Nuevo] │
├──────────────────┬──────────────┬──────────────┬─────────────┤
│ Nombre           │ Unidad       │ Hora entrada │ Acciones    │
├──────────────────┼──────────────┼──────────────┼─────────────┤
│ María Rodríguez  │ A-101        │ 10:30 AM     │ ✅ Salida   │
│ Pedro Gómez      │ A-202        │ 11:15 AM     │ ✅ Salida   │
└──────────────────┴──────────────┴──────────────┴─────────────┘
```

---

## 7. Formularios

### Todos en modales:
- Modal centrado, fondo semi-transparente (#000 @ 50%)
- Título + campos + botones (Guardar / Cancelar)
- Validación inline (error rojo debajo del campo)
- Campos con labels encima, no placeholders como label
- Focus automático en primer campo
- Cerrar con X o clic fuera del modal

### Ejemplo modal "Nueva Propiedad":
```
┌─────────────────────────────────────────┐
│  Nueva Propiedad              ✕         │
├─────────────────────────────────────────┤
│  Nombre                                 │
│  ┌─────────────────────────────────┐    │
│  │ Conjunto Residencial Las Palmas │    │
│  └─────────────────────────────────┘    │
│                                         │
│  Tipo de Propiedad                      │
│  ┌─────────────────────────────────┐    │
│  │ Conjunto                       ▾ │    │
│  └─────────────────────────────────┘    │
│                                         │
│  Dirección                              │
│  ┌─────────────────────────────────┐    │
│  │ Carrera 15 #80-45              │    │
│  └─────────────────────────────────┘    │
│                                         │
│  Descripción                            │
│  ┌─────────────────────────────────┐    │
│  │                                 │    │
│  │                                 │    │
│  └─────────────────────────────────┘    │
│                                         │
│           [Cancelar]  [Guardar]         │
└─────────────────────────────────────────┘
```

---

## 8. Dashboard

### Contenido (AdminTenant / Administrativa):
1. **Tarjetas de resumen** (4 cards en fila):
   - Total Propiedades
   - Total Unidades
   - Total Residentes
   - Cuotas Pendientes este mes

2. **Gráfico de cuotas** (bar chart simple):
   - Cuotas Pagadas vs Pendientes vs Parciales del mes actual
   - Cuotas próximas a vencer (1-7 días)

3. **Gráfico de unidades por estado** (pie/donut):
   - Disponible / Ocupado / Mantenimiento

4. **Últimos registros** (tabla simple):
   - Últimas 5 cuotas (unidad, monto, estado)
   - Últimos 3 mantenimientos (título, unidad, estado)
   - Últimos 3 visitantes (nombre, unidad, entrada)

### Dashboard Portería:
- Tarjetas grandes con datos simples
- Visitantes de hoy (contador)
- Visitantes pendientes de salida (contador)
- Lista grande y legible de visitantes activos

### Dashboard SuperAdmin:
- Tarjetas: Total tenants activos, Total unidades plataforma, Total usuarios
- Gráfico: Tenants por plan (BASIC/PREMIUM/ENTERPRISE)
- Últimos tenants creados
- Últimos cambios de estado de tenants

---

## 9. Responsive

### Desktop (> 1024px):
- Sidebar fija, expandida
- Tablas completas, todos los filtros visibles

### Tablet (768px - 1024px):
- Sidebar colapsada (solo iconos)
- Tablas con menos columnas
- Formularios siguen siendo modales

### Mobile (< 768px):
- Sidebar → menú hamburguesa (overlay)
- Tablas → cards verticales (nombre: valor)
- Filtros en collapse desplegable
- Modales → full screen
- Header simplificado: hamburger + tenant + usuario avatar

---

## 10. Componentes Base a Construir

| Componente | Props principales |
|------------|-------------------|
| Button | variant (primary/secondary/danger/ghost), size (sm/md/lg), loading |
| Input | label, error, placeholder, disabled |
| Select | label, options[], error |
| Checkbox | label, checked, onChange |
| Modal | title, children, onClose, size (sm/md/lg) |
| Table | columns[], data[], onRowClick, actions |
| Toast | type (success/error/info/warning), message, duration |
| Badge | type (success/warning/error/gray), text |
| Card | title, children, variant (stat/info) |
| Skeleton | width, height, variant (text/card/table) |
| Avatar | name, size |
| Dropdown | trigger, items[], placement |
