import {
  Controller,
  Post,
  Body,
  Delete,
  Param,
  ParseIntPipe,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  Get,
  Query,
  Patch,
  Req,
} from '@nestjs/common';

import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiQuery,
} from '@nestjs/swagger';

import { CarCondition, EngineType, UserRole } from '@prisma/client';

import { AuthGuard } from 'src/common/guards/jwt-auth.guard';
import { RoleGuard } from 'src/common/guards/role.guard';
import { Roles } from 'src/common/decorators/role';

import { CarsService } from './car.service';
import { CreateCarDto } from './dto/create-car.dto';
import { UpdateCarDto } from './dto/update-car.dto';
import { FilterCarsDto } from './dto/querys.dto';

import { FileInterceptor } from '@nestjs/platform-express';
import { CloudinaryService } from 'src/core/cloudinary copy/cloudinary.service';

@ApiTags('Cars')
@ApiBearerAuth()
@Controller('cars')
export class CarsController {
  constructor(
    private carsService: CarsService,
    private readonly cloudinary: CloudinaryService,
  ) {}

  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        title: { type: 'string' },
        brand: { type: 'string' },
        price: { type: 'number' },
        mileage: { type: 'number' },
        year: { type: 'number' },
        engine: { type: 'string', enum: Object.values(EngineType) },
        transmission: { type: 'string', enum: Object.values(EngineType) },
        carConditation: {
          type: 'string',
          enum: Object.values(CarCondition),
        },
        description: { type: 'string' },
        imageUrl: { type: 'string', format: 'binary' },
      },
    },
  })
  @UseInterceptors(FileInterceptor('imageUrl'))
  @Post('create')
  @UseGuards(AuthGuard, RoleGuard)
  @Roles('ADMIN', 'SUPERADMIN')
  @ApiOperation({ summary: `ADMIN | SUPERADMIN` })
  async create(
    @Body() payload: CreateCarDto,
    @UploadedFile() image: Express.Multer.File,
    @Req() req,
  ) {
    if (image) {
      payload.imageUrl = await this.cloudinary.uploadFile(image);
    }

    return this.carsService.create(payload, req.user);
  }

  @Delete('delete/:id')
  @UseGuards(AuthGuard, RoleGuard)
  @Roles('ADMIN', 'SUPERADMIN')
  @ApiOperation({ summary: `ADMIN | SUPERADMIN` })
  async delete(@Param('id', ParseIntPipe) id: number, @Req() req) {
    return this.carsService.delete(id, req.user);
  }

  @Get()
  @UseGuards(AuthGuard)
  async findAll(@Query() filters: FilterCarsDto, @Req() req) {
    return this.carsService.findAll(filters, req.user.role);
  }

  @Get(':id')
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: 'Get car by ID' })
  async findOne(@Param('id', ParseIntPipe) id: number, @Req() req) {
    return this.carsService.findOne(id, req.user.role);
  }

  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        title: { type: 'string' },
        brand: { type: 'string' },
        price: { type: 'number' },
        mileage: { type: 'number' },
        year: { type: 'number' },
        engine: { type: 'string' },
        transmission: { type: 'string' },
        description: { type: 'string' },
        imageUrl: { type: 'string', format: 'binary' },
      },
    },
  })
  @UseInterceptors(FileInterceptor('imageUrl'))
  @Patch(':id')
  @UseGuards(AuthGuard, RoleGuard)
  @Roles('ADMIN', 'SUPERADMIN')
  @ApiOperation({ summary: 'Update car (ADMIN)' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateCarDto,
    @UploadedFile() image: Express.Multer.File,
    @Req() req,
  ) {
    if (image) {
      dto.imageUrl = await this.cloudinary.uploadFile(image);
    }

    return this.carsService.update(id, dto, req.user);
  }
}
