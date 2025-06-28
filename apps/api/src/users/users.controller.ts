import {
  Controller,
  Get,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';

import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { User, UserRole, ApiResponse as ApiResponseType, PaginationParams } from '@ai-saas/shared-types';
import { UpdateUserDto } from './dto/update-user.dto';
import { InviteUserDto } from './dto/invite-user.dto';

@ApiTags('Users')
@ApiBearerAuth()
@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiResponse({ status: 200, description: 'User profile retrieved successfully' })
  async getProfile(@CurrentUser() user: User): Promise<ApiResponseType<User>> {
    return {
      success: true,
      data: user,
    };
  }

  @Get()
  @ApiOperation({ summary: 'Get users in tenant' })
  @ApiResponse({ status: 200, description: 'Users retrieved successfully' })
  async getUsers(
    @CurrentUser() user: User,
    @Query() pagination: PaginationParams,
  ): Promise<ApiResponseType<{ users: User[]; total: number }>> {
    const result = await this.usersService.findByTenant(user.tenantId, pagination);
    return {
      success: true,
      data: result,
      metadata: {
        page: pagination.page || 1,
        limit: pagination.limit || 10,
        total: result.total,
        hasNext: result.total > ((pagination.page || 1) * (pagination.limit || 10)),
        hasPrevious: (pagination.page || 1) > 1,
      },
    };
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get user statistics' })
  @ApiResponse({ status: 200, description: 'User statistics retrieved successfully' })
  @Roles(UserRole.ADMIN)
  @UseGuards(RolesGuard)
  async getUserStats(@CurrentUser() user: User): Promise<ApiResponseType<any>> {
    const stats = await this.usersService.getUserStats(user.tenantId);
    return {
      success: true,
      data: stats,
    };
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update user' })
  @ApiResponse({ status: 200, description: 'User updated successfully' })
  async updateUser(
    @Param('id') id: string,
    @CurrentUser() user: User,
    @Body() updateUserDto: UpdateUserDto,
  ): Promise<ApiResponseType<User>> {
    const updatedUser = await this.usersService.updateUser(
      id,
      user.tenantId,
      user.role,
      updateUserDto,
    );
    return {
      success: true,
      data: updatedUser,
    };
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Deactivate user' })
  @ApiResponse({ status: 200, description: 'User deactivated successfully' })
  @Roles(UserRole.ADMIN)
  @UseGuards(RolesGuard)
  async deactivateUser(
    @Param('id') id: string,
    @CurrentUser() user: User,
  ): Promise<ApiResponseType<User>> {
    const deactivatedUser = await this.usersService.deactivateUser(
      id,
      user.tenantId,
      user.role,
    );
    return {
      success: true,
      data: deactivatedUser,
    };
  }

  @Put('invite')
  @ApiOperation({ summary: 'Invite user to tenant' })
  @ApiResponse({ status: 200, description: 'User invitation sent successfully' })
  @Roles(UserRole.ADMIN)
  @UseGuards(RolesGuard)
  async inviteUser(
    @CurrentUser() user: User,
    @Body() inviteUserDto: InviteUserDto,
  ): Promise<ApiResponseType<{ message: string }>> {
    const result = await this.usersService.inviteUser(
      user.tenantId,
      inviteUserDto.email,
      inviteUserDto.role,
      user.id,
    );
    return {
      success: true,
      data: result,
    };
  }
} 