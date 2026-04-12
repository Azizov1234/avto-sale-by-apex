export type UserRole = 'USER' | 'ADMIN' | 'SUPERADMIN';
export type EntityStatus = 'active' | 'deleted' | 'blocked';
export type OrderStatus = 'PENDING' | 'CONFIRMED' | 'DELIVERED' | 'CANCELLED';
export type OrderType = 'FULL_PAYMENT' | 'INSTALLMENT' | 'TRADE_IN';
export type CarCondition = 'New' | 'Used' | 'Certified';
export type CampaignState = 'active' | 'expired' | 'upcoming' | 'deleted';

export interface PaginationMeta {
  total?: number;
  totalCount?: number;
  page?: number;
  currentPage?: number;
  limit: number;
  totalPages?: number;
}

export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: UserRole;
  avatarUrl?: string;
  status?: EntityStatus;
  createdAt?: string;
}

export interface InstallmentPlan {
  id: string;
  carId: string;
  carTitle?: string;
  months: number;
  monthsLabel?: string;
  interest: number;
  discount: number;
  tag?: string;
  isActive: boolean;
  status?: EntityStatus;
}

export interface DiscountCampaign {
  id: string;
  name: string;
  discount: number;
  startDate: string;
  endDate: string;
  isActive: boolean;
  state: CampaignState;
  carIds: string[];
  description?: string;
  status?: EntityStatus;
  cars?: Array<{
    id: string;
    title: string;
    image: string;
  }>;
}

export interface Car {
  id: string;
  title: string;
  brand: string;
  price: number;
  image: string;
  images?: string[];
  description: string;
  year: number;
  mileage: number;
  condition: CarCondition;
  discount?: number;
  category?: string;
  engine?: string;
  transmission?: string;
  color?: string;
  status?: EntityStatus;
  installmentPlans?: InstallmentPlan[];
  campaigns?: DiscountCampaign[];
  averageRating?: number;
  reviewCount?: number;
}

export interface PaymentHistory {
  id: string;
  orderId: string;
  amount: number;
  paidAt: string;
  status: EntityStatus;
  orderTitle?: string;
  userName?: string;
}

export interface Order {
  id: string;
  userId: string;
  userName: string;
  carId: string;
  carTitle: string;
  carImage?: string;
  price: number;
  status: OrderStatus;
  paymentStatus?: string;
  date: string;
  orderType?: OrderType;
  installmentPlanId?: string;
  installmentMonths?: number;
  installmentInterest?: number;
  monthlyPayment?: number;
  payments?: PaymentHistory[];
  basePrice?: number;
  discount?: number;
  interest?: number;
}

export interface Review {
  id: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  carId: string;
  carTitle: string;
  rating: number;
  comment: string;
  date: string;
}

export interface AdminActionLogEntry {
  id: string;
  adminId: string;
  adminName: string;
  adminAvatarUrl?: string;
  action: string;
  targetType: string;
  targetId: string;
  timestamp: string;
  details?: string;
}

export interface DashboardStats {
  cars: number;
  orders: number;
  users: number;
  revenue: number;
  generatedAt?: string;
  lastCalculated?: string;
  fromCache?: boolean;
}

export interface CarFormValues {
  title: string;
  brand: string;
  price: number;
  description: string;
  year: number;
  mileage: number;
  condition: CarCondition;
  image?: string;
  categoryId?: number;
  engine: string;
  transmission: string;
}

export interface CampaignFormValues {
  name: string;
  description?: string;
  discount: number;
  startDate: string;
  endDate: string;
  carIds: string[];
}

export interface InstallmentPlanFormValues {
  carId: string;
  months: number;
  discount: number;
  interest: number;
  isActive: boolean;
}
