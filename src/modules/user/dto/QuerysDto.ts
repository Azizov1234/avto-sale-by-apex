import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Status, UserRole } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  IsInt,
  IsNumber,
  IsOptional,
  IsPhoneNumber,
  IsString,
  isString,
  Min,
} from 'class-validator';

export class QuerysDto {
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

  @ApiPropertyOptional({ example: 991234567 })
  @IsOptional()
  @IsPhoneNumber('UZ')
  phone?: string;

  @ApiPropertyOptional({ example: 'Abdualziz' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ enum: Object.values(UserRole), example: '' })
  @IsOptional()
  @IsString()
  role?: string;

  @ApiPropertyOptional({ enum: Object.values(Status), example: '' })
  @IsOptional()
  @IsString()
  status?: string;
}
