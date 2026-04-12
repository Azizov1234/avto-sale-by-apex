import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsPhoneNumber,
  IsString,
  IsUrl,
  Matches,
  Min,
  MinLength,
} from 'class-validator';
import { UserRole } from '@prisma/client';

export class CreateUserDto {
  @ApiProperty({
    description: 'Full name of the user',
    example: 'Dilnoza Baymirzayeva',
  })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiPropertyOptional({ type: 'string', format: 'binary' })
  avatarUrl!: string;

  @ApiProperty({
    description: 'Unique phone number',
    example: '+998901234567',
  })
  @IsString()
  @IsNotEmpty()
  phone!: string;

  @ApiProperty({
    description: 'Unique email address',
    example: 'dilnoza@example.com',
  })
  @IsEmail()
  email!: string;

  @ApiProperty({
    example: 'SecurePass123',
  })
  @IsNotEmpty()
  @IsString()
  @MinLength(5)
  password!: string;
}
