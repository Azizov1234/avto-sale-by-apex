import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  OrderStatus,
  PaymentStatus,
  Prisma,
  Status,
  UserRole,
} from '@prisma/client';
import { PrismaService } from 'src/core/prisma/prisma.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { QueryPaymentDto } from './dto/query-payment.dto';
import { AdminActionLogService } from '../admin-action-log/admin-action-log.service';

type AuthUser = {
  id: number;
  role: UserRole;
};

type PaymentWithOrder = Prisma.PaymentHistoryGetPayload<{
  include: {
    order: {
      include: {
        user: {
          select: {
            id: true;
            name: true;
            email: true;
          };
        };
        car: {
          select: {
            id: true;
            title: true;
            brand: true;
            imageUrl: true;
          };
        };
      };
    };
  };
}>;

@Injectable()
export class PaymentService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly adminActionLogService: AdminActionLogService,
  ) {}

  private readonly safeUserSelect = {
    id: true,
    name: true,
    phone: true,
    email: true,
    avatarUrl: true,
    role: true,
    status: true,
    createdAt: true,
    updatedAt: true,
  } as const;

  async payOrder(
    orderId: number,
    dto: CreatePaymentDto,
    currentUser: AuthUser,
  ) {
    const order = await this.getActiveOrderOrThrow(orderId);

    this.ensureOrderAccess(order.userId, currentUser);
    this.ensurePaymentCanBeCreated(order.orderStatus);

    const totalPaidBefore = await this.getTotalPaid(orderId);
    if (totalPaidBefore >= order.totalPrice) {
      throw new BadRequestException('Order is already fully paid');
    }

    const remainingBeforePayment = order.totalPrice - totalPaidBefore;
    if (dto.amount > remainingBeforePayment) {
      throw new BadRequestException(
        `Payment exceeds remaining balance of ${remainingBeforePayment.toFixed(2)}`,
      );
    }

    const result = await this.prisma.$transaction(async (tx) => {
      const payment = await tx.paymentHistory.create({
        data: {
          orderId,
          amount: dto.amount,
        },
        include: this.paymentInclude,
      });

      const paymentStatus = await this.syncOrderPaymentStatus(
        tx,
        orderId,
        order.totalPrice,
      );

      return {
        payment,
        paymentStatus,
      };
    });

    await this.adminActionLogService.createLog({
      adminId: currentUser.id,
      action: 'CREATE_PAYMENT',
      entity: 'ORDER',
      entityId: orderId,
    });

    const totalPaidAfter = totalPaidBefore + dto.amount;
    const remainingAmount = Math.max(order.totalPrice - totalPaidAfter, 0);
    const paymentProgressPercent =
      order.totalPrice > 0
        ? Math.min(100, Math.round((totalPaidAfter / order.totalPrice) * 100))
        : 0;

    return {
      message: 'Payment successful',
      orderId,
      orderPaymentStatus: result.paymentStatus,
      totalPaid: totalPaidAfter,
      remainingAmount,
      paymentProgressPercent,
      data: result.payment,
    };
  }

  async findAll(query: QueryPaymentDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const skip = (page - 1) * limit;
    const where = this.buildPaymentWhere(query);

    const [total, payments] = await Promise.all([
      this.prisma.paymentHistory.count({ where }),
      this.prisma.paymentHistory.findMany({
        where,
        include: this.paymentInclude,
        orderBy: {
          paidAt: 'desc',
        },
        skip,
        take: limit,
      }),
    ]);

    return {
      status: 200,
      data: payments,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findMy(userId: number, query: QueryPaymentDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const skip = (page - 1) * limit;
    const where = this.buildPaymentWhere(query, {
      order: {
        userId,
        status: Status.active,
      },
    });

    const [total, payments] = await Promise.all([
      this.prisma.paymentHistory.count({ where }),
      this.prisma.paymentHistory.findMany({
        where,
        include: this.paymentInclude,
        orderBy: {
          paidAt: 'desc',
        },
        skip,
        take: limit,
      }),
    ]);

    return {
      status: 200,
      data: payments,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findByOrder(
    orderId: number,
    currentUser: AuthUser,
    query: QueryPaymentDto,
  ) {
    const order = await this.getActiveOrderOrThrow(orderId);

    this.ensureOrderAccess(order.userId, currentUser);

    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const skip = (page - 1) * limit;
    const where = this.buildPaymentWhere(query, { orderId });

    const [total, payments] = await Promise.all([
      this.prisma.paymentHistory.count({ where }),
      this.prisma.paymentHistory.findMany({
        where,
        include: this.paymentInclude,
        orderBy: {
          paidAt: 'desc',
        },
        skip,
        take: limit,
      }),
    ]);

    return {
      status: 200,
      data: payments,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: number, currentUser: AuthUser) {
    const payment = await this.getActivePaymentOrThrow(id);

    this.ensureOrderAccess(payment.order.userId, currentUser);

    return payment;
  }

  async remove(id: number, currentUser: AuthUser) {
    const payment = await this.getActivePaymentOrThrow(id);

    const result = await this.prisma.$transaction(async (tx) => {
      await tx.paymentHistory.update({
        where: { id },
        data: {
          status: Status.deleted,
        },
      });

      const orderPaymentStatus = await this.syncOrderPaymentStatus(
        tx,
        payment.orderId,
        payment.order.totalPrice,
      );

      return {
        deletedPaymentId: id,
        orderId: payment.orderId,
        orderPaymentStatus,
      };
    });

    await this.adminActionLogService.createLog({
      adminId: currentUser.id,
      action: 'DELETE_PAYMENT',
      entity: 'ORDER',
      entityId: payment.orderId,
    });

    return {
      message: 'Payment deleted successfully',
      ...result,
    };
  }

  private readonly paymentInclude = {
    order: {
      include: {
        user: {
          select: this.safeUserSelect,
        },
        car: {
          select: {
            id: true,
            title: true,
            brand: true,
            imageUrl: true,
          },
        },
      },
    },
  } as const;

  private async getActiveOrderOrThrow(orderId: number) {
    const order = await this.prisma.order.findFirst({
      where: {
        id: orderId,
        status: Status.active,
      },
      select: {
        id: true,
        userId: true,
        totalPrice: true,
        orderStatus: true,
      },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    return order;
  }

  private async getActivePaymentOrThrow(id: number): Promise<PaymentWithOrder> {
    const payment = await this.prisma.paymentHistory.findFirst({
      where: {
        id,
        status: Status.active,
      },
      include: this.paymentInclude,
    });

    if (!payment) {
      throw new NotFoundException('Payment not found');
    }

    return payment;
  }

  private ensureOrderAccess(ownerId: number, currentUser: AuthUser) {
    const isAdmin =
      currentUser.role === UserRole.ADMIN ||
      currentUser.role === UserRole.SUPERADMIN;

    if (!isAdmin && ownerId !== currentUser.id) {
      throw new ForbiddenException('You do not have access to this order');
    }
  }

  private async getTotalPaid(orderId: number) {
    const summary = await this.prisma.paymentHistory.aggregate({
      where: {
        orderId,
        status: Status.active,
      },
      _sum: {
        amount: true,
      },
    });

    return summary._sum.amount ?? 0;
  }

  private ensurePaymentCanBeCreated(orderStatus: OrderStatus) {
    if (orderStatus === OrderStatus.CANCELLED) {
      throw new BadRequestException(
        'Cancelled order cannot accept payments',
      );
    }

    if (orderStatus !== OrderStatus.CONFIRMED) {
      throw new BadRequestException(
        'Order must be confirmed by admin before payment',
      );
    }
  }

  private async syncOrderPaymentStatus(
    tx: Prisma.TransactionClient,
    orderId: number,
    totalPrice: number,
  ) {
    const paymentSummary = await tx.paymentHistory.aggregate({
      where: {
        orderId,
        status: Status.active,
      },
      _sum: {
        amount: true,
      },
    });

    const totalPaid = paymentSummary._sum.amount ?? 0;
    const nextStatus =
      totalPaid >= totalPrice ? PaymentStatus.CONFIRMED : PaymentStatus.PENDING;

    await tx.order.update({
      where: { id: orderId },
      data: {
        paymentStatus: nextStatus,
      },
    });

    return nextStatus;
  }

  private buildPaymentWhere(
    query: QueryPaymentDto,
    extraWhere: Prisma.PaymentHistoryWhereInput = {},
  ): Prisma.PaymentHistoryWhereInput {
    const paidAtFilter =
      query.paidFrom || query.paidTo
        ? {
            gte: query.paidFrom,
            lte: query.paidTo,
          }
        : undefined;

    return {
      status: Status.active,
      amount: {
        gte: query.minAmount,
        lte: query.maxAmount,
      },
      ...(query.orderId && { orderId: query.orderId }),
      ...(paidAtFilter && { paidAt: paidAtFilter }),
      ...(query.userId && {
        order: {
          userId: query.userId,
          status: Status.active,
        },
      }),
      ...extraWhere,
    };
  }
}
