import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, Status, UserRole } from '@prisma/client';
import { PrismaService } from 'src/core/prisma/prisma.service';
import { AdminActionLogService } from '../admin-action-log/admin-action-log.service';
import { CreateDiscountCampaignDto } from './dto/create-discount-campaign.dto';
import {
  CampaignStateFilter,
  QueryDiscountCampaignDto,
} from './dto/query-discount-campaign.dto';
import { ManageCampaignCarDto } from './dto/manage-campaign-car.dto';
import { UpdateDiscountCampaignDto } from './dto/update-discount-campaign.dto';

type AuthUser = {
  id: number;
  role: UserRole;
};

type CampaignWithCars = Prisma.DiscountCampaignGetPayload<{
  include: {
    cars: {
      select: {
        id: true;
        title: true;
        brand: true;
        price: true;
        imageUrl: true;
        status: true;
      };
    };
  };
}>;

@Injectable()
export class DiscountCampaignService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly adminActionLogService: AdminActionLogService,
  ) {}

  async create(dto: CreateDiscountCampaignDto, currentUser: AuthUser) {
    this.validateDates(dto.startDate, dto.endDate);

    const campaign = await this.prisma.discountCampaign.create({
      data: {
        name: dto.name,
        description: dto.description,
        discount: dto.discount,
        startDate: dto.startDate,
        endDate: dto.endDate,
        status: this.resolvePersistedStatus(dto.endDate),
      },
      include: this.campaignInclude,
    });

    await this.adminActionLogService.createLog({
      adminId: currentUser.id,
      action: 'CREATE_CAMPAIGN',
      entity: 'DISCOUNT_CAMPAIGN',
      entityId: campaign.id,
    });

    return this.serializeCampaign(campaign);
  }

  async findAll(query: QueryDiscountCampaignDto) {
    await this.syncExpiredCampaigns();

    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const skip = (page - 1) * limit;
    const where = this.buildCampaignWhere(query);

    const [total, campaigns] = await Promise.all([
      this.prisma.discountCampaign.count({ where }),
      this.prisma.discountCampaign.findMany({
        where,
        include: this.campaignInclude,
        orderBy: {
          id: 'desc',
        },
        skip,
        take: limit,
      }),
    ]);

    return {
      status: 200,
      data: campaigns.map((campaign) => this.serializeCampaign(campaign)),
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: number) {
    const campaign = await this.getCampaignOrThrow(id);
    const syncedCampaign = await this.syncCampaignStatus(campaign);

    return this.serializeCampaign(syncedCampaign);
  }

  async update(
    id: number,
    dto: UpdateDiscountCampaignDto,
    currentUser: AuthUser,
  ) {
    const campaign = await this.getCampaignOrThrow(id);

    const nextStartDate = dto.startDate ?? campaign.startDate;
    const nextEndDate = dto.endDate ?? campaign.endDate;

    this.validateDates(nextStartDate, nextEndDate);

    const updatedCampaign = await this.prisma.discountCampaign.update({
      where: { id },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.discount !== undefined && { discount: dto.discount }),
        ...(dto.startDate !== undefined && { startDate: dto.startDate }),
        ...(dto.endDate !== undefined && { endDate: dto.endDate }),
        status: this.resolvePersistedStatus(nextEndDate),
      },
      include: this.campaignInclude,
    });

    await this.adminActionLogService.createLog({
      adminId: currentUser.id,
      action: 'UPDATE_CAMPAIGN',
      entity: 'DISCOUNT_CAMPAIGN',
      entityId: updatedCampaign.id,
    });

    return this.serializeCampaign(updatedCampaign);
  }

  async remove(id: number, currentUser: AuthUser) {
    const campaign = await this.getCampaignOrThrow(id);

    const deletedCampaign = await this.prisma.discountCampaign.update({
      where: { id },
      data: {
        status: Status.deleted,
      },
      include: this.campaignInclude,
    });

    await this.adminActionLogService.createLog({
      adminId: currentUser.id,
      action: 'DELETE_CAMPAIGN',
      entity: 'DISCOUNT_CAMPAIGN',
      entityId: campaign.id,
    });

    return this.serializeCampaign(deletedCampaign);
  }

  async attachCar(
    id: number,
    dto: ManageCampaignCarDto,
    currentUser: AuthUser,
  ) {
    const campaign = await this.syncCampaignStatus(
      await this.getCampaignOrThrow(id),
    );

    if (campaign.status === Status.blocked) {
      throw new BadRequestException('Expired campaign cannot be modified');
    }

    const car = await this.prisma.car.findFirst({
      where: {
        id: dto.carId,
        status: Status.active,
      },
      select: {
        id: true,
      },
    });

    if (!car) {
      throw new NotFoundException('Car not found');
    }

    const alreadyAttached = campaign.cars.some(
      (existingCar) => existingCar.id === dto.carId,
    );
    if (alreadyAttached) {
      throw new ConflictException('Car is already attached to this campaign');
    }

    const updatedCampaign = await this.prisma.discountCampaign.update({
      where: { id },
      data: {
        cars: {
          connect: {
            id: dto.carId,
          },
        },
      },
      include: this.campaignInclude,
    });

    await this.adminActionLogService.createLog({
      adminId: currentUser.id,
      action: 'ATTACH_CAMPAIGN_CAR',
      entity: 'DISCOUNT_CAMPAIGN',
      entityId: updatedCampaign.id,
    });

    return this.serializeCampaign(updatedCampaign);
  }

  async removeCar(
    id: number,
    dto: ManageCampaignCarDto,
    currentUser: AuthUser,
  ) {
    const campaign = await this.getCampaignOrThrow(id);

    const hasCar = campaign.cars.some(
      (existingCar) => existingCar.id === dto.carId,
    );
    if (!hasCar) {
      throw new NotFoundException('Car is not attached to this campaign');
    }

    const updatedCampaign = await this.prisma.discountCampaign.update({
      where: { id },
      data: {
        cars: {
          disconnect: {
            id: dto.carId,
          },
        },
      },
      include: this.campaignInclude,
    });

    await this.adminActionLogService.createLog({
      adminId: currentUser.id,
      action: 'REMOVE_CAMPAIGN_CAR',
      entity: 'DISCOUNT_CAMPAIGN',
      entityId: updatedCampaign.id,
    });

    return this.serializeCampaign(updatedCampaign);
  }

  private readonly campaignInclude = {
    cars: {
      where: {
        status: Status.active,
      },
      select: {
        id: true,
        title: true,
        brand: true,
        price: true,
        imageUrl: true,
        status: true,
      },
    },
  } as const;

  private async getCampaignOrThrow(id: number): Promise<CampaignWithCars> {
    const campaign = await this.prisma.discountCampaign.findFirst({
      where: {
        id,
        NOT: {
          status: Status.deleted,
        },
      },
      include: this.campaignInclude,
    });

    if (!campaign) {
      throw new NotFoundException('Campaign not found');
    }

    return campaign;
  }

  private async syncExpiredCampaigns() {
    await this.prisma.discountCampaign.updateMany({
      where: {
        status: Status.active,
        endDate: {
          lt: new Date(),
        },
      },
      data: {
        status: Status.blocked,
      },
    });
  }

  private async syncCampaignStatus(campaign: CampaignWithCars) {
    const now = new Date();

    if (campaign.status === Status.active && campaign.endDate < now) {
      return this.prisma.discountCampaign.update({
        where: { id: campaign.id },
        data: {
          status: Status.blocked,
        },
        include: this.campaignInclude,
      });
    }

    if (campaign.status === Status.blocked && campaign.endDate >= now) {
      return this.prisma.discountCampaign.update({
        where: { id: campaign.id },
        data: {
          status: Status.active,
        },
        include: this.campaignInclude,
      });
    }

    return campaign;
  }

  private serializeCampaign(campaign: CampaignWithCars) {
    const state = this.getCampaignState(campaign);

    return {
      ...campaign,
      state,
      isActive: state === CampaignStateFilter.ACTIVE,
    };
  }

  private getCampaignState(campaign: CampaignWithCars) {
    const now = new Date();

    if (campaign.status === Status.deleted) {
      return 'deleted';
    }

    if (campaign.status === Status.blocked || campaign.endDate < now) {
      return CampaignStateFilter.EXPIRED;
    }

    if (campaign.startDate > now) {
      return CampaignStateFilter.UPCOMING;
    }

    return CampaignStateFilter.ACTIVE;
  }

  private resolvePersistedStatus(endDate: Date) {
    return endDate < new Date() ? Status.blocked : Status.active;
  }

  private validateDates(startDate: Date, endDate: Date) {
    if (endDate <= startDate) {
      throw new BadRequestException('endDate must be later than startDate');
    }
  }

  private buildCampaignWhere(
    query: QueryDiscountCampaignDto,
  ): Prisma.DiscountCampaignWhereInput {
    const filters: Prisma.DiscountCampaignWhereInput[] = [
      {
        NOT: {
          status: Status.deleted,
        },
      },
    ];

    if (query.search) {
      filters.push({
        OR: [
          {
            name: {
              contains: query.search,
              mode: Prisma.QueryMode.insensitive,
            },
          },
          {
            description: {
              contains: query.search,
              mode: Prisma.QueryMode.insensitive,
            },
          },
        ],
      });
    }

    if (query.carId) {
      filters.push({
        cars: {
          some: {
            id: query.carId,
            status: Status.active,
          },
        },
      });
    }

    const now = new Date();
    const state = query.state ?? CampaignStateFilter.ALL;

    if (state === CampaignStateFilter.ACTIVE) {
      filters.push({ status: Status.active });
      filters.push({ startDate: { lte: now } });
      filters.push({ endDate: { gte: now } });
    }

    if (state === CampaignStateFilter.UPCOMING) {
      filters.push({ status: Status.active });
      filters.push({ startDate: { gt: now } });
    }

    if (state === CampaignStateFilter.EXPIRED) {
      filters.push({
        OR: [
          { status: Status.blocked },
          {
            AND: [{ status: Status.active }, { endDate: { lt: now } }],
          },
        ],
      });
    }

    return { AND: filters };
  }
}
