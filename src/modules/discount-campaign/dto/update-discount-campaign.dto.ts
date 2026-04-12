import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsDate,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

export class UpdateDiscountCampaignDto {
  @ApiPropertyOptional({ example: 'Weekend Sale' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ example: 'Updated campaign description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: 12, minimum: 0.01, maximum: 100 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0.01)
  @Max(100)
  discount?: number;

  @ApiPropertyOptional({ example: '2026-04-15T00:00:00.000Z' })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  startDate?: Date;

  @ApiPropertyOptional({ example: '2026-05-05T23:59:59.000Z' })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  endDate?: Date;
}
