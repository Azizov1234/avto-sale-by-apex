import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { BcryptUtilsService } from 'src/common/utils/bcrypt.service';
import { JwtUtilsService } from 'src/common/utils/jwt.service';
import { PrismaService } from 'src/core/prisma/prisma.service';
import { QuerysDto } from './dto/QuerysDto';
import { Status, UserRole } from '@prisma/client';
import { AdminActionLogService } from '../admin-action-log/admin-action-log.service';

type AuthUser = {
  id: number;
  role: UserRole;
};

@Injectable()
export class UserService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtUtilsService,
    private readonly bcrypt: BcryptUtilsService,
    private readonly adminActionLogService: AdminActionLogService,
  ) {}
  async createAdmin(payload: CreateUserDto) {
    const existPhone = await this.prisma.user.findFirst({
      where: { phone: payload.phone },
    });
    if (existPhone) throw new ConflictException('Phone number is already used');

    const existEmail = await this.prisma.user.findFirst({
      where: { email: payload.email },
    });
    if (existEmail) throw new ConflictException('Email is already used');

    const hashPass = await this.bcrypt.generateHashPass(payload.password);
    const user = await this.prisma.user.create({
      data: {
        ...payload,
        role: UserRole.SUPERADMIN,
        password: hashPass,
      },
    });
    return {
      message: 'Successfully created ',
      status: 200,
      data: user,
      accessToken: this.jwt.generateToken({
        id: user.id,
        phone: user.phone,
        role: user.role,
      }),
    };
  }
  async deleteUser(id: number) {
    const existPhone = await this.prisma.user.findFirst({
      where: { id },
    });
    if (!existPhone) throw new NotFoundException('User is not found !');
    const updateuser = await this.prisma.user.update({
      where: { id },
      data: {
        status: 'deleted',
      },
    });
    return {
      status: 200,
      message: 'User successfully deleted',
    };
  }
  async getAllUser(query?: QuerysDto) {
    const where: any = {};

    const page = Number(query?.page) || 1;
    const limit = Number(query?.limit) || 10;
    const skip = (page - 1) * limit;

    if (query?.phone) {
      where.phone = {
        contains: query.phone,
      };
    }

    if (query?.name) {
      where.name = {
        contains: query.name,
        mode: 'insensitive',
      };
    }

    if (query?.role) {
      where.role = query.role;
    }
    if (query?.status) {
      where.status = query.status;
    }

    const [users, totalCount] = await this.prisma.$transaction([
      this.prisma.user.findMany({
        where,
        skip,
        take: limit,
        select: {
          id: true,
          phone: true,
          name: true,
          avatarUrl: true,
          email: true,
          role: true,
          status: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.user.count({ where }),
    ]);

    return {
      message: 'Users retrieved successfully',
      status: 200,
      data: users,
      pagination: {
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
        currentPage: page,
        limit,
      },
    };
  }
  async getOneUserById(id: number) {
    const existUser = await this.prisma.user.findFirst({
      where: {
        id,
        status: Status.active,
      },
    });
    if (!existUser) throw new NotFoundException('User is not found !');

    return {
      status: 200,
      data: existUser,
    };
  }
  async updateUser(id: number, payload: UpdateUserDto, currentUser: AuthUser) {
    const user = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException('User is not found!');
    }

    if (payload.phone && payload.phone !== user.phone) {
      const existPhone = await this.prisma.user.findFirst({
        where: { phone: payload.phone },
      });
      if (existPhone)
        throw new ConflictException(
          'Phone number is already used by another user',
        );
    }

    if (payload.email && payload.email !== user.email) {
      const existEmail = await this.prisma.user.findFirst({
        where: { email: payload.email },
      });
      if (existEmail)
        throw new ConflictException('Email is already used by another user');
    }

    const data: any = { ...payload };
    if (payload.password) {
      data.password = await this.bcrypt.generateHashPass(payload.password);
    }

    const updatedUser = await this.prisma.user.update({
      where: { id },
      data: data,
    });

    await this.adminActionLogService.createLog({
      adminId: currentUser.id,
      action: 'UPDATE_USER',
      entity: 'USER',
      entityId: updatedUser.id,
    });

    return {
      message: 'User successfully updated',
      status: 200,
      data: updatedUser,
    };
  }

  async updateUserByAdmin(
    id: number,
    payload: UpdateUserDto,
    currentUser: AuthUser,
  ) {
    return this.updateUser(id, payload, currentUser);
  }
}
