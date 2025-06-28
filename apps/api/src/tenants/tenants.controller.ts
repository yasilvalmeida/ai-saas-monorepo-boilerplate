import {
  Controller,
  Get,
  Put,
  Body,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';

import { TenantsService } from './tenants.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { User, UserRole, Tenant, ApiResponse as ApiResponseType } from '@ai-saas/shared-types';
import { UpdateTenantDto } from './dto/update-tenant.dto';
import { UpdateSettingsDto } from './dto/update-settings.dto';

@ApiTags('Tenants')
@ApiBearerAuth()
@Controller('tenants')
@UseGuards(JwtAuthGuard)
export class TenantsController {
  constructor(private readonly tenantsService: TenantsService) {}

  @Get('current')
  @ApiOperation({ summary: 'Get current tenant' })
  @ApiResponse({ status: 200, description: 'Tenant retrieved successfully' })
  async getCurrentTenant(@CurrentUser() user: User): Promise<ApiResponseType<Tenant>> {
    const tenant = await this.tenantsService.findById(user.tenantId);
    return {
      success: true,
      data: tenant!,
    };
  }

  @Get('usage')
  @ApiOperation({ summary: 'Get tenant usage statistics' })
  @ApiResponse({ status: 200, description: 'Usage statistics retrieved successfully' })
  async getTenantUsage(@CurrentUser() user: User): Promise<ApiResponseType<any>> {
    const usage = await this.tenantsService.getTenantUsage(user.tenantId);
    return {
      success: true,
      data: usage,
    };
  }

  @Put('current')
  @ApiOperation({ summary: 'Update current tenant' })
  @ApiResponse({ status: 200, description: 'Tenant updated successfully' })
  @Roles(UserRole.ADMIN)
  @UseGuards(RolesGuard)
  async updateTenant(
    @CurrentUser() user: User,
    @Body() updateTenantDto: UpdateTenantDto,
  ): Promise<ApiResponseType<Tenant>> {
    const updatedTenant = await this.tenantsService.updateTenant(
      user.tenantId,
      updateTenantDto,
    );
    return {
      success: true,
      data: updatedTenant,
    };
  }

  @Put('settings')
  @ApiOperation({ summary: 'Update tenant settings' })
  @ApiResponse({ status: 200, description: 'Settings updated successfully' })
  @Roles(UserRole.ADMIN)
  @UseGuards(RolesGuard)
  async updateSettings(
    @CurrentUser() user: User,
    @Body() updateSettingsDto: UpdateSettingsDto,
  ): Promise<ApiResponseType<Tenant>> {
    const updatedTenant = await this.tenantsService.updateSettings(
      user.tenantId,
      updateSettingsDto,
    );
    return {
      success: true,
      data: updatedTenant,
    };
  }
} 