# SaaS Inmobiliario — Backend NestJS (Migración en progreso)

## Estado de la migración

### ✅ Completado (Setup Base)
- [x] Estructura de proyecto NestJS
- [x] Configuración TypeScript
- [x] Prisma (schema copiado del backend Express)
- [x] Guards: JwtAuthGuard, TenantGuard, RbacGuard
- [x] Exception Filter global
- [x] Decorators: @User(), @TenantId()
- [x] Swagger/OpenAPI configurado
- [x] Middlewares globales (helmet, cors, morgan)
- [x] ValidationPipe global

### ⏳ Pendiente (Módulos por migrar)
- [ ] Auth Module (login)
- [ ] Tenant Module
- [ ] User Module
- [ ] Role Module
- [ ] Property Module
- [ ] Tower Module
- [ ] Unit Module
- [ ] Resident Module
- [ ] Occupancy Module
- [ ] Fee Module
- [ ] Maintenance Module
- [ ] Visitor Module
- [ ] Announcement Module
- [ ] Website Module
- [ ] Audit Module
- [ ] Metrics Module

## Comandos disponibles

```bash
# Instalar dependencias
npm install

# Iniciar desarrollo
npm run start:dev

# Construir
npm run build

# Ejecutar tests
npm test

# Prisma
npm run prisma:generate
npm run prisma:migrate
npm run prisma:studio
```

## Guía de migración de Express → NestJS

### 1. Controller

**Express:**
```typescript
export const propertyController = {
  list: async (req, res, next) => { ... }
};
```

**NestJS:**
```typescript
@Controller('properties')
export class PropertyController {
  @Get()
  list(@TenantId() tenantId: string) { ... }
}
```

### 2. Service

**Express:**
```typescript
export const propertyService = {
  create: async (input, ctx) => { ... }
};
```

**NestJS:**
```typescript
@Injectable()
export class PropertyService {
  constructor(private prisma: PrismaService) {}
  
  async create(input: CreatePropertyDto, ctx: CallerCtx) { ... }
}
```

### 3. Uso de Guards

```typescript
@Controller('properties')
@UseGuards(JwtAuthGuard, TenantGuard)
export class PropertyController {
  @Get()
  @UseGuards(RbacGuard.for('properties', 'read'))
  list() { ... }
}
```

### 4. Decorators

```typescript
@Get()
list(
  @User('id') userId: string,
  @TenantId() tenantId: string,
) { ... }
```

## Diferencias clave Express vs NestJS

| Express | NestJS |
|---------|--------|
| `try/catch` en cada método | Exception Filters globales |
| `req.user!` type assertion | `@User()` decorator tipado |
| `req.tenantId!` | `@TenantId()` decorator |
| Manual wiring de middlewares | `@UseGuards()` decorator |
| OpenAPI YAML separado | Decorators `@ApiProperty()` |
| No DI | `@Injectable()` + constructor injection |
