import {
  Body,
  Controller,
  Post,
  Patch,
  Param,
  ParseIntPipe,
  UseGuards,
  Get,
  Query,
  Delete,
} from '@nestjs/common';
import { InstallmentPlanService } from './installment-plan.service';
import { CreateInstallmentPlanDto } from './dto/create-installment-plan.dto';
import { UpdateInstallmentPlanDto } from './dto/update-installment-plan.dto';

import { UserRole } from '@prisma/client';
import { AuthGuard } from 'src/common/guards/jwt-auth.guard';
import { RoleGuard } from 'src/common/guards/role.guard';
import { Roles } from 'src/common/decorators/role';
import { ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { FilterInstallmentPlanDto } from './dto/querys.dto';

@ApiBearerAuth()
@Controller('installment-plans')
export class InstallmentPlanController {
  constructor(
    private readonly installmentPlanService: InstallmentPlanService,
  ) {}

  @Post()
  @UseGuards(AuthGuard, RoleGuard)
  @Roles(UserRole.SUPERADMIN, UserRole.ADMIN)
  @ApiOperation({
    summary: ` ${UserRole.SUPERADMIN} | ${UserRole.ADMIN}`,
  })
  create(@Body() dto: CreateInstallmentPlanDto) {
    return this.installmentPlanService.createIntallmentPlan(dto);
  }

  @Patch(':id')
  @UseGuards(AuthGuard, RoleGuard)
  @Roles(UserRole.SUPERADMIN, UserRole.ADMIN)
  @ApiOperation({
    summary: ` ${UserRole.SUPERADMIN} | ${UserRole.ADMIN}`,
  })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateInstallmentPlanDto,
  ) {
    return this.installmentPlanService.updateInstallmentPlan(id, dto);
  }

  @UseGuards(AuthGuard, RoleGuard)
  @Roles(UserRole.SUPERADMIN, UserRole.ADMIN)
  @ApiOperation({
    summary: ` ${UserRole.SUPERADMIN} | ${UserRole.ADMIN}`,
  })
  @Get()
  @ApiOperation({ summary: 'Get all installment plans with filters' })
  findAll(@Query() query: FilterInstallmentPlanDto) {
    return this.installmentPlanService.findAllPlans(query);
  }

  @UseGuards(AuthGuard, RoleGuard)
  @Roles(UserRole.SUPERADMIN, UserRole.ADMIN)
  @ApiOperation({
    summary: ` ${UserRole.SUPERADMIN} | ${UserRole.ADMIN}`,
  })
  @Get(':id')
  @ApiOperation({ summary: 'Get installment plan by ID' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.installmentPlanService.findOnePlan(id);
  }
  @Delete('delete/:id')
  async delete(@Param('id', ParseIntPipe) id: number) {
    return this.installmentPlanService.updateInstallmentPlan(id, {
      status: 'deleted',
    });
  }
}
