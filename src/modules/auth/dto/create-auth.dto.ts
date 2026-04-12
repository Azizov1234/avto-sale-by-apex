import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';

export class UserRegisterDto {
  @ApiProperty({
    description: 'Full name of the user',
    example: 'Dilnoza Baymirzayeva',
  })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiPropertyOptional({ type: 'string', format: 'binary' })
  @IsOptional()
  @IsString()
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
  @IsString()
  @MinLength(6)
  @IsNotEmpty()
  password!: string;
}

export class UserLoginDto {
  @ApiProperty({
    example: '',
  })
  @IsString()
  @IsNotEmpty()
  phone!: string;

  @ApiProperty({
    description: 'User password',
    example: 'SecurePass123',
  })
  @IsString()
  @IsNotEmpty()
  password!: string;
}
