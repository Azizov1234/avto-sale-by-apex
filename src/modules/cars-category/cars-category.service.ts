import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateCarsCategoryDto } from './dto/create-cars-category.dto';
import { UpdateCarsCategoryDto } from './dto/update-cars-category.dto';
import { PrismaService } from 'src/core/prisma/prisma.service';
import { QueryCategoryDto } from './dto/query.dto';
import { UserRole } from '@prisma/client';

@Injectable()
export class CarsCategoryService {
  constructor(private readonly prisma: PrismaService) {}
  async create(dto: CreateCarsCategoryDto) {
    const exist = await this.prisma.carCategory.findFirst({
      where: {
        name: dto.name,
        status: 'active',
      },
    });

    if (exist) {
      throw new BadRequestException('Category already exists');
    }

    const category = await this.prisma.carCategory.create({
      data: {
        name: dto.name,
      },
    });

    return {
      status: 200,
      message: 'Category created successfully',
    };
  }
  async delete(id: number) {
    const category = await this.prisma.carCategory.findFirst({
      where: {
        id,
        status: 'active',
      },
    });

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    const hasCars = await this.prisma.car.count({
      where: {
        categoryId: id,
        status: 'active',
      },
    });

    if (hasCars > 0) {
      throw new BadRequestException('Cannot delete category with active cars');
    }

    await this.prisma.carCategory.update({
      where: { id },
      data: {
        status: 'deleted',
      },
    });

    return {
      status: 200,
      message: 'Category deleted (soft) successfully',
    };
  }
  async update(id: number, dto: UpdateCarsCategoryDto) {
    const category = await this.prisma.carCategory.findFirst({
      where: {
        id,
        status: 'active',
      },
    });

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    if (dto.name) {
      const exist = await this.prisma.carCategory.findFirst({
        where: {
          name: dto.name,
          status: 'active',
          NOT: { id },
        },
      });

      if (exist) {
        throw new BadRequestException('Category already exists');
      }
    }

    const updated = await this.prisma.carCategory.update({
      where: { id },
      data: dto,
    });

    return {
      message: 'Category updated successfully',
      data: updated,
    };
  }
  async findAll(role: string, query?: QueryCategoryDto) {
    const page = Number(query?.page) || 1;
    const limit = Number(query?.limit) || 10;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (role === UserRole.USER) {
      where.status = 'active';
    } else if (query?.status) {
      where.status = query.status;
    }

    if (query?.name) {
      where.name = {
        contains: query.name,
        mode: 'insensitive',
      };
    }

    const [data, total] = await Promise.all([
      this.prisma.carCategory.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.carCategory.count({ where }),
    ]);

    return {
      data,
      meta: {
        total,
        page,
        limit,
        lastPage: Math.ceil(total / limit),
      },
    };
  }
  async findOne(id: number) {
    const category = await this.prisma.carCategory.findFirst({
      where: {
        id,
        status: 'active',
      },
      include: {
        _count: {
          select: {
            cars: {
              where: {
                status: 'active',
              },
            },
          },
        },
      },
    });

    if (!category) {
      throw new NotFoundException('Category not found');
    }
    const data = {
      id: category.id,
      name: category.name,
      createdAt: category.createdAt,
      carCount: category._count.cars,
    };

    return {
      status: 200,
      data,
    };
  }
  async findCategoryAllCars(id: number) {
    const category = await this.prisma.carCategory.findFirst({
      where: {
        id,
        status: 'active',
      },
    });

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    const cars = await this.prisma.car.findMany({
      where: {
        categoryId: id,
        status: 'active',
      },
      select: {
        id: true,
        title: true,
        brand: true,
        price: true,
        year: true,
        mileage: true,
        imageUrl: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return {
      category: {
        id: category.id,
        name: category.name,
      },
      cars,
    };
  }
}
