import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsEnum } from 'class-validator';
import { Status } from '@prisma/client';
import { FilterCarsDto } from 'src/modules/car/dto/querys.dto';

export class FilterInstallmentPlanDto extends FilterCarsDto {
  @ApiPropertyOptional({ enum: Status })
  @IsOptional()
  @IsEnum(Status)
  planStatus?: Status;
}
