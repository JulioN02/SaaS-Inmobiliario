import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { PrismaService } from './config/prisma.service';
import { AuthModule } from './modules/auth/auth.module';
import { TenantModule } from './modules/tenant/tenant.module';
import { RoleModule } from './modules/role/role.module';
import { UserModule } from './modules/user/user.module';
import { PropertyModule } from './modules/property/property.module';
import { TowerModule } from './modules/tower/tower.module';
import { UnitModule } from './modules/unit/unit.module';
import { ResidentModule } from './modules/resident/resident.module';
import { OccupancyModule } from './modules/occupancy/occupancy.module';
import { FeeModule } from './modules/fee/fee.module';
import { VisitorModule } from './modules/visitor/visitor.module';
import { MaintenanceModule } from './modules/maintenance/maintenance.module';
import { AnnouncementModule } from './modules/announcement/announcement.module';
import { AuditModule } from './modules/audit/audit.module';
import { MetricsModule } from './modules/metrics/metrics.module';
import { WebsiteModule } from './modules/website/website.module';
import { PublicModule } from './modules/public/public.module';
import { SharedModule } from './modules/shared/shared.module';
import { ThrottlerBehindProxyGuard } from './common/guards/throttler-behind-proxy.guard';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', '.env.local'],
    }),
    ThrottlerModule.forRoot([
      { name: 'short', ttl: 60000, limit: 30 },
      { name: 'strict', ttl: 60000, limit: 5 },
    ]),
    SharedModule,
    AuthModule,
    TenantModule,
    RoleModule,
    UserModule,
    PropertyModule,
    TowerModule,
    UnitModule,
    ResidentModule,
    OccupancyModule,
    FeeModule,
    VisitorModule,
    MaintenanceModule,
    AnnouncementModule,
    AuditModule,
    MetricsModule,
    WebsiteModule,
    PublicModule,
  ],
  controllers: [],
  providers: [
    PrismaService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerBehindProxyGuard,
    },
  ],
  exports: [PrismaService],
})
export class AppModule {}
