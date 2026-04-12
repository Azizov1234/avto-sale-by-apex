import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsDate,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

export class CreateDiscountCampaignDto {
  @ApiProperty({ example: 'Holiday Sale' })
  @IsString()
  name!: string;

  @ApiPropertyOptional({ example: 'Discount for selected premium cars' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ example: 10, minimum: 0.01, maximum: 100 })
  @Type(() => Number)
  @IsNumber()
  @Min(0.01)
  @Max(100)
  discount!: number;

  @ApiProperty({ example: '2026-04-15T00:00:00.000Z' })
  @Type(() => Date)
  @IsDate()
  startDate!: Date;

  @ApiProperty({ example: '2026-05-01T23:59:59.000Z' })
  @Type(() => Date)
  @IsDate()
  endDate!: Date;
}
