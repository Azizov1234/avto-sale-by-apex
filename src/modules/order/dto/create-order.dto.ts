import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsInt, IsOptional } from 'class-validator';
import { OrderType } from '@prisma/client';

export class CreateOrderDto {
  @ApiProperty({ example: 1 })
  @IsInt()
  carId!: number;

  @ApiProperty({ example: 2, required: false })
  @IsOptional()
  @IsInt()
  planId?: number;

  @ApiProperty({ enum: OrderType })
  @IsEnum(OrderType)
  orderType!: OrderType;
}
