import {
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { Roles } from 'src/common/decorators/role';
import { AuthGuard } from 'src/common/guards/jwt-auth.guard';
import { RoleGuard } from 'src/common/guards/role.guard';
import { QueryAdminActionLogDto } from './dto/query-admin-action-log.dto';
import { AdminActionLogService } from './admin-action-log.service';

@ApiTags('Admin Logs')
@ApiBearerAuth()
@Controller('admin-logs')
@UseGuards(AuthGuard, RoleGuard)
@Roles(UserRole.SUPERADMIN)
export class AdminActionLogController {
  constructor(private readonly adminActionLogService: AdminActionLogService) {}

  @Get()
  @ApiOperation({ summary: 'Get admin action logs' })
  findAll(@Query() query: QueryAdminActionLogDto) {
    return this.adminActionLogService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get admin action log detail' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.adminActionLogService.findOne(id);
  }

  @Delete(':id')
  @Roles(UserRole.SUPERADMIN)
  @ApiOperation({ summary: 'Soft delete admin action log' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.adminActionLogService.remove(id);
  }
}
