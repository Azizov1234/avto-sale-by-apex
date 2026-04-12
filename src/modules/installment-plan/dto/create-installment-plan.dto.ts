import { ApiProperty } from '@nestjs/swagger';
import { PlanMonths } from '@prisma/client';
import { IsEnum, IsInt, IsNumber, Min, Max } from 'class-validator';

export class CreateInstallmentPlanDto {
  @ApiProperty({ example: 1 })
  @IsInt()
  carId!: number;

  @ApiProperty({ enum: PlanMonths, example: PlanMonths.TWELVE })
  @IsEnum(PlanMonths)
  months!: PlanMonths;

  @ApiProperty({ example: 5, description: 'Discount in percent' })
  @IsNumber()
  @Min(0)
  @Max(100)
  discount!: number;

  @ApiProperty({ example: 10, description: 'Interest in percent' })
  @IsNumber()
  @Min(0)
  @Max(100)
  interest!: number;
}
