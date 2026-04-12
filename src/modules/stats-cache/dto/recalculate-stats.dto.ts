import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class RecalculateStatsDto {
  @ApiPropertyOptional({ example: 'dashboard', default: 'dashboard' })
  @IsOptional()
  @IsString()
  key?: string;
}
