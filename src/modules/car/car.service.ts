import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { Prisma, Status, UserRole } from '@prisma/client';
import { FilterCarsDto } from './dto/querys.dto';
import { PrismaService } from 'src/core/prisma/prisma.service';
import { AdminActionLogService } from '../admin-action-log/admin-action-log.service';
import { CreateCarDto } from './dto/create-car.dto';
import { UpdateCarDto } from './dto/update-car.dto';

type AuthUser = {
  id: number;
  role: UserRole;
};

@Injectable()
export class CarsService {
  constructor(
    private prisma: PrismaService,
    private readonly adminActionLogService: AdminActionLogService,
  ) {}

  async create(dto: CreateCarDto, currentUser: AuthUser) {
    const existing = await this.prisma.car.findUnique({
      where: { title: dto.title },
    });
    if (existing)
      throw new ConflictException('Car with this title already exists');

    if (dto.categoryId) {
      const category = await this.prisma.carCategory.findUnique({
        where: { id: dto.categoryId },
      });
      if (!category || category.status !== 'active') {
        throw new BadRequestException('Invalid or inactive category');
      }
    }

    const car = await this.prisma.car.create({
      data: {
        title: dto.title,
        brand: dto.brand,
        price: dto.price,
        year: dto.year,
        mileage: dto.mileage,
        carConditation: dto.carConditation,
        description: dto.description,
        imageUrl: dto.imageUrl,
        categoryId: dto.categoryId,
        engine: dto.engine,
        transmission: dto.transmission,
      },
    });

    await this.adminActionLogService.createLog({
      adminId: currentUser.id,
      action: 'CREATE_CAR',
      entity: 'CAR',
      entityId: car.id,
    });

    return {
      status: 200,
      message: 'Car successfully created !',
      data: car,
    };
  }
  async delete(carId: number, currentUser: AuthUser) {
    const car = await this.prisma.car.findUnique({ where: { id: carId } });
    if (!car) throw new NotFoundException('Car not found');

    const deleted = await this.prisma.car.update({
      where: { id: carId },
      data: { status: 'deleted' },
    });

    await this.adminActionLogService.createLog({
      adminId: currentUser.id,
      action: 'DELETE_CAR',
      entity: 'CAR',
      entityId: carId,
    });

    return {
      status: 200,
      message: 'Car is succesfully deleted !',
    };
  }
  async findAll(filters: FilterCarsDto, userRole: UserRole) {
    const {
      minPrice,
      maxPrice,
      brand,
      search,
      carConditation,
      page = 1,
      limit = 10,
      status,
    } = filters;

    const skip = (page - 1) * limit;

    const statusFilter: Status | undefined =
      userRole === 'USER' ? Status.active : (status ?? undefined);

    const where: Prisma.CarWhereInput = {
      status: statusFilter,
      price: {
        gte: minPrice ?? undefined,
        lte: maxPrice ?? undefined,
      },
      brand: brand
        ? { contains: brand, mode: Prisma.QueryMode.insensitive }
        : undefined,
      title: search
        ? { contains: search, mode: Prisma.QueryMode.insensitive }
        : undefined,
      carConditation: carConditation ?? undefined,
    };

    const [total, cars] = await Promise.all([
      this.prisma.car.count({ where }),
      this.prisma.car.findMany({
        where,
        include: {
          category: true,
          installmentPlans: true,
          campaigns: {
            where: {
              status: Status.active,
              startDate: {
                lte: new Date(),
              },
              endDate: {
                gte: new Date(),
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
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
      data: cars,
    };
  }
  async findOne(id: number, userRole: UserRole) {
    const where: Prisma.CarWhereInput = {
      id,
      ...(userRole === 'USER' && { status: Status.active }),
    };

    const car = await this.prisma.car.findFirst({
      where,
      include: {
        category: true,
        reviews: {
          where: { status: Status.active },
          include: {
            user: {
              select: {
                id: true,
                name: true,
                avatarUrl: true,
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
        installmentPlans: true,
        campaigns: {
          where: {
            status: Status.active,
            startDate: {
              lte: new Date(),
            },
            endDate: {
              gte: new Date(),
            },
          },
        },
      },
    });

    if (!car) {
      throw new NotFoundException('Car not found');
    }

    return car;
  }
  async update(id: number, dto: UpdateCarDto, currentUser: AuthUser) {
    const car = await this.prisma.car.findUnique({
      where: { id },
    });

    if (!car) {
      throw new NotFoundException('Car not found');
    }

    if (dto.title && dto.title !== car.title) {
      const exists = await this.prisma.car.findUnique({
        where: { title: dto.title },
      });

      if (exists) {
        throw new ConflictException('Car title already exists');
      }
    }

    if (dto.categoryId) {
      const category = await this.prisma.carCategory.findUnique({
        where: { id: dto.categoryId },
      });

      if (!category || category.status !== Status.active) {
        throw new BadRequestException('Invalid category');
      }
    }

    const updateCar: Prisma.CarUpdateInput = {
      ...(dto.title && { title: dto.title }),
      ...(dto.brand && { brand: dto.brand }),
      ...(dto.price && { price: dto.price }),
      ...(dto.year && { year: dto.year }),
      ...(dto.mileage && { mileage: dto.mileage }),
      ...(dto.carConditation && { carConditation: dto.carConditation }),
      ...(dto.transmission && { transmission: dto.transmission }),
      ...(dto.engine && { engine: dto.engine }), // 🔥 endi enum
      ...(dto.description && { description: dto.description }),
      ...(dto.imageUrl && { imageUrl: dto.imageUrl }),
      ...(dto.status && { status: dto.status }),
      ...(dto.categoryId && {
        category: { connect: { id: dto.categoryId } },
      }),
    };

    const updated = await this.prisma.car.update({
      where: { id },
      data: updateCar,
    });

    return {
      status: 200,
      message: 'Car successfully updated',
      data: updated,
    };
  }
}
