import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { Roles } from 'src/common/decorators/role';
import { AuthGuard } from 'src/common/guards/jwt-auth.guard';
import { RoleGuard } from 'src/common/guards/role.guard';
import { RecalculateStatsDto } from './dto/recalculate-stats.dto';
import { StatsCacheService } from './stats-cache.service';

@ApiTags('Stats')
@ApiBearerAuth()
@Controller('stats')
@UseGuards(AuthGuard, RoleGuard)
@Roles(UserRole.SUPERADMIN)
export class StatsCacheController {
  constructor(private readonly statsCacheService: StatsCacheService) {}

  @Get()
  @ApiOperation({ summary: 'Get dashboard stats using cache strategy' })
  getDashboardStats() {
    return this.statsCacheService.getDashboardStats();
  }

  @Post('recalculate')
  @ApiOperation({ summary: 'Recalculate cached dashboard stats' })
  recalculate(@Body() dto: RecalculateStatsDto) {
    return this.statsCacheService.recalculateStats(dto?.key ?? 'dashboard');
  }

  @Get(':key')
  @ApiOperation({ summary: 'Get stats cache by key' })
  getByKey(@Param('key') key: string) {
    return this.statsCacheService.getByKey(key);
  }
}
