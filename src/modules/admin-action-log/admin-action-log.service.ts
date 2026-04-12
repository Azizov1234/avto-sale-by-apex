import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, Status, UserRole } from '@prisma/client';
import { PrismaService } from 'src/core/prisma/prisma.service';
import { QueryAdminActionLogDto } from './dto/query-admin-action-log.dto';

type CreateAdminActionLogInput = {
  adminId: number;
  action: string;
  entity: string;
  entityId: number;
};

@Injectable()
export class AdminActionLogService {
  constructor(private readonly prisma: PrismaService) {}

  async createLog(input: CreateAdminActionLogInput) {
    const admin = await this.prisma.user.findFirst({
      where: {
        id: input.adminId,
        status: Status.active,
        role: {
          in: [UserRole.ADMIN, UserRole.SUPERADMIN],
        },
      },
      select: {
        id: true,
      },
    });

    if (!admin) {
      return null;
    }

    return this.prisma.adminActionLog.create({
      data: {
        adminId: input.adminId,
        action: input.action,
        entity: input.entity,
        entityId: input.entityId,
      },
      include: this.logInclude,
    });
  }

  async findAll(query: QueryAdminActionLogDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const skip = (page - 1) * limit;
    const where = this.buildWhere(query);

    const [total, logs] = await Promise.all([
      this.prisma.adminActionLog.count({ where }),
      this.prisma.adminActionLog.findMany({
        where,
        include: this.logInclude,
        orderBy: {
          createdAt: 'desc',
        },
        skip,
        take: limit,
      }),
    ]);

    return {
      status: 200,
      data: logs,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: number) {
    const log = await this.prisma.adminActionLog.findFirst({
      where: {
        id,
        status: Status.active,
      },
      include: this.logInclude,
    });

    if (!log) {
      throw new NotFoundException('Admin action log not found');
    }

    return log;
  }

  async remove(id: number) {
    const log = await this.prisma.adminActionLog.findFirst({
      where: {
        id,
        status: Status.active,
      },
    });

    if (!log) {
      throw new NotFoundException('Admin action log not found');
    }

    return this.prisma.adminActionLog.update({
      where: {
        id,
      },
      data: {
        status: Status.deleted,
      },
    });
  }

  private readonly logInclude = {
    admin: {
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        avatarUrl: true,
      },
    },
  } as const;

  private buildWhere(
    query: QueryAdminActionLogDto,
  ): Prisma.AdminActionLogWhereInput {
    const filters: Prisma.AdminActionLogWhereInput[] = [
      {
        status: Status.active,
      },
    ];

    if (query.adminId) {
      filters.push({ adminId: query.adminId });
    }

    if (query.action) {
      filters.push({
        action: {
          contains: query.action,
          mode: Prisma.QueryMode.insensitive,
        },
      });
    }

    if (query.entity) {
      filters.push({
        entity: {
          contains: query.entity,
          mode: Prisma.QueryMode.insensitive,
        },
      });
    }

    if (query.search) {
      filters.push({
        OR: [
          {
            action: {
              contains: query.search,
              mode: Prisma.QueryMode.insensitive,
            },
          },
          {
            entity: {
              contains: query.search,
              mode: Prisma.QueryMode.insensitive,
            },
          },
          {
            admin: {
              name: {
                contains: query.search,
                mode: Prisma.QueryMode.insensitive,
              },
            },
          },
        ],
      });
    }

    return { AND: filters };
  }
}
