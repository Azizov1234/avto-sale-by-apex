import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, MinLength, MaxLength } from 'class-validator';

export class CreateCarsCategoryDto {
  @ApiProperty({ example: 'BMW' })
  @IsString()
  @MinLength(2)
  @MaxLength(50)
  name!: string;
}
