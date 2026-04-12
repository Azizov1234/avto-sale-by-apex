import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, Min } from 'class-validator';

export class QueryAdminActionLogDto {
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

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  adminId?: number;

  @ApiPropertyOptional({ example: 'CREATE_CAR' })
  @IsOptional()
  @IsString()
  action?: string;

  @ApiPropertyOptional({ example: 'CAR' })
  @IsOptional()
  @IsString()
  entity?: string;

  @ApiPropertyOptional({ example: 'car' })
  @IsOptional()
  @IsString()
  search?: string;
}
