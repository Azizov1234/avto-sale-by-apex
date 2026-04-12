import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt } from 'class-validator';

export class ManageCampaignCarDto {
  @ApiProperty({ example: 1 })
  @Type(() => Number)
  @IsInt()
  carId!: number;
}
