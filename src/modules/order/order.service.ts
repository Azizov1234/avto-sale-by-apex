import {
  ForbiddenException,
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from 'src/core/prisma/prisma.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { OrderStatus, OrderType, PaymentStatus, Status } from '@prisma/client';
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

  private readonly safeUserSelect = {
    id: true,
    name: true,
    phone: true,
    avatarUrl: true,
    email: true,
    role: true,
    status: true,
    createdAt: true,
    updatedAt: true,
  } as const;

  private readonly activePaymentsInclude = {
    where: {
      status: Status.active,
    },
    orderBy: {
      paidAt: 'desc' as const,
    },
  } as const;

  private readonly orderInclude = {
    car: {
      include: {
        category: true,
      },
    },
    plan: true,
    payments: this.activePaymentsInclude,
  } as const;

  private readonly adminOrderInclude = {
    user: {
      select: this.safeUserSelect,
    },
    ...this.orderInclude,
  } as const;

  private readonly orderDetailInclude = {
    user: {
      select: this.safeUserSelect,
    },
    car: {
      include: {
        category: true,
        installmentPlans: true,
      },
    },
    plan: true,
    payments: this.activePaymentsInclude,
  } as const;

  async create(dto: CreateOrderDto, userId: number) {
    const car = await this.prisma.car.findUnique({
      where: { id: dto.carId },
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
      car.campaigns.length > 0
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
        (p) => p.id === dto.planId && p.status === 'active',
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

    const order = await this.prisma.order.create({
      data: {
        userId,
        carId: car.id,
        planId: dto.orderType === OrderType.INSTALLMENT ? dto.planId : null,
        orderType: dto.orderType,

        basePrice: car.price,
        discount,
        interest,
        totalPrice,
        monthlyPay,
      },
    });

    const createdOrder = await this.prisma.order.findUniqueOrThrow({
      where: { id: order.id },
      include: this.orderInclude,
    });

    return this.serializeOrder(createdOrder);
  }

  async findAll() {
    const orders = await this.prisma.order.findMany({
      where: {
        status: Status.active,
      },
      include: this.adminOrderInclude,
      orderBy: { createdAt: 'desc' },
    });

    return orders.map((order) => this.serializeOrder(order));
  }

  async findMyOrders(userId: number) {
    const orders = await this.prisma.order.findMany({
      where: {
        userId,
        status: Status.active,
      },
      include: this.orderInclude,
      orderBy: {
        createdAt: 'desc',
      },
    });

    return orders.map((order) => this.serializeOrder(order));
  }

  async findOne(id: number, currentUser: AuthUser) {
    const order = await this.prisma.order.findFirst({
      where: {
        id,
        status: Status.active,
      },
      include: this.orderDetailInclude,
    });

    if (!order) throw new NotFoundException('Order not found');

    this.ensureOrderAccess(order.userId, currentUser);

    return this.serializeOrder(order);
  }

  async update(id: number, dto: UpdateOrderDto, currentUser: AuthUser) {
    const order = await this.prisma.order.findFirst({
      where: {
        id,
        status: Status.active,
      },
    });

    if (!order) throw new NotFoundException('Order not found');

    if (
      dto.orderStatus === OrderStatus.DELIVERED &&
      order.paymentStatus !== PaymentStatus.CONFIRMED
    ) {
      throw new BadRequestException(
        'Order cannot be delivered until full payment is confirmed',
      );
    }

    if (dto.paymentStatus === PaymentStatus.CONFIRMED) {
      throw new BadRequestException(
        'Use payment history entries to confirm payment status',
      );
    }

    const updateData: any = {};
    if (dto.paymentStatus) {
      updateData.paymentStatus = dto.paymentStatus;
    }
    if (dto.orderStatus) {
      updateData.orderStatus = dto.orderStatus;
    }

    const updatedOrder = await this.prisma.order.update({
      where: { id },
      data: updateData,
    });

    await this.adminActionLogService.createLog({
      adminId: currentUser.id,
      action: 'UPDATE_ORDER',
      entity: 'ORDER',
      entityId: id,
    });

    return updatedOrder;
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

  private serializeOrder(order: {
    totalPrice: number;
    paymentStatus: PaymentStatus;
    orderType: OrderType;
    monthlyPay: number | null;
    plan: { months: string } | null;
    payments: Array<{ amount: number }>;
    [key: string]: unknown;
  }) {
    const totalPaid = order.payments.reduce(
      (sum, payment) => sum + payment.amount,
      0,
    );
    const remainingAmount = Math.max(order.totalPrice - totalPaid, 0);
    const paymentProgressPercent =
      order.totalPrice > 0
        ? Math.min(100, Math.round((totalPaid / order.totalPrice) * 100))
        : 0;

    const installmentMonthsTotal =
      order.orderType === OrderType.INSTALLMENT && order.plan
        ? this.mapMonths(order.plan.months)
        : null;
    const installmentMonthsPaid =
      installmentMonthsTotal && order.monthlyPay && order.monthlyPay > 0
        ? Math.min(
            installmentMonthsTotal,
            Math.floor(totalPaid / order.monthlyPay),
          )
        : 0;
    const installmentMonthsRemaining =
      installmentMonthsTotal !== null
        ? Math.max(installmentMonthsTotal - installmentMonthsPaid, 0)
        : null;
    const isFullyPaid =
      order.paymentStatus === PaymentStatus.CONFIRMED || remainingAmount === 0;

    return {
      ...order,
      totalPaid,
      remainingAmount,
      paymentProgressPercent,
      paymentCount: order.payments.length,
      isFullyPaid,
      installmentMonthsTotal,
      installmentMonthsPaid,
      installmentMonthsRemaining,
    };
  }

  private ensureOrderAccess(ownerId: number, currentUser: AuthUser) {
    const isAdmin =
      currentUser.role === 'ADMIN' || currentUser.role === 'SUPERADMIN';

    if (!isAdmin && ownerId !== currentUser.id) {
      throw new ForbiddenException('You do not have access to this order');
    }
  }
}
