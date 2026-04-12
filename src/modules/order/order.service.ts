import {
  ForbiddenException,
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from 'src/core/prisma/prisma.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { OrderType, Status } from '@prisma/client';
import { AdminActionLogService } from '../admin-action-log/admin-action-log.service';

type AuthUser = {
  id: number;
  role: 'USER' | 'ADMIN' | 'SUPERADMIN';
};

@Injectable()
export class OrderService {
  constructor(
    private prisma: PrismaService,
    private readonly adminActionLogService: AdminActionLogService,
  ) {}

  async create(dto: CreateOrderDto, userId: number) {
    const carId = Number(dto.carId);
    if (isNaN(carId)) throw new BadRequestException('carId is invalid');
    const car = await this.prisma.car.findUnique({
      where: { id: carId },
      include: {
        installmentPlans: true,
        campaigns: {
          where: {
            status: Status.active,
            startDate: { lte: new Date() },
            endDate: { gte: new Date() },
          },
        },
      },
    });

    if (!car || car.status !== Status.active) {
      throw new NotFoundException('Car not found');
    }

    const campaignDiscount =
      car.campaigns?.length > 0
        ? Math.max(...car.campaigns.map((campaign) => campaign.discount))
        : 0;

    let discount = campaignDiscount;
    let interest = 0;
    let totalPrice = car.price - (car.price * campaignDiscount) / 100;
    let monthlyPay: number | null = null;

    if (dto.orderType === OrderType.FULL_PAYMENT) {
      totalPrice = car.price - (car.price * campaignDiscount) / 100;
    }

    if (dto.orderType === OrderType.INSTALLMENT) {
      if (!dto.planId) {
        throw new BadRequestException('planId is required');
      }

      const plan = car.installmentPlans.find(
        (p) => p.id === Number(dto.planId) && p.status === 'active',
      );

      if (!plan) {
        throw new BadRequestException('Installment plan not found');
      }

      discount = Math.min(campaignDiscount + plan.discount, 100);
      interest = plan.interest;

      totalPrice =
        car.price - (car.price * discount) / 100 + (car.price * interest) / 100;

      const months = this.mapMonths(plan.months);
      monthlyPay = totalPrice / months;
    }

    return this.prisma.order.create({
      data: {
        userId,
        carId: car.id,
        planId: dto.orderType === OrderType.INSTALLMENT ? Number(dto.planId) : null,
        orderType: dto.orderType,

        basePrice: car.price,
        discount,
        interest,
        totalPrice,
        monthlyPay,
      },
    });
  }

  async findAll() {
    return this.prisma.order.findMany({
      where: {
        status: Status.active,
      },
      include: {
        user: true,
        car: {
          include: { category: true },
        },
        plan: true,
        payments: {
          where: {
            status: Status.active,
          },
          orderBy: {
            paidAt: 'desc',
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findMyOrders(userId: number) {
    return this.prisma.order.findMany({
      where: {
        userId,
        status: Status.active,
      },
      include: {
        car: true,
        plan: true,
        payments: {
          where: {
            status: Status.active,
          },
          orderBy: {
            paidAt: 'desc',
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findOne(id: number, currentUser: AuthUser) {
    const order = await this.prisma.order.findFirst({
      where: {
        id,
        status: Status.active,
      },
      include: {
        user: true,
        car: {
          include: {
            category: true,
            installmentPlans: true,
          },
        },
        plan: true,
        payments: {
          where: {
            status: Status.active,
          },
          orderBy: {
            paidAt: 'desc',
          },
        },
      },
    });

    if (!order) throw new NotFoundException('Order not found');

    this.ensureOrderAccess(order.userId, currentUser);

    return order;
  }

  async update(id: number, dto: UpdateOrderDto) {
    const order = await this.prisma.order.findFirst({
      where: {
        id,
        status: Status.active,
      },
    });

    if (!order) throw new NotFoundException('Order not found');

    const updateData: any = {};
    if (dto.paymentStatus) updateData.paymentStatus = dto.paymentStatus;
    if (dto.orderStatus) updateData.orderStatus = dto.orderStatus;

    return this.prisma.order.update({
      where: { id },
      data: updateData,
    });
  }

  async delete(id: number, currentUser: AuthUser) {
    const order = await this.prisma.order.findFirst({
      where: {
        id,
        status: Status.active,
      },
    });

    if (!order) throw new NotFoundException('Order not found');

    const deletedOrder = await this.prisma.order.update({
      where: { id },
      data: { status: 'deleted' },
    });

    await this.adminActionLogService.createLog({
      adminId: currentUser.id,
      action: 'DELETE_ORDER',
      entity: 'ORDER',
      entityId: id,
    });

    return deletedOrder;
  }
  private mapMonths(months: string) {
    const map = {
      ONE: 1,
      THREE: 3,
      SIX: 6,
      NINE: 9,
      TWELVE: 12,
      TWENTY_FOUR: 24,
    };

    return map[months] ?? 1;
  }

  private ensureOrderAccess(ownerId: number, currentUser: AuthUser) {
    const isAdmin =
      currentUser.role === 'ADMIN' || currentUser.role === 'SUPERADMIN';

    if (!isAdmin && ownerId !== currentUser.id) {
      throw new ForbiddenException('You do not have access to this order');
    }
  }
}
