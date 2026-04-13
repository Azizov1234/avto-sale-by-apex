import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Delete,
  Req,
  UseGuards,
} from '@nestjs/common';
import { OrderService } from './order.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { AuthGuard } from 'src/common/guards/jwt-auth.guard';
import { RoleGuard } from 'src/common/guards/role.guard';
import { Roles } from 'src/common/decorators/role';
import { UserRole } from '@prisma/client';
import { ApiBearerAuth } from '@nestjs/swagger';

@ApiBearerAuth()
@Controller('orders')
@UseGuards(AuthGuard)
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  @Post()
  create(@Body() dto: CreateOrderDto, @Req() req) {
    return this.orderService.create(dto, req.user.id);
  }

  @Get('my')
  getMy(@Req() req) {
    return this.orderService.findMyOrders(req.user.id);
  }

  @Get()
  @UseGuards(RoleGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPERADMIN)
  findAll() {
    return this.orderService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number, @Req() req) {
    return this.orderService.findOne(id, req.user);
  }

  @Patch(':id')
  @UseGuards(RoleGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPERADMIN)
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateOrderDto, @Req() req) {
    return this.orderService.update(id, dto, req.user);
  }

  @Delete(':id')
  @UseGuards(RoleGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPERADMIN)
  delete(@Param('id', ParseIntPipe) id: number, @Req() req) {
    return this.orderService.delete(id, req.user);
  }
}
