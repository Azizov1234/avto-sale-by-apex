import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsInt, IsNumber, IsOptional, Min, Max } from 'class-validator';
import { PlanMonths, Status } from '@prisma/client';

export class UpdateInstallmentPlanDto {
  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @IsInt()
  carId?: number;

  @ApiPropertyOptional({ enum: PlanMonths })
  @IsOptional()
  @IsEnum(PlanMonths)
  months?: PlanMonths;

  @ApiPropertyOptional({ example: 5, description: 'Discount %' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  discount?: number;

  @ApiPropertyOptional({ example: 10, description: 'Interest %' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  interest?: number;

  @ApiPropertyOptional({ enum: Status })
  @IsOptional()
  @IsEnum(Status)
  status?: Status;
}
