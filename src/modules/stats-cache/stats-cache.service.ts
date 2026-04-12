import { Injectable, NotFoundException } from '@nestjs/common';
import { Status } from '@prisma/client';
import { PrismaService } from 'src/core/prisma/prisma.service';

@Injectable()
export class StatsCacheService {
  private readonly cacheTtlMs = 5 * 60 * 1000;

  constructor(private readonly prisma: PrismaService) {}

  async getDashboardStats() {
    const cache = await this.prisma.statsCache.findUnique({
      where: {
        key: 'dashboard',
      },
    });

    if (cache && !this.isCacheExpired(cache.lastCalculated)) {
      return {
        fromCache: true,
        ...cache,
      };
    }

    const refreshed = await this.recalculateStats('dashboard');

    return {
      fromCache: false,
      ...refreshed,
    };
  }

  async recalculateStats(key: string) {
    if (key !== 'dashboard') {
      throw new NotFoundException(
        'Only dashboard stats recalculation is supported',
      );
    }

    const dashboardStats = await this.calculateDashboardStats();

    return this.prisma.statsCache.upsert({
      where: {
        key,
      },
      update: {
        data: dashboardStats,
        lastCalculated: new Date(),
      },
      create: {
        key,
        data: dashboardStats,
        lastCalculated: new Date(),
      },
    });
  }

  async getByKey(key: string) {
    if (key === 'dashboard') {
      return this.getDashboardStats();
    }

    const cache = await this.prisma.statsCache.findUnique({
      where: {
        key,
      },
    });

    if (!cache) {
      throw new NotFoundException('Stats cache not found');
    }

    return {
      fromCache: !this.isCacheExpired(cache.lastCalculated),
      ...cache,
    };
  }

  private async calculateDashboardStats() {
    const [cars, orders, users, revenueAggregate] =
      await this.prisma.$transaction([
        this.prisma.car.count({
          where: {
            status: Status.active,
          },
        }),
        this.prisma.order.count({
          where: {
            status: Status.active,
          },
        }),
        this.prisma.user.count({
          where: {
            status: Status.active,
          },
        }),
        this.prisma.paymentHistory.aggregate({
          where: {
            status: Status.active,
            order: {
              status: Status.active,
            },
          },
          _sum: {
            amount: true,
          },
        }),
      ]);

    return {
      cars,
      orders,
      users,
      revenue: revenueAggregate._sum.amount ?? 0,
      generatedAt: new Date().toISOString(),
    };
  }

  private isCacheExpired(lastCalculated: Date) {
    return Date.now() - lastCalculated.getTime() > this.cacheTtlMs;
  }
}
