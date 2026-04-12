import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { IsEmail, IsEnum, IsOptional, IsString } from 'class-validator';
import { UserRole } from '@prisma/client';
import { CreateUserDto } from './create-user.dto';

export class UpdateUserDto extends PartialType(CreateUserDto) {
  @ApiPropertyOptional({ example: '' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ example: '' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ example: '' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ example: '' })
  @IsOptional()
  @IsString()
  password?: string;

  @ApiPropertyOptional({ example: '' })
  @IsOptional()
  avatarUrl?: string;

  @ApiPropertyOptional({ example: '' })
  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;

  @ApiPropertyOptional({ example: '' })
  @IsOptional()
  @IsString()
  status?: string;
}
