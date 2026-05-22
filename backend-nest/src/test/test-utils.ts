/* =============================================================================
   SaaS Inmobiliario — Test Utilities
   Creación de app NestJS para tests de integración con base de datos real
   ============================================================================= */

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppModule } from '../app.module';
import { PrismaService } from '../config/prisma.service';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Cargar .env.test
dotenv.config({ path: path.resolve(__dirname, '../../.env.test') });

export async function createTestApp(): Promise<{
  app: INestApplication;
  prisma: PrismaService;
  moduleRef: TestingModule;
}> {
  const moduleFixture: TestingModule = await Test.createTestingModule({
    imports: [
      ConfigModule.forRoot({
        isGlobal: true,
        envFilePath: ['.env.test', '.env'],
      }),
      AppModule,
    ],
  }).compile();

  const app = moduleFixture.createNestApplication();
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );
  await app.init();

  const prisma = app.get(PrismaService);
  return { app, prisma, moduleRef: moduleFixture };
}

/**
 * Limpia todas las tablas de la base de datos de test en orden de dependencias.
 */
export async function cleanDatabase(prisma: PrismaService): Promise<void> {
  // Orden: primero las dependientes, luego las base
  await prisma.auditLog.deleteMany();
  await prisma.fee.deleteMany();
  await prisma.maintenanceRequest.deleteMany();
  await prisma.visitor.deleteMany();
  await prisma.announcement.deleteMany();
  await prisma.occupancy.deleteMany();
  await prisma.resident.deleteMany();
  await prisma.unit.deleteMany();
  await prisma.tower.deleteMany();
  await prisma.property.deleteMany();
  await prisma.rolePermission.deleteMany();
  await prisma.user.deleteMany();
  await prisma.role.deleteMany();
  await prisma.websiteConfig.deleteMany();
  await prisma.tenant.deleteMany();
}

/**
 * Crea un tenant de test con datos mínimos.
 */
export async function createTestTenant(
  prisma: PrismaService,
  overrides: { name?: string; plan?: string; status?: string; subdomain?: string } = {},
) {
  return prisma.tenant.create({
    data: {
      name: overrides.name ?? `Test Tenant ${Date.now()}`,
      subdomain: overrides.subdomain ?? `test-tenant-${Date.now()}`,
      plan: (overrides.plan ?? 'BASIC') as any,
      status: (overrides.status ?? 'ACTIVE') as any,
    },
  });
}
