import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UploadedFile,
  UseInterceptors,
  UseGuards,
  ParseIntPipe,
  Query,
  Req,
} from '@nestjs/common';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
} from '@nestjs/swagger';
import type { Request } from 'express';
import { CloudinaryService } from 'src/core/cloudinary copy/cloudinary.service';
import { AuthGuard } from 'src/common/guards/jwt-auth.guard';
import { RoleGuard } from 'src/common/guards/role.guard';
import { Roles } from 'src/common/decorators/role';
import { UserRole } from '@prisma/client';
import { QuerysDto } from './dto/QuerysDto';

@ApiBearerAuth()
@Controller('user')
export class UserController {
  constructor(
    private readonly userService: UserService,
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
  @UseGuards(AuthGuard, RoleGuard)
  @Roles(UserRole.SUPERADMIN)
  @ApiOperation({
    summary: ` ${UserRole.SUPERADMIN} `,
  })
  @Post('create/admin')
  async createAdmin(
    @Req() req: Request,
    @Body() payload: CreateUserDto,
    @UploadedFile() avatarUrl: Express.Multer.File,
  ) {
    if (avatarUrl) {
      payload.avatarUrl = await this.cloudinary.uploadFile(avatarUrl);
    }

    return this.userService.createAdmin(payload, req['user']);
  }

  @UseGuards(AuthGuard, RoleGuard)
  @Roles(UserRole.SUPERADMIN, UserRole.ADMIN, UserRole.USER)
  @ApiOperation({
    summary: ` ${UserRole.SUPERADMIN} | ${UserRole.ADMIN} | ${UserRole.USER}`,
  })
  @Patch('update')
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
  async update(
    @Req() req: Request,
    @Body() payload: UpdateUserDto,
    @UploadedFile() avatarUrl: Express.Multer.File,
  ) {
    if (avatarUrl) {
      payload.avatarUrl = await this.cloudinary.uploadFile(avatarUrl);
    }
    return this.userService.updateUser(
      Number(req['user'].id),
      payload,
      req['user'],
    );
  }

  @UseGuards(AuthGuard, RoleGuard)
  @Roles(UserRole.SUPERADMIN, UserRole.ADMIN)
  @ApiOperation({
    summary: ` ${UserRole.SUPERADMIN} | ${UserRole.ADMIN}`,
  })
  @Patch('update/byAdmin/:id')
  async updateByAdmin(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: Request,
    @Body() payload: UpdateUserDto,
  ) {
    return this.userService.updateUserByAdmin(id, payload, req['user']);
  }

  @UseGuards(AuthGuard, RoleGuard)
  @Roles(UserRole.SUPERADMIN, UserRole.ADMIN)
  @ApiOperation({
    summary: ` ${UserRole.SUPERADMIN} | ${UserRole.ADMIN}`,
  })
  @Delete('delete/byAdmin/:id')
  async delete(@Param('id', ParseIntPipe) id: number, @Req() req: Request) {
    return this.userService.deleteUserByAdmin(id, req['user']);
  }

  @UseGuards(AuthGuard, RoleGuard)
  @Roles(UserRole.SUPERADMIN, UserRole.ADMIN)
  @ApiOperation({
    summary: ` ${UserRole.SUPERADMIN} | ${UserRole.ADMIN}`,
  })
  @Get('all/with/search')
  async getAllUsersAndSearch(@Query() query?: QuerysDto) {
    return await this.userService.getAllUser(query);
  }

  @UseGuards(AuthGuard, RoleGuard)
  @Roles(UserRole.SUPERADMIN, UserRole.ADMIN)
  @ApiOperation({
    summary: ` ${UserRole.SUPERADMIN} | ${UserRole.ADMIN}`,
  })
  @Get('getOne/:id')
  async getOne(@Param('id', ParseIntPipe) id: number) {
    return await this.userService.getOneUserById(id);
  }
}
