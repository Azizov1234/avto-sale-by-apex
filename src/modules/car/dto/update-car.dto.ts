import { IsOptional, IsString, IsNumber, IsEnum } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { CarCondition, Transmission, Status, EngineType } from '@prisma/client';

export class UpdateCarDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  brand?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  price?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  year?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  mileage?: number;

  @ApiPropertyOptional({ enum: Object.values(CarCondition) })
  @IsOptional()
  @IsEnum(CarCondition)
  carConditation?: CarCondition;

  @ApiPropertyOptional({ enum: Transmission })
  @IsOptional()
  @IsEnum(Transmission)
  transmission?: Transmission;

  @ApiPropertyOptional({ enum: Object.values(EngineType) })
  @IsOptional()
  @IsString()
  engine?: EngineType;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  imageUrl?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  categoryId?: number;

  @ApiPropertyOptional({ enum: Object.values(Status) })
  @IsOptional()
  @IsEnum(Status)
  status?: Status;
}
