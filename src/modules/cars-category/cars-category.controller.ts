import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { CarsCategoryService } from './cars-category.service';
import { CreateCarsCategoryDto } from './dto/create-cars-category.dto';
import { UpdateCarsCategoryDto } from './dto/update-cars-category.dto';
import { QueryCategoryDto } from './dto/query.dto';
import { AuthGuard } from 'src/common/guards/jwt-auth.guard';
import { RoleGuard } from 'src/common/guards/role.guard';
import { UserRole } from '@prisma/client';
import { Roles } from 'src/common/decorators/role';
import { ApiBearerAuth, ApiOperation } from '@nestjs/swagger';

@ApiBearerAuth()
@Controller('categories')
export class CarsCategoryController {
  constructor(private readonly service: CarsCategoryService) {}
  @UseGuards(AuthGuard, RoleGuard)
  @Roles(UserRole.SUPERADMIN, UserRole.ADMIN)
  @ApiOperation({
    summary: ` ${UserRole.SUPERADMIN} | ${UserRole.ADMIN}`,
  })
  @Post()
  create(@Body() dto: CreateCarsCategoryDto) {
    return this.service.create(dto);
  }

  @UseGuards(AuthGuard)
  @Get('all')
  findAll(
    @Req() req: Request,

    @Query() query?: QueryCategoryDto,
  ) {
    return this.service.findAll(req['user'].role, query);
  }

  @Get('one/:id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.service.findOne(id);
  }

  @Get(':id/cars')
  findCategoryAllCars(@Param('id', ParseIntPipe) id: number) {
    return this.service.findCategoryAllCars(id);
  }

  @UseGuards(AuthGuard, RoleGuard)
  @Roles(UserRole.SUPERADMIN, UserRole.ADMIN)
  @ApiOperation({
    summary: ` ${UserRole.SUPERADMIN} | ${UserRole.ADMIN}`,
  })
  @Patch('update/:id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateCarsCategoryDto,
  ) {
    return this.service.update(id, dto);
  }

  @UseGuards(AuthGuard, RoleGuard)
  @Roles(UserRole.SUPERADMIN, UserRole.ADMIN)
  @ApiOperation({
    summary: ` ${UserRole.SUPERADMIN} | ${UserRole.ADMIN}`,
  })
  @Delete('delete/:id')
  delete(@Param('id', ParseIntPipe) id: number) {
    return this.service.delete(id);
  }
}
