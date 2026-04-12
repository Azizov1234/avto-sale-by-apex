import { IsEnum, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { PaymentStatus, OrderStatus } from '@prisma/client';

export class UpdateOrderDto {
  @ApiProperty({ enum: PaymentStatus, required: false })
  @IsEnum(PaymentStatus)
  @IsOptional()
  paymentStatus?: PaymentStatus;

  @ApiProperty({ enum: OrderStatus, required: false })
  @IsEnum(OrderStatus)
  @IsOptional()
  orderStatus?: OrderStatus;
}
