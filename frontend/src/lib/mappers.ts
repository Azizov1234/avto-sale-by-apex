import type {
  AdminActionLogEntry,
  CampaignState,
  Car,
  CarCategory,
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

type ApiRecord = Record<string, unknown>;

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

const AVATAR_GRADIENTS = [
  ['#0f172a', '#2563eb'],
  ['#14532d', '#16a34a'],
  ['#7c2d12', '#ea580c'],
  ['#581c87', '#9333ea'],
];

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

function asRecord(value: unknown): ApiRecord {
  return value && typeof value === 'object' ? (value as ApiRecord) : {};
}

function asRecordArray(value: unknown): ApiRecord[] {
  return Array.isArray(value)
    ? value.filter((item): item is ApiRecord => Boolean(item) && typeof item === 'object')
    : [];
}

function asString(value: unknown, fallback = '') {
  return typeof value === 'string' ? value : fallback;
}

function asNumber(value: unknown, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function getInitials(name?: string) {
  const source = (name || 'User').trim();
  const parts = source.split(/\s+/).filter(Boolean).slice(0, 2);
  return parts.map((part) => part.charAt(0).toUpperCase()).join('') || 'U';
}

function pickAvatarGradient(seed: string) {
  const hash = Array.from(seed).reduce((total, char) => total + char.charCodeAt(0), 0);
  return AVATAR_GRADIENTS[hash % AVATAR_GRADIENTS.length];
}

export function buildAvatarUrl(name?: string, avatarUrl?: string | null) {
  if (avatarUrl && avatarUrl.trim()) {
    return avatarUrl;
  }

  const initials = getInitials(name);
  const [startColor, endColor] = pickAvatarGradient(name || initials);
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="128" height="128" viewBox="0 0 128 128" role="img" aria-label="${initials}">
      <defs>
        <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="${startColor}" />
          <stop offset="100%" stop-color="${endColor}" />
        </linearGradient>
      </defs>
      <rect width="128" height="128" rx="32" fill="url(#bg)" />
      <text x="50%" y="54%" text-anchor="middle" dominant-baseline="middle" font-family="Arial, sans-serif" font-size="44" font-weight="700" fill="#ffffff">
        ${initials}
      </text>
    </svg>
  `.replace(/\s+/g, ' ').trim();

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
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

function resolveCampaignState(raw: ApiRecord): CampaignState {
  const state = asString(raw.state);

  if (state) {
    return state as CampaignState;
  }

  if (raw.status === 'deleted') {
    return 'deleted';
  }

  const now = Date.now();
  const start = raw.startDate ? new Date(String(raw.startDate)).getTime() : now;
  const end = raw.endDate ? new Date(String(raw.endDate)).getTime() : now;

  if (raw.status === 'blocked' || end < now) {
    return 'expired';
  }

  if (start > now) {
    return 'upcoming';
  }

  return 'active';
}

function resolveCampaignCars(rawCars: ApiRecord[]) {
  return rawCars.map((car) => ({
    id: String(car.id ?? ''),
    title: asString(car.title, 'Untitled Car'),
    image: asString(car.imageUrl) || FALLBACK_CAR_IMAGE,
  }));
}

export function mapCategory(raw: ApiRecord): CarCategory {
  const count = raw.carCount ?? asRecord(raw._count).cars;

  return {
    id: String(raw.id ?? ''),
    name: asString(raw.name, 'Uncategorized'),
    status: asString(raw.status) as CarCategory['status'],
    carCount: count !== undefined ? asNumber(count) : undefined,
  };
}

export function mapUser(raw: ApiRecord): User {
  const name = asString(raw.name, 'Unknown User');

  return {
    id: String(raw.id ?? ''),
    name,
    email: asString(raw.email),
    phone: asString(raw.phone),
    role: asString(raw.role, 'USER') as User['role'],
    avatarUrl: buildAvatarUrl(name, asString(raw.avatarUrl)),
    status: asString(raw.status) as User['status'],
    createdAt: formatDisplayDate(asString(raw.createdAt)),
  };
}

export function mapInstallmentPlan(raw: ApiRecord): InstallmentPlan {
  const car = asRecord(raw.car);
  const rawMonths = asString(raw.months);
  const months = PLAN_MONTH_MAP[rawMonths] ?? asNumber(raw.months);
  const discount = asNumber(raw.discount);
  const interest = asNumber(raw.interest);

  return {
    id: String(raw.id ?? ''),
    carId: String(raw.carId ?? car.id ?? ''),
    carTitle: asString(car.title),
    months,
    monthsLabel: months ? `${months} months` : titleCaseEnum(rawMonths),
    interest,
    discount,
    tag: interest === 0 ? '0% APR' : discount > 0 ? `${discount}% off` : '',
    isActive: raw.status !== 'deleted',
    status: asString(raw.status, 'active') as InstallmentPlan['status'],
  };
}

export function mapCampaign(raw: ApiRecord): DiscountCampaign {
  const cars = resolveCampaignCars(asRecordArray(raw.cars));
  const state = resolveCampaignState(raw);

  return {
    id: String(raw.id ?? ''),
    name: asString(raw.name, 'Unnamed Campaign'),
    description: asString(raw.description),
    discount: asNumber(raw.discount),
    startDate: toDateInputValue(asString(raw.startDate)),
    endDate: toDateInputValue(asString(raw.endDate)),
    isActive: state === 'active',
    state,
    carIds: cars.map((car) => car.id),
    cars,
    status: asString(raw.status, 'active') as DiscountCampaign['status'],
  };
}

export function mapReview(raw: ApiRecord): Review {
  const user = asRecord(raw.user);
  const car = asRecord(raw.car);
  const userName = asString(user.name) || asString(raw.userName, 'Anonymous');

  return {
    id: String(raw.id ?? ''),
    userId: String(raw.userId ?? user.id ?? ''),
    userName,
    userAvatar: buildAvatarUrl(
      userName,
      asString(user.avatarUrl) || asString(raw.userAvatar),
    ),
    carId: String(raw.carId ?? car.id ?? ''),
    carTitle: asString(car.title) || asString(raw.carTitle),
    rating: asNumber(raw.rating),
    comment: asString(raw.comment),
    date: formatDisplayDate(asString(raw.createdAt) || asString(raw.date)),
  };
}

export function mapPayment(raw: ApiRecord): PaymentHistory {
  const order = asRecord(raw.order);
  const car = asRecord(order.car);
  const user = asRecord(order.user);

  return {
    id: String(raw.id ?? ''),
    orderId: String(raw.orderId ?? order.id ?? ''),
    amount: asNumber(raw.amount),
    paidAt: formatDisplayDate(asString(raw.paidAt)),
    status: asString(raw.status, 'active') as PaymentHistory['status'],
    orderTitle: asString(car.title) || asString(raw.orderTitle),
    userName: asString(user.name) || asString(raw.userName),
  };
}

export function mapOrder(raw: ApiRecord): Order {
  const user = asRecord(raw.user);
  const car = asRecord(raw.car);
  const plan = asRecord(raw.plan);

  return {
    id: String(raw.id ?? ''),
    userId: String(raw.userId ?? user.id ?? ''),
    userName: asString(user.name) || asString(raw.userName, 'Unknown User'),
    carId: String(raw.carId ?? car.id ?? ''),
    carTitle: asString(car.title) || asString(raw.carTitle, 'Unknown Car'),
    carImage: asString(car.imageUrl) || FALLBACK_CAR_IMAGE,
    price: asNumber(raw.totalPrice ?? raw.price ?? raw.basePrice),
    status: asString(raw.orderStatus || raw.status, 'PENDING') as Order['status'],
    paymentStatus: asString(raw.paymentStatus),
    date: formatDisplayDate(asString(raw.createdAt) || asString(raw.date)),
    orderType: asString(raw.orderType) as Order['orderType'],
    installmentPlanId: raw.planId ? String(raw.planId) : undefined,
    installmentMonths: plan.months
      ? PLAN_MONTH_MAP[asString(plan.months)] ?? undefined
      : undefined,
    installmentInterest: raw.interest !== undefined ? asNumber(raw.interest) : undefined,
    monthlyPayment: raw.monthlyPay !== undefined ? asNumber(raw.monthlyPay) : undefined,
    payments: asRecordArray(raw.payments).map(mapPayment),
    basePrice: raw.basePrice !== undefined ? asNumber(raw.basePrice) : undefined,
    discount: raw.discount !== undefined ? asNumber(raw.discount) : undefined,
    interest: raw.interest !== undefined ? asNumber(raw.interest) : undefined,
  };
}

export function mapCar(raw: ApiRecord): Car {
  const category = asRecord(raw.category);
  const campaigns = asRecordArray(raw.campaigns).map(mapCampaign);
  const reviews = asRecordArray(raw.reviews).map(mapReview);
  const imageUrl = asString(raw.imageUrl);
  const averageRating = reviews.length
    ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length
    : 0;

  return {
    id: String(raw.id ?? ''),
    title: asString(raw.title, 'Untitled Car'),
    brand: asString(raw.brand, 'Unknown Brand'),
    price: asNumber(raw.price),
    image: imageUrl || FALLBACK_CAR_IMAGE,
    images: imageUrl ? [imageUrl] : [FALLBACK_CAR_IMAGE],
    description: asString(raw.description),
    year: asNumber(raw.year),
    mileage: asNumber(raw.mileage),
    condition: CONDITION_MAP[asString(raw.carConditation)] ?? 'Used',
    discount: campaigns.length
      ? Math.max(...campaigns.map((campaign) => campaign.discount))
      : undefined,
    category: asString(category.name),
    categoryId: raw.categoryId !== undefined
      ? String(raw.categoryId)
      : category.id
        ? String(category.id)
        : undefined,
    engine: titleCaseEnum(asString(raw.engine)),
    transmission: titleCaseEnum(asString(raw.transmission)),
    status: asString(raw.status, 'active') as Car['status'],
    installmentPlans: asRecordArray(raw.installmentPlans).map(mapInstallmentPlan),
    campaigns,
    averageRating,
    reviewCount: reviews.length,
  };
}

export function mapAdminActionLog(raw: ApiRecord): AdminActionLogEntry {
  const admin = asRecord(raw.admin);
  const rawEntity = asString(raw.entity);
  const action = titleCaseEnum(asString(raw.action));
  const entity = ENTITY_LABELS[rawEntity] ?? titleCaseEnum(rawEntity);

  return {
    id: String(raw.id ?? ''),
    adminId: String(raw.adminId ?? admin.id ?? ''),
    adminName: asString(admin.name, 'Admin'),
    adminAvatarUrl: buildAvatarUrl(
      asString(admin.name, 'Admin'),
      asString(admin.avatarUrl),
    ),
    action: asString(raw.action),
    targetType: entity || asString(raw.targetType, 'Entity'),
    targetId: String(raw.entityId ?? raw.targetId ?? ''),
    timestamp: asString(raw.createdAt) || asString(raw.timestamp) || new Date().toISOString(),
    details:
      asString(raw.details) ||
      `${action || 'Updated'} ${entity || 'record'} #${raw.entityId ?? raw.targetId ?? raw.id}`,
  };
}

export function mapStats(raw: ApiRecord): DashboardStats {
  const data = asRecord(raw.data ?? raw);

  return {
    cars: asNumber(data.cars),
    orders: asNumber(data.orders),
    users: asNumber(data.users),
    revenue: asNumber(data.revenue),
    generatedAt: asString(data.generatedAt),
    lastCalculated: asString(raw.lastCalculated),
    fromCache: Boolean(raw.fromCache),
  };
}

export function extractListData<T>(
  response: ApiRecord | ApiRecord[],
  mapper: (item: ApiRecord) => T,
) {
  const rawItems = Array.isArray(response) ? response : asRecordArray(response.data);
  const items = rawItems.map((item) => mapper(item));
  const pagination = extractPagination(response);

  return { items, pagination };
}

export function extractPagination(
  response: ApiRecord | ApiRecord[],
): PaginationMeta | undefined {
  if (Array.isArray(response)) {
    return undefined;
  }

  if (response.pagination && typeof response.pagination === 'object') {
    return response.pagination as PaginationMeta;
  }

  if (response.page || response.limit || response.totalPages || response.total) {
    return {
      total: asNumber(response.total),
      page: asNumber(response.page),
      limit: asNumber(response.limit, 10),
      totalPages: asNumber(response.totalPages),
    };
  }

  return undefined;
}
