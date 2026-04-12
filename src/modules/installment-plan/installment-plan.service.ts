import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateInstallmentPlanDto } from './dto/create-installment-plan.dto';
import { UpdateInstallmentPlanDto } from './dto/update-installment-plan.dto';
import { PrismaService } from 'src/core/prisma/prisma.service';
import { Prisma } from '@prisma/client';
import { FilterInstallmentPlanDto } from './dto/querys.dto';

@Injectable()
export class InstallmentPlanService {
  constructor(private readonly prisma: PrismaService) {}
  async createIntallmentPlan(payload: CreateInstallmentPlanDto) {
    const car = await this.prisma.car.findUnique({
      where: { id: payload.carId },
    });

    if (!car || car.status !== 'active') {
      throw new ConflictException('Car not found or inactive');
    }

    const checkMonth = await this.prisma.installmentPlan.findFirst({
      where: {
        carId: payload.carId,
        months: payload.months,
        status: 'active',
      },
    });

    if (checkMonth) {
      throw new ConflictException('Plan already exists for this month');
    }

    const plan = await this.prisma.installmentPlan.create({
      data: {
        carId: payload.carId,
        months: payload.months,
        discount: payload.discount,
        interest: payload.interest,
      },
    });

    return {
      status: 201,
      message: 'Installment plan created',
    };
  }
  async updateInstallmentPlan(id: number, dto: UpdateInstallmentPlanDto) {
    const plan = await this.prisma.installmentPlan.findUnique({
      where: { id },
    });

    if (!plan) {
      throw new NotFoundException('Installment plan not found');
    }

    const newCarId = dto.carId ?? plan.carId;
    const newMonths = dto.months ?? plan.months;

    const duplicate = await this.prisma.installmentPlan.findFirst({
      where: {
        carId: newCarId,
        months: newMonths,
        NOT: {
          id,
        },
      },
    });

    if (duplicate) {
      throw new ConflictException(
        'This car already has a plan with this month range',
      );
    }

    return this.prisma.installmentPlan.update({
      where: { id },
      data: {
        carId: dto.carId,
        months: dto.months,
        discount: dto.discount,
        interest: dto.interest,
        status: dto.status,
      },
    });
  }
  async findAllPlans(filters: FilterInstallmentPlanDto) {
    const {
      minPrice,
      maxPrice,
      brand,
      search,
      carConditation,
      page = 1,
      limit = 10,
      status,
      planStatus,
    } = filters;

    const skip = (page - 1) * limit;

    const where: Prisma.InstallmentPlanWhereInput = {
      status: planStatus ?? undefined,

      car: {
        status: status ?? undefined,

        price: {
          gte: minPrice ?? undefined,
          lte: maxPrice ?? undefined,
        },

        brand: brand ? { contains: brand, mode: 'insensitive' } : undefined,

        title: search ? { contains: search, mode: 'insensitive' } : undefined,

        carConditation: carConditation ?? undefined,
      },
    };

    const [total, plans] = await Promise.all([
      this.prisma.installmentPlan.count({ where }),
      this.prisma.installmentPlan.findMany({
        where,
        include: {
          car: {
            include: {
              category: true,
            },
          },
        },
        skip,
        take: limit,
      }),
    ]);

    return {
      status: 200,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      data: plans,
    };
  }
  async findOnePlan(id: number) {
    const plan = await this.prisma.installmentPlan.findUnique({
      where: { id },
      include: {
        car: {
          include: {
            category: true,
          },
        },
      },
    });

    if (!plan) {
      throw new NotFoundException('Installment plan not found');
    }

    return {
      status: 200,
      data: plan,
    };
  }
  async deletePlan(id: number) {
    const plan = await this.prisma.installmentPlan.findUnique({
      where: { id },
    });

    if (!plan) throw new NotFoundException('Plan not found');

    return this.prisma.installmentPlan.update({
      where: { id },
      data: { status: 'deleted' },
    });
  }
}
