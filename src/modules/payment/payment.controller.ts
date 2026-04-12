import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { Roles } from 'src/common/decorators/role';
import { AuthGuard } from 'src/common/guards/jwt-auth.guard';
import { RoleGuard } from 'src/common/guards/role.guard';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { QueryPaymentDto } from './dto/query-payment.dto';
import { PaymentService } from './payment.service';

@Controller()
@UseGuards(AuthGuard)
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  @Post('orders/:id/pay')
  payOrder(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: CreatePaymentDto,
    @Req() req,
  ) {
    return this.paymentService.payOrder(id, dto, req.user);
  }

  @Get('orders/:id/payments')
  findByOrder(
    @Param('id', ParseIntPipe) id: number,
    @Req() req,
    @Query() query: QueryPaymentDto,
  ) {
    return this.paymentService.findByOrder(id, req.user, query);
  }

  @Get('payments/my')
  findMy(@Req() req, @Query() query: QueryPaymentDto) {
    return this.paymentService.findMy(req.user.id, query);
  }

  @Get('payments')
  @UseGuards(RoleGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPERADMIN)
  findAll(@Query() query: QueryPaymentDto) {
    return this.paymentService.findAll(query);
  }

  @Get('payments/:id')
  findOne(@Param('id', ParseIntPipe) id: number, @Req() req) {
    return this.paymentService.findOne(id, req.user);
  }

  @Delete('payments/:id')
  @UseGuards(RoleGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPERADMIN)
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.paymentService.remove(id);
  }
}
