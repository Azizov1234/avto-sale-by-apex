import { IsOptional, IsString, IsNumber, IsEnum, Min } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { CarCondition, Status } from '@prisma/client';
import { Type } from 'class-transformer';

export class FilterCarsDto {
  @ApiPropertyOptional({ description: 'Minimum price', example: '' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  minPrice?: number;

  @ApiPropertyOptional({ description: 'Maximum price', example: '' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  maxPrice?: number;

  @ApiPropertyOptional({ description: 'Brand filter', example: '' })
  @IsOptional()
  @IsString()
  brand?: string;

  @ApiPropertyOptional({ description: 'Search in title', example: '' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    enum: CarCondition,
    description: 'Filter by car condition',
  })
  @IsOptional()
  @IsEnum(CarCondition)
  carConditation?: CarCondition;

  @ApiPropertyOptional({ description: 'Page number', example: '' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ description: 'Items per page', example: '' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  limit?: number;

  @ApiPropertyOptional({ enum: Status })
  @IsOptional()
  @IsEnum(Status)
  status?: Status;
}
