import { Controller, Get, Param, NotFoundException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { PrismaService } from '../../config/prisma.service';
import { WebsiteResponseDto } from '../website/dto';
import { PublicPropertyDto } from './dto';

@ApiTags('Public')
@Controller('public')
export class PublicController {
  constructor(private prisma: PrismaService) {}

  @Get(':subdomain/website')
  @ApiOperation({ summary: 'Obtener configuración pública del website de un tenant' })
  @ApiParam({ name: 'subdomain', description: 'Subdominio del tenant' })
  @ApiResponse({
    status: 200,
    description: 'Configuración del sitio web',
    type: WebsiteResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Tenant no encontrado' })
  async getWebsiteConfig(
    @Param('subdomain') subdomain: string,
  ): Promise<WebsiteResponseDto> {
    const tenant = await this.prisma.tenant.findUnique({
      where: { subdomain, deletedAt: null },
      select: { id: true, name: true, status: true },
    });

    if (!tenant) {
      throw new NotFoundException('Tenant no encontrado');
    }

    let config = await this.prisma.websiteConfig.findUnique({
      where: { tenantId: tenant.id },
    });

    if (!config) {
      config = await this.prisma.websiteConfig.create({
        data: { tenantId: tenant.id },
      });
    }

    // Check maintenance mode
    if (config.isMaintenanceMode) {
      return {
        id: config.id,
        tenantId: config.tenantId,
        logoUrl: config.logoUrl ?? undefined,
        primaryColor: config.primaryColor,
        secondaryColor: config.secondaryColor,
        backgroundColor: config.backgroundColor,
        siteTitle: config.siteTitle,
        welcomeMessage: '🚧 Sitio en mantenimiento. Pronto estaremos de vuelta.',
        contactEmail: config.contactEmail ?? undefined,
        contactPhone: config.contactPhone ?? undefined,
        address: config.address ?? undefined,
        metaTitle: config.metaTitle ?? undefined,
        metaDescription: config.metaDescription ?? undefined,
        isMaintenanceMode: config.isMaintenanceMode,
        isPublic: config.isPublic,
        createdAt: config.createdAt,
        updatedAt: config.updatedAt,
      };
    }

    return {
      id: config.id,
      tenantId: config.tenantId,
      logoUrl: config.logoUrl ?? undefined,
      primaryColor: config.primaryColor,
      secondaryColor: config.secondaryColor,
      backgroundColor: config.backgroundColor,
      siteTitle: config.siteTitle || tenant.name,
      welcomeMessage: config.welcomeMessage ?? undefined,
      contactEmail: config.contactEmail ?? undefined,
      contactPhone: config.contactPhone ?? undefined,
      address: config.address ?? undefined,
      metaTitle: config.metaTitle ?? undefined,
      metaDescription: config.metaDescription ?? undefined,
      isMaintenanceMode: config.isMaintenanceMode,
      isPublic: config.isPublic,
      createdAt: config.createdAt,
      updatedAt: config.updatedAt,
    };
  }

  @Get(':subdomain/properties')
  @ApiOperation({ summary: 'Obtener propiedades públicas de un tenant' })
  @ApiParam({ name: 'subdomain', description: 'Subdominio del tenant' })
  @ApiResponse({
    status: 200,
    description: 'Lista de propiedades',
    type: [PublicPropertyDto],
  })
  @ApiResponse({ status: 404, description: 'Tenant no encontrado' })
  async getProperties(
    @Param('subdomain') subdomain: string,
  ): Promise<PublicPropertyDto[]> {
    const tenant = await this.prisma.tenant.findUnique({
      where: { subdomain, deletedAt: null },
      select: { id: true },
    });

    if (!tenant) {
      throw new NotFoundException('Tenant no encontrado');
    }

    const properties = await this.prisma.property.findMany({
      where: { tenantId: tenant.id, deletedAt: null },
      orderBy: { name: 'asc' },
    });

    // Get unit count for each property
    const result: PublicPropertyDto[] = [];
    for (const property of properties) {
      const unitCount = await this.prisma.unit.count({
        where: { propertyId: property.id, deletedAt: null },
      });

      result.push({
        id: property.id,
        name: property.name,
        address: property.address ?? undefined,
        propertyType: property.propertyType,
        description: property.description ?? undefined,
        unitCount,
      });
    }

    return result;
  }
}
