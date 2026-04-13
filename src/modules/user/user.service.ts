import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { BcryptUtilsService } from 'src/common/utils/bcrypt.service';
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
    private readonly bcrypt: BcryptUtilsService,
    private readonly adminActionLogService: AdminActionLogService,
  ) {}

  private serializeUser<T extends Record<string, unknown>>(user: T) {
    const { password, refreshToken, ...safeUser } = user as T & {
      password?: string | null;
      refreshToken?: string | null;
    };

    return safeUser;
  }

  async createAdmin(payload: CreateUserDto, currentUser: AuthUser) {
    const existPhone = await this.prisma.user.findFirst({
      where: { phone: payload.phone },
    });
    if (existPhone)
      throw new ConflictException('User with this phone already exists');

    const existEmail = await this.prisma.user.findFirst({
      where: { email: payload.email },
    });
    if (existEmail)
      throw new ConflictException('User with this email already exists');

    const hashPass = await this.bcrypt.generateHashPass(payload.password);
    const user = await this.prisma.user.create({
      data: {
        ...payload,
        role: UserRole.ADMIN,
        password: hashPass,
      },
    });

    await this.adminActionLogService.createLog({
      adminId: currentUser.id,
      action: 'CREATE_USER',
      entity: 'USER',
      entityId: user.id,
    });

    return {
      message: 'Successfully created ',
      status: 200,
      data: this.serializeUser(user),
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
      select: {
        id: true,
        phone: true,
        name: true,
        avatarUrl: true,
        email: true,
        role: true,
        status: true,
        createdAt: true,
        updatedAt: true,
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

    const isSelfUpdate = currentUser.id === id;
    const isSuperadmin = currentUser.role === UserRole.SUPERADMIN;
    const isAdmin =
      currentUser.role === UserRole.ADMIN || currentUser.role === UserRole.SUPERADMIN;
    const roleChangeRequested = payload.role !== undefined;
    const statusChangeRequested = payload.status !== undefined;

    if (!isSelfUpdate && !isAdmin) {
      throw new ForbiddenException('You do not have permission to update this user');
    }

    if (user.role === UserRole.SUPERADMIN && !isSelfUpdate && !isSuperadmin) {
      throw new ForbiddenException('Only superadmin can manage superadmin accounts');
    }

    if (isSelfUpdate && (roleChangeRequested || statusChangeRequested)) {
      throw new ForbiddenException('You cannot change your own role or status');
    }

    if (!isSuperadmin && roleChangeRequested) {
      throw new ForbiddenException('Only superadmin can change user roles');
    }

    if (!isSuperadmin && statusChangeRequested) {
      throw new ForbiddenException('Only superadmin can change user status');
    }

    if (payload.phone && payload.phone !== user.phone) {
      const existPhone = await this.prisma.user.findFirst({
        where: { phone: payload.phone },
      });
      if (existPhone)
        throw new ConflictException(
          'Another user already uses this phone number',
        );
    }

    if (payload.email && payload.email !== user.email) {
      const existEmail = await this.prisma.user.findFirst({
        where: { email: payload.email },
      });
      if (existEmail)
        throw new ConflictException('Another user already uses this email');
    }

    const data: any = { ...payload };

    if (isSelfUpdate) {
      delete data.role;
      delete data.status;
    }

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
      data: this.serializeUser(updatedUser),
    };
  }

  async updateUserByAdmin(
    id: number,
    payload: UpdateUserDto,
    currentUser: AuthUser,
  ) {
    const targetUser = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        role: true,
      },
    });

    if (!targetUser) {
      throw new NotFoundException('User is not found!');
    }

    if (currentUser.id === id) {
      throw new BadRequestException('Use the profile update endpoint for your own account');
    }

    if (currentUser.role === UserRole.ADMIN) {
      if (targetUser.role !== UserRole.USER) {
        throw new ForbiddenException('Admin can only manage regular users');
      }

      if (payload.role !== undefined || payload.status !== undefined) {
        throw new ForbiddenException(
          'Only superadmin can change user role or status',
        );
      }
    }

    return this.updateUser(id, payload, currentUser);
  }

  async deleteUserByAdmin(id: number, currentUser: AuthUser) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        role: true,
        status: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User is not found !');
    }

    if (currentUser.id === id) {
      throw new BadRequestException('You cannot delete your own account');
    }

    if (user.role === UserRole.SUPERADMIN) {
      throw new ForbiddenException('Superadmin account cannot be deleted');
    }

    if (currentUser.role === UserRole.ADMIN && user.role !== UserRole.USER) {
      throw new ForbiddenException('Admin can only delete regular users');
    }

    if (user.status === Status.deleted) {
      throw new BadRequestException('User is already deleted');
    }

    await this.prisma.user.update({
      where: { id },
      data: {
        status: Status.deleted,
      },
    });

    await this.adminActionLogService.createLog({
      adminId: currentUser.id,
      action: 'DELETE_USER',
      entity: 'USER',
      entityId: id,
    });

    return {
      status: 200,
      message: 'User successfully deleted',
    };
  }
}
