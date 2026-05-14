import { Module, Global } from '@nestjs/common';
import { PrismaService } from '../../config/prisma.service';
import { AuditService } from './audit.service';

@Global()
@Module({
  providers: [PrismaService, AuditService],
  exports: [PrismaService, AuditService],
})
export class SharedModule {}
