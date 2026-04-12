import { IsString, IsOptional, IsNumber, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CarCondition, EngineType, Transmission } from '@prisma/client';
import { Type } from 'class-transformer';

export class CreateCarDto {
  @ApiProperty({ example: 'BMW X5' })
  @IsString()
  title!: string;

  @ApiProperty({ example: 'BMW' })
  @IsString()
  brand!: string;

  @ApiProperty({ example: 60000 })
  @Type(() => Number)
  @IsNumber()
  price!: number;

  @ApiProperty({ example: 2025 })
  @Type(() => Number)
  @IsNumber()
  year!: number;

  @ApiProperty({ example: 5000 })
  @Type(() => Number)
  @IsNumber()
  mileage!: number;

  @ApiProperty({ enum: Object.values(CarCondition), example: CarCondition.NEW })
  @IsEnum(CarCondition)
  carConditation!: CarCondition;

  @ApiProperty({ example: 'Luxury SUV, very comfortable' })
  @IsString()
  description!: string;

  @ApiPropertyOptional({ type: 'string', format: 'binary' })
  @IsOptional()
  @IsString()
  imageUrl?: string;

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @IsNumber()
  categoryId?: number;

  @ApiProperty({ enum: Object.values(EngineType), example: '' })
  @IsString()
  engine!: EngineType;

  @ApiProperty({ enum: Object.values(Transmission) })
  @IsEnum(Transmission)
  transmission!: Transmission;
}
