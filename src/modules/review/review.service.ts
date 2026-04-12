import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Status, UserRole } from '@prisma/client';
import { PrismaService } from 'src/core/prisma/prisma.service';
import { CreateReviewDto } from './dto/create-review.dto';
import { QueryReviewDto } from './dto/query-review.dto';
import { UpdateReviewDto } from './dto/update-review.dto';

type AuthUser = {
  id: number;
  role: UserRole;
};

@Injectable()
export class ReviewService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateReviewDto, userId: number) {
    const car = await this.prisma.car.findFirst({
      where: {
        id: dto.carId,
        status: Status.active,
      },
    });

    if (!car) {
      throw new NotFoundException('Car not found');
    }

    return this.prisma.review.create({
      data: {
        userId,
        carId: dto.carId,
        rating: dto.rating,
        comment: dto.comment,
      },
      include: this.reviewInclude,
    });
  }

  async findMy(userId: number, query: QueryReviewDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const skip = (page - 1) * limit;
    const where = this.buildReviewWhere(query, { userId });

    const [total, reviews] = await Promise.all([
      this.prisma.review.count({ where }),
      this.prisma.review.findMany({
        where,
        include: this.reviewInclude,
        orderBy: {
          createdAt: 'desc',
        },
        skip,
        take: limit,
      }),
    ]);

    return {
      status: 200,
      data: reviews,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findAll(query: QueryReviewDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const skip = (page - 1) * limit;
    const where = this.buildReviewWhere(query);

    const [total, reviews] = await Promise.all([
      this.prisma.review.count({ where }),
      this.prisma.review.findMany({
        where,
        include: this.reviewInclude,
        orderBy: {
          createdAt: 'desc',
        },
        skip,
        take: limit,
      }),
    ]);

    return {
      status: 200,
      data: reviews,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async update(id: number, dto: UpdateReviewDto, currentUser: AuthUser) {
    const review = await this.getActiveReviewOrThrow(id);

    this.ensureReviewAccess(review.userId, currentUser);

    if (dto.rating === undefined && dto.comment === undefined) {
      throw new BadRequestException('Nothing to update');
    }

    return this.prisma.review.update({
      where: { id },
      data: {
        ...(dto.rating !== undefined && { rating: dto.rating }),
        ...(dto.comment !== undefined && { comment: dto.comment }),
      },
      include: this.reviewInclude,
    });
  }

  async remove(id: number, currentUser: AuthUser) {
    const review = await this.getActiveReviewOrThrow(id);

    this.ensureReviewAccess(review.userId, currentUser);

    return this.prisma.review.update({
      where: { id },
      data: {
        status: Status.deleted,
      },
    });
  }

  async findByCar(carId: number, query: QueryReviewDto) {
    await this.ensureCarExists(carId);

    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const skip = (page - 1) * limit;
    const where = this.buildReviewWhere(query, { carId });

    const [total, reviews] = await Promise.all([
      this.prisma.review.count({ where }),
      this.prisma.review.findMany({
        where,
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
        skip,
        take: limit,
      }),
    ]);

    return {
      status: 200,
      data: reviews,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getAverageRating(carId: number) {
    await this.ensureCarExists(carId);

    const stats = await this.prisma.review.aggregate({
      where: {
        carId,
        status: Status.active,
      },
      _avg: {
        rating: true,
      },
      _count: {
        rating: true,
      },
    });

    return {
      carId,
      averageRating: stats._avg.rating ?? 0,
      totalReviews: stats._count.rating,
    };
  }

  private readonly reviewInclude = {
    user: {
      select: {
        id: true,
        name: true,
        avatarUrl: true,
      },
    },
    car: {
      select: {
        id: true,
        title: true,
        brand: true,
        imageUrl: true,
      },
    },
  } as const;

  private async getActiveReviewOrThrow(id: number) {
    const review = await this.prisma.review.findFirst({
      where: {
        id,
        status: Status.active,
      },
    });

    if (!review) {
      throw new NotFoundException('Review not found');
    }

    return review;
  }

  private ensureReviewAccess(ownerId: number, currentUser: AuthUser) {
    const isAdmin =
      currentUser.role === UserRole.ADMIN ||
      currentUser.role === UserRole.SUPERADMIN;

    if (!isAdmin && ownerId !== currentUser.id) {
      throw new ForbiddenException('You can only manage your own reviews');
    }
  }

  private async ensureCarExists(carId: number) {
    const car = await this.prisma.car.findFirst({
      where: {
        id: carId,
        status: Status.active,
      },
      select: {
        id: true,
      },
    });

    if (!car) {
      throw new NotFoundException('Car not found');
    }
  }

  private buildReviewWhere(
    query: QueryReviewDto,
    extraWhere: Record<string, unknown> = {},
  ) {
    return {
      status: Status.active,
      ...(query.userId && { userId: query.userId }),
      ...(query.carId && { carId: query.carId }),
      ...(query.rating && { rating: query.rating }),
      ...(query.search && {
        comment: {
          contains: query.search,
          mode: 'insensitive' as const,
        },
      }),
      ...extraWhere,
    };
  }
}
