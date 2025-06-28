import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Public } from './auth/decorators/public.decorator';

@ApiTags('App')
@Controller()
export class AppController {
  @Get()
  @Public()
  @ApiOperation({ summary: 'API root endpoint' })
  getRoot() {
    return {
      message: 'AI SaaS API',
      version: '1.0.0',
      documentation: '/api/docs',
      health: '/health',
    };
  }
} 