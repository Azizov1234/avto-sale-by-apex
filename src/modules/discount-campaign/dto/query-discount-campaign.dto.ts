import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsString, Min } from 'class-validator';

export enum CampaignStateFilter {
  ACTIVE = 'active',
  EXPIRED = 'expired',
  UPCOMING = 'upcoming',
  ALL = 'all',
}

export class QueryDiscountCampaignDto {
  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ default: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number;

  @ApiPropertyOptional({ example: 'sale' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    enum: CampaignStateFilter,
    default: CampaignStateFilter.ALL,
  })
  @IsOptional()
  @IsEnum(CampaignStateFilter)
  state?: CampaignStateFilter;

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  carId?: number;
}
