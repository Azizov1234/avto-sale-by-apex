import {
  Controller,
  Post,
  Body,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { UserLoginDto, UserRegisterDto } from './dto/create-auth.dto';
import { ApiBearerAuth, ApiBody, ApiConsumes } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { CloudinaryService } from 'src/core/cloudinary copy/cloudinary.service';

@ApiBearerAuth()
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly cloudinary: CloudinaryService,
  ) {}

  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        name: { type: 'string', example: '' },
        phone: { type: 'string', example: '' },
        avatarUrl: { type: 'string', format: 'binary' },
        email: { type: 'string', example: '' },
        password: { type: 'string', example: '' },
      },
    },
  })
  @UseInterceptors(FileInterceptor('avatarUrl'))
  @Post('register')
  async register(
    @Body() payload: UserRegisterDto,
    @UploadedFile() avatarUrl: Express.Multer.File,
  ) {
    if (avatarUrl) {
      payload.avatarUrl = await this.cloudinary.uploadFile(avatarUrl);
    }

    return this.authService.register(payload);
  }

  @Post('login')
  async login(@Body() payload: UserLoginDto) {
    return this.authService.login(payload);
  }
}
