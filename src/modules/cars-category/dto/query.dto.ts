import { IsOptional, IsString, IsInt } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Status } from '@prisma/client';

export class QueryCategoryDto {
  @ApiPropertyOptional({ example: '' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ example: '' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  page?: number;

  @ApiPropertyOptional({ example: '' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  limit?: number;

  @ApiPropertyOptional({ enum: Object.values(Status), example: '' })
  @IsOptional()
  @IsString()
  status?: string;
}
