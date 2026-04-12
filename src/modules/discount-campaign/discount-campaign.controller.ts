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
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { Roles } from 'src/common/decorators/role';
import { AuthGuard } from 'src/common/guards/jwt-auth.guard';
import { RoleGuard } from 'src/common/guards/role.guard';
import { CreateDiscountCampaignDto } from './dto/create-discount-campaign.dto';
import { ManageCampaignCarDto } from './dto/manage-campaign-car.dto';
import { QueryDiscountCampaignDto } from './dto/query-discount-campaign.dto';
import { UpdateDiscountCampaignDto } from './dto/update-discount-campaign.dto';
import { DiscountCampaignService } from './discount-campaign.service';

@ApiTags('Campaigns')
@ApiBearerAuth()
@Controller('campaigns')
@UseGuards(AuthGuard)
export class DiscountCampaignController {
  constructor(
    private readonly discountCampaignService: DiscountCampaignService,
  ) {}

  @Post()
  @UseGuards(RoleGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPERADMIN)
  @ApiOperation({ summary: 'Create campaign' })
  create(@Body() dto: CreateDiscountCampaignDto, @Req() req) {
    return this.discountCampaignService.create(dto, req.user);
  }

  @Get()
  @ApiOperation({ summary: 'Get campaigns with filters' })
  findAll(@Query() query: QueryDiscountCampaignDto) {
    return this.discountCampaignService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get campaign detail' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.discountCampaignService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(RoleGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPERADMIN)
  @ApiOperation({ summary: 'Update campaign' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateDiscountCampaignDto,
    @Req() req,
  ) {
    return this.discountCampaignService.update(id, dto, req.user);
  }

  @Delete(':id')
  @UseGuards(RoleGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPERADMIN)
  @ApiOperation({ summary: 'Soft delete campaign' })
  remove(@Param('id', ParseIntPipe) id: number, @Req() req) {
    return this.discountCampaignService.remove(id, req.user);
  }

  @Post(':id/attach-car')
  @UseGuards(RoleGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPERADMIN)
  @ApiOperation({ summary: 'Attach car to campaign' })
  attachCar(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ManageCampaignCarDto,
    @Req() req,
  ) {
    return this.discountCampaignService.attachCar(id, dto, req.user);
  }

  @Post(':id/remove-car')
  @UseGuards(RoleGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPERADMIN)
  @ApiOperation({ summary: 'Remove car from campaign' })
  removeCar(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ManageCampaignCarDto,
    @Req() req,
  ) {
    return this.discountCampaignService.removeCar(id, dto, req.user);
  }
}
