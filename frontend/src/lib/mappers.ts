import type {
  AdminActionLogEntry,
  CampaignState,
  Car,
  CarCondition,
  DashboardStats,
  DiscountCampaign,
  InstallmentPlan,
  Order,
  PaginationMeta,
  PaymentHistory,
  Review,
  User,
} from '../types';

const FALLBACK_CAR_IMAGE =
  'https://images.unsplash.com/photo-1553440569-bcc63803a83d?q=80&w=1200&auto=format&fit=crop';

const PLAN_MONTH_MAP: Record<string, number> = {
  ONE: 1,
  THREE: 3,
  SIX: 6,
  NINE: 9,
  TWELVE: 12,
  TWENTY_FOUR: 24,
};

const CONDITION_MAP: Record<string, CarCondition> = {
  NEW: 'New',
  USED: 'Used',
  CERTIFIED: 'Certified',
};

const ENTITY_LABELS: Record<string, string> = {
  CAR: 'Car',
  ORDER: 'Order',
  USER: 'User',
  PLAN: 'Plan',
  DISCOUNT_CAMPAIGN: 'Campaign',
};

export const CONDITION_TO_API: Record<CarCondition, string> = {
  New: 'NEW',
  Used: 'USED',
  Certified: 'CERTIFIED',
};

export const TRANSMISSION_TO_API: Record<string, string> = {
  Automatic: 'AUTOMATIC',
  Manual: 'MANUAL',
  AUTOMATIC: 'AUTOMATIC',
  MANUAL: 'MANUAL',
};

export const ENGINE_TO_API: Record<string, string> = {
  Petrol: 'PETROL',
  Diesel: 'DIESEL',
  Electric: 'ELECTRIC',
  Hybrid: 'HYBRID',
  PETROL: 'PETROL',
  DIESEL: 'DIESEL',
  ELECTRIC: 'ELECTRIC',
  HYBRID: 'HYBRID',
};

export function buildAvatarUrl(name?: string, avatarUrl?: string | null) {
  if (avatarUrl) {
    return avatarUrl;
  }

  const safeName = encodeURIComponent(name || 'User');
  return `https://ui-avatars.com/api/?name=${safeName}&background=4F46E5&color=fff`;
}

export function toDateInputValue(value?: string | Date | null) {
  if (!value) {
    return '';
  }

  return new Date(value).toISOString().split('T')[0];
}

export function toIsoDate(value: string, endOfDay = false) {
  const suffix = endOfDay ? 'T23:59:59.999Z' : 'T00:00:00.000Z';
  return value.includes('T') ? value : `${value}${suffix}`;
}

export function formatDisplayDate(value?: string | Date | null) {
  if (!value) {
    return '';
  }

  return new Date(value).toISOString().split('T')[0];
}

function titleCaseEnum(value?: string | null) {
  if (!value) {
    return '';
  }

  return value
    .toLowerCase()
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function resolveCampaignState(raw: Record<string, any>): CampaignState {
  if (raw.state) {
    return raw.state as CampaignState;
  }

  if (raw.status === 'deleted') {
    return 'deleted';
  }

  const now = Date.now();
  const start = raw.startDate ? new Date(raw.startDate).getTime() : now;
  const end = raw.endDate ? new Date(raw.endDate).getTime() : now;

  if (raw.status === 'blocked' || end < now) {
    return 'expired';
  }

  if (start > now) {
    return 'upcoming';
  }

  return 'active';
}

function resolveCampaignCars(rawCars: any[] | undefined) {
  return (rawCars || []).map((car) => ({
    id: String(car.id),
    title: car.title,
    image: car.imageUrl || FALLBACK_CAR_IMAGE,
  }));
}

export function mapUser(raw: Record<string, any>): User {
  return {
    id: String(raw.id),
    name: raw.name || 'Unknown User',
    email: raw.email || '',
    phone: raw.phone || '',
    role: raw.role || 'USER',
    avatarUrl: buildAvatarUrl(raw.name, raw.avatarUrl),
    status: raw.status,
    createdAt: formatDisplayDate(raw.createdAt),
  };
}

export function mapInstallmentPlan(raw: Record<string, any>): InstallmentPlan {
  const months = PLAN_MONTH_MAP[raw.months] ?? Number(raw.months) ?? 0;

  return {
    id: String(raw.id),
    carId: String(raw.carId ?? raw.car?.id ?? ''),
    carTitle: raw.car?.title,
    months,
    monthsLabel: months ? `${months} months` : titleCaseEnum(raw.months),
    interest: Number(raw.interest ?? 0),
    discount: Number(raw.discount ?? 0),
    tag:
      Number(raw.interest ?? 0) === 0
        ? '0% APR'
        : Number(raw.discount ?? 0) > 0
          ? `${Number(raw.discount)}% off`
          : '',
    isActive: raw.status !== 'deleted',
    status: raw.status ?? 'active',
  };
}

export function mapCampaign(raw: Record<string, any>): DiscountCampaign {
  const cars = resolveCampaignCars(raw.cars);
  const state = resolveCampaignState(raw);

  return {
    id: String(raw.id),
    name: raw.name,
    description: raw.description || '',
    discount: Number(raw.discount ?? 0),
    startDate: toDateInputValue(raw.startDate),
    endDate: toDateInputValue(raw.endDate),
    isActive: state === 'active',
    state,
    carIds: cars.map((car) => car.id),
    cars,
    status: raw.status ?? 'active',
  };
}

export function mapReview(raw: Record<string, any>): Review {
  const userName = raw.user?.name || raw.userName || 'Anonymous';

  return {
    id: String(raw.id),
    userId: String(raw.userId ?? raw.user?.id ?? ''),
    userName,
    userAvatar: buildAvatarUrl(userName, raw.user?.avatarUrl ?? raw.userAvatar),
    carId: String(raw.carId ?? raw.car?.id ?? ''),
    carTitle: raw.car?.title ?? raw.carTitle ?? '',
    rating: Number(raw.rating ?? 0),
    comment: raw.comment || '',
    date: formatDisplayDate(raw.createdAt ?? raw.date),
  };
}

export function mapPayment(raw: Record<string, any>): PaymentHistory {
  return {
    id: String(raw.id),
    orderId: String(raw.orderId ?? raw.order?.id ?? ''),
    amount: Number(raw.amount ?? 0),
    paidAt: formatDisplayDate(raw.paidAt),
    status: raw.status ?? 'active',
    orderTitle: raw.order?.car?.title ?? raw.orderTitle,
    userName: raw.order?.user?.name ?? raw.userName,
  };
}

export function mapOrder(raw: Record<string, any>): Order {
  return {
    id: String(raw.id),
    userId: String(raw.userId ?? raw.user?.id ?? ''),
    userName: raw.user?.name ?? raw.userName ?? 'Unknown User',
    carId: String(raw.carId ?? raw.car?.id ?? ''),
    carTitle: raw.car?.title ?? raw.carTitle ?? 'Unknown Car',
    carImage: raw.car?.imageUrl || FALLBACK_CAR_IMAGE,
    price: Number(raw.totalPrice ?? raw.price ?? raw.basePrice ?? 0),
    status: raw.orderStatus ?? raw.status ?? 'PENDING',
    paymentStatus: raw.paymentStatus,
    date: formatDisplayDate(raw.createdAt ?? raw.date),
    orderType: raw.orderType,
    installmentPlanId: raw.planId ? String(raw.planId) : undefined,
    installmentMonths: raw.plan?.months
      ? PLAN_MONTH_MAP[raw.plan.months] ?? undefined
      : undefined,
    installmentInterest: raw.interest !== undefined ? Number(raw.interest) : undefined,
    monthlyPayment: raw.monthlyPay !== undefined ? Number(raw.monthlyPay) : undefined,
    payments: Array.isArray(raw.payments) ? raw.payments.map(mapPayment) : [],
    basePrice: raw.basePrice !== undefined ? Number(raw.basePrice) : undefined,
    discount: raw.discount !== undefined ? Number(raw.discount) : undefined,
    interest: raw.interest !== undefined ? Number(raw.interest) : undefined,
  };
}

export function mapCar(raw: Record<string, any>): Car {
  const campaigns = Array.isArray(raw.campaigns) ? raw.campaigns.map(mapCampaign) : [];
  const reviews = Array.isArray(raw.reviews) ? raw.reviews.map(mapReview) : [];
  const averageRating = reviews.length
    ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length
    : 0;

  return {
    id: String(raw.id),
    title: raw.title,
    brand: raw.brand,
    price: Number(raw.price ?? 0),
    image: raw.imageUrl || FALLBACK_CAR_IMAGE,
    images: raw.imageUrl ? [raw.imageUrl] : [FALLBACK_CAR_IMAGE],
    description: raw.description || '',
    year: Number(raw.year ?? 0),
    mileage: Number(raw.mileage ?? 0),
    condition: CONDITION_MAP[raw.carConditation] ?? 'Used',
    discount: campaigns.length
      ? Math.max(...campaigns.map((campaign) => campaign.discount))
      : undefined,
    category: raw.category?.name,
    engine: titleCaseEnum(raw.engine),
    transmission: titleCaseEnum(raw.transmission),
    status: raw.status ?? 'active',
    installmentPlans: Array.isArray(raw.installmentPlans)
      ? raw.installmentPlans.map(mapInstallmentPlan)
      : [],
    campaigns,
    averageRating,
    reviewCount: reviews.length,
  };
}

export function mapAdminActionLog(raw: Record<string, any>): AdminActionLogEntry {
  const action = titleCaseEnum(raw.action);
  const entity = ENTITY_LABELS[raw.entity] ?? titleCaseEnum(raw.entity);

  return {
    id: String(raw.id),
    adminId: String(raw.adminId ?? raw.admin?.id ?? ''),
    adminName: raw.admin?.name ?? 'Admin',
    adminAvatarUrl: buildAvatarUrl(raw.admin?.name, raw.admin?.avatarUrl),
    action: raw.action ?? '',
    targetType: entity || raw.targetType || 'Entity',
    targetId: String(raw.entityId ?? raw.targetId ?? ''),
    timestamp: raw.createdAt ?? raw.timestamp ?? new Date().toISOString(),
    details:
      raw.details ||
      `${action || 'Updated'} ${entity || 'record'} #${raw.entityId ?? raw.targetId ?? raw.id}`,
  };
}

export function mapStats(raw: Record<string, any>): DashboardStats {
  const data = raw.data ?? raw;

  return {
    cars: Number(data.cars ?? 0),
    orders: Number(data.orders ?? 0),
    users: Number(data.users ?? 0),
    revenue: Number(data.revenue ?? 0),
    generatedAt: data.generatedAt,
    lastCalculated: raw.lastCalculated,
    fromCache: Boolean(raw.fromCache),
  };
}

export function extractListData<T>(
  response: Record<string, any>,
  mapper: (item: Record<string, any>) => T,
) {
  const rawItems = Array.isArray(response) ? response : (response.data || []);
  const items = rawItems.map((item: Record<string, any>) => mapper(item));
  const pagination = extractPagination(response);

  return { items, pagination };
}

export function extractPagination(response: Record<string, any>): PaginationMeta | undefined {
  if (response.pagination) {
    return response.pagination as PaginationMeta;
  }

  if (response.page || response.limit || response.totalPages || response.total) {
    return {
      total: response.total,
      page: response.page,
      limit: response.limit ?? 10,
      totalPages: response.totalPages,
    };
  }

  return undefined;
}
