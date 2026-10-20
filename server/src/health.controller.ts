import { Controller, Get } from '@nestjs/common';
import { Public } from './common/decorators/public.decorator';
import { PrismaService } from './prisma/prisma.service';

@Controller('health')
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  @Public()
  @Get()
  async health() {
    let database = 'ok';
    try {
      await this.prisma.$queryRaw`SELECT 1`;
    } catch (e) {
      database = 'error';
    }
    return { status: database === 'ok' ? 'ok' : 'degraded', database, time: new Date().toISOString() };
  }
}
