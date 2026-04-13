import { create } from 'zustand';
import { apiClient, buildQueryString } from '../api/client';
import {
  CONDITION_TO_API,
  ENGINE_TO_API,
  TRANSMISSION_TO_API,
  extractListData,
  mapAdminActionLog,
  mapCampaign,
  mapCar,
  mapCategory,
  mapInstallmentPlan,
  mapOrder,
  mapPayment,
  mapReview,
  mapStats,
  mapUser,
  toIsoDate,
} from '../lib/mappers';
import type {
  AdminActionLogEntry,
  CampaignFormValues,
  Car,
  CarCategory,
  CarFormValues,
  DashboardStats,
  DiscountCampaign,
  InstallmentPlan,
  InstallmentPlanFormValues,
  Order,
  OrderStatus,
  OrderType,
  PaymentHistory,
  Review,
  User,
} from '../types';

type ApiRecord = Record<string, unknown>;

interface OrderFetchOptions {
  mine?: boolean;
}

interface ReviewFetchOptions {
  mine?: boolean;
  carId?: string;
}

interface PaymentFetchOptions {
  mine?: boolean;
  orderId?: string;
}

interface AppState {
  cars: Car[];
  categories: CarCategory[];
  orders: Order[];
  reviews: Review[];
  payments: PaymentHistory[];
  installmentPlans: InstallmentPlan[];
  campaigns: DiscountCampaign[];
  actionLogs: AdminActionLogEntry[];
  users: User[];
  stats: DashboardStats | null;
  fetchCars: () => Promise<void>;
  fetchCategories: () => Promise<void>;
  fetchCarById: (id: string) => Promise<Car | null>;
  addCar: (car: CarFormValues) => Promise<void>;
  updateCar: (id: string, car: Partial<CarFormValues>) => Promise<void>;
  deleteCar: (id: string) => Promise<void>;
  fetchOrders: (options?: OrderFetchOptions) => Promise<void>;
  addOrder: (payload: {
    carId: string;
    orderType: OrderType;
    planId?: string;
  }) => Promise<void>;
  updateOrderStatus: (id: string, status: OrderStatus) => Promise<void>;
  deleteOrder: (id: string) => Promise<void>;
  fetchReviews: (options?: ReviewFetchOptions) => Promise<void>;
  addReview: (payload: {
    carId: string;
    rating: number;
    comment: string;
  }) => Promise<Review>;
  updateReview: (
    id: string,
    payload: { rating?: number; comment?: string },
  ) => Promise<void>;
  deleteReview: (id: string) => Promise<void>;
  fetchPayments: (options?: PaymentFetchOptions) => Promise<void>;
  addPayment: (
    orderId: string,
    amount: number,
    refreshScope?: 'mine' | 'all',
  ) => Promise<void>;
  fetchInstallmentPlans: () => Promise<void>;
  addInstallmentPlan: (payload: InstallmentPlanFormValues) => Promise<void>;
  updateInstallmentPlan: (
    id: string,
    payload: Partial<InstallmentPlanFormValues>,
  ) => Promise<void>;
  deleteInstallmentPlan: (id: string) => Promise<void>;
  fetchCampaigns: () => Promise<void>;
  addCampaign: (payload: CampaignFormValues) => Promise<void>;
  updateCampaign: (id: string, payload: CampaignFormValues) => Promise<void>;
  deleteCampaign: (id: string) => Promise<void>;
  fetchActionLogs: () => Promise<void>;
  deleteActionLog: (id: string) => Promise<void>;
  fetchUsers: () => Promise<void>;
  createAdmin: (payload: {
    name: string;
    email: string;
    phone: string;
    password: string;
  }) => Promise<void>;
  updateUser: (
    id: string,
    payload: Partial<Pick<User, 'name' | 'email' | 'phone' | 'role'>> & {
      password?: string;
    },
  ) => Promise<void>;
  deleteUser: (id: string) => Promise<void>;
  fetchStats: () => Promise<DashboardStats | null>;
  recalculateStats: () => Promise<DashboardStats | null>;
}

const DEFAULT_LIMIT = 100;

const MONTHS_TO_API: Record<number, string> = {
  1: 'ONE',
  3: 'THREE',
  6: 'SIX',
  9: 'NINE',
  12: 'TWELVE',
  24: 'TWENTY_FOUR',
};

function toNumberId(id: string) {
  return Number(id);
}

function buildCarFormData(payload: Partial<CarFormValues>) {
  const formData = new FormData();

  if (payload.title !== undefined) {
    formData.append('title', payload.title);
  }

  if (payload.brand !== undefined) {
    formData.append('brand', payload.brand);
  }

  if (payload.price !== undefined) {
    formData.append('price', String(payload.price));
  }

  if (payload.description !== undefined) {
    formData.append('description', payload.description);
  }

  if (payload.year !== undefined) {
    formData.append('year', String(payload.year));
  }

  if (payload.mileage !== undefined) {
    formData.append('mileage', String(payload.mileage));
  }

  if (payload.condition !== undefined) {
    formData.append('carConditation', CONDITION_TO_API[payload.condition]);
  }

  if (payload.imageFile instanceof File) {
    formData.append('imageUrl', payload.imageFile);
  } else if (typeof payload.image === 'string' && payload.image.trim()) {
    formData.append('imageUrl', payload.image.trim());
  }

  if (payload.categoryId) {
    formData.append('categoryId', payload.categoryId);
  }

  if (payload.engine !== undefined) {
    formData.append(
      'engine',
      ENGINE_TO_API[payload.engine] ?? payload.engine.toUpperCase(),
    );
  }

  if (payload.transmission !== undefined) {
    formData.append(
      'transmission',
      TRANSMISSION_TO_API[payload.transmission] ?? payload.transmission.toUpperCase(),
    );
  }

  return formData;
}

function normalizeInstallmentPayload(
  payload: Partial<InstallmentPlanFormValues>,
) {
  const body: Record<string, unknown> = {};

  if (payload.carId !== undefined) {
    body.carId = toNumberId(payload.carId);
  }

  if (payload.months !== undefined) {
    body.months = MONTHS_TO_API[payload.months];
  }

  if (payload.discount !== undefined) {
    body.discount = payload.discount;
  }

  if (payload.interest !== undefined) {
    body.interest = payload.interest;
  }

  if (payload.isActive !== undefined) {
    body.status = payload.isActive ? 'active' : 'deleted';
  }

  return body;
}

async function attachCampaignCars(campaignId: string, carIds: string[]) {
  for (const carId of carIds) {
    await apiClient(`/campaigns/${campaignId}/attach-car`, {
      method: 'POST',
      body: JSON.stringify({ carId: toNumberId(carId) }),
    });
  }
}

async function syncCampaignCars(
  campaignId: string,
  previousCarIds: string[],
  nextCarIds: string[],
) {
  const previous = new Set(previousCarIds);
  const next = new Set(nextCarIds);

  for (const carId of nextCarIds) {
    if (!previous.has(carId)) {
      await apiClient(`/campaigns/${campaignId}/attach-car`, {
        method: 'POST',
        body: JSON.stringify({ carId: toNumberId(carId) }),
      });
    }
  }

  for (const carId of previousCarIds) {
    if (!next.has(carId)) {
      await apiClient(`/campaigns/${campaignId}/remove-car`, {
        method: 'POST',
        body: JSON.stringify({ carId: toNumberId(carId) }),
      });
    }
  }
}

export const useAppStore = create<AppState>((set, get) => ({
  cars: [],
  categories: [],
  orders: [],
  reviews: [],
  payments: [],
  installmentPlans: [],
  campaigns: [],
  actionLogs: [],
  users: [],
  stats: null,

  async fetchCars() {
    const response = await apiClient<ApiRecord>(
      `/cars${buildQueryString({ page: 1, limit: DEFAULT_LIMIT })}`,
    );
    const { items } = extractListData(response, mapCar);
    set({ cars: items });
  },

  async fetchCategories() {
    const response = await apiClient<ApiRecord>(
      `/categories/all${buildQueryString({ page: 1, limit: DEFAULT_LIMIT })}`,
    );
    const rawCategories = Array.isArray(response.data)
      ? response.data
      : [];
    set({
      categories: rawCategories.map((category) =>
        mapCategory(category as ApiRecord),
      ),
    });
  },

  async fetchCarById(id) {
    const rawCar = await apiClient<ApiRecord>(`/cars/${toNumberId(id)}`);
    const car = mapCar(rawCar);

    set((state) => ({
      cars: [car, ...state.cars.filter((existingCar) => existingCar.id !== car.id)],
      reviews: Array.isArray(rawCar.reviews)
        ? rawCar.reviews.map((review) => mapReview(review as ApiRecord))
        : state.reviews,
    }));

    return car;
  },

  async addCar(car) {
    await apiClient('/cars/create', {
      method: 'POST',
      body: buildCarFormData(car),
    });

    await get().fetchCars();
  },

  async updateCar(id, car) {
    await apiClient(`/cars/${toNumberId(id)}`, {
      method: 'PATCH',
      body: buildCarFormData(car),
    });

    await get().fetchCars();
  },

  async deleteCar(id) {
    await apiClient(`/cars/delete/${toNumberId(id)}`, {
      method: 'DELETE',
    });

    set((state) => ({
      cars: state.cars.filter((car) => car.id !== id),
    }));
  },

  async fetchOrders(options = {}) {
    const endpoint = options.mine ? '/orders/my' : '/orders';
    const response = await apiClient<ApiRecord[]>(endpoint);
    set({ orders: response.map((item) => mapOrder(item)) });
  },

  async addOrder(payload) {
    await apiClient('/orders', {
      method: 'POST',
      body: JSON.stringify({
        carId: toNumberId(payload.carId),
        orderType: payload.orderType,
        ...(payload.planId ? { planId: toNumberId(payload.planId) } : {}),
      }),
    });

    await get().fetchOrders({ mine: true });
  },

  async updateOrderStatus(id, status) {
    await apiClient(`/orders/${toNumberId(id)}`, {
      method: 'PATCH',
      body: JSON.stringify({ orderStatus: status }),
    });

    set((state) => ({
      orders: state.orders.map((order) =>
        order.id === id ? { ...order, status } : order,
      ),
    }));
  },

  async deleteOrder(id) {
    await apiClient(`/orders/${toNumberId(id)}`, {
      method: 'DELETE',
    });

    set((state) => ({
      orders: state.orders.filter((order) => order.id !== id),
    }));
  },

  async fetchReviews(options = {}) {
    let endpoint = `/reviews${buildQueryString({ page: 1, limit: DEFAULT_LIMIT })}`;

    if (options.mine) {
      endpoint = `/reviews/my${buildQueryString({ page: 1, limit: DEFAULT_LIMIT })}`;
    }

    if (options.carId) {
      endpoint = `/cars/${toNumberId(options.carId)}/reviews${buildQueryString({
        page: 1,
        limit: DEFAULT_LIMIT,
      })}`;
    }

    const response = await apiClient<ApiRecord>(endpoint);
    const { items } = extractListData(response, mapReview);
    set({ reviews: items });
  },

  async addReview(payload) {
    const response = await apiClient<ApiRecord>('/reviews', {
      method: 'POST',
      body: JSON.stringify({
        carId: toNumberId(payload.carId),
        rating: payload.rating,
        comment: payload.comment,
      }),
    });

    const review = mapReview(response);
    set((state) => ({ reviews: [review, ...state.reviews] }));
    return review;
  },

  async updateReview(id, payload) {
    await apiClient(`/reviews/${toNumberId(id)}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });

    set((state) => ({
      reviews: state.reviews.map((review) =>
        review.id === id ? { ...review, ...payload } : review,
      ),
    }));
  },

  async deleteReview(id) {
    await apiClient(`/reviews/${toNumberId(id)}`, {
      method: 'DELETE',
    });

    set((state) => ({
      reviews: state.reviews.filter((review) => review.id !== id),
    }));
  },

  async fetchPayments(options = {}) {
    let endpoint = `/payments${buildQueryString({ page: 1, limit: DEFAULT_LIMIT })}`;

    if (options.mine) {
      endpoint = `/payments/my${buildQueryString({ page: 1, limit: DEFAULT_LIMIT })}`;
    }

    if (options.orderId) {
      endpoint = `/orders/${toNumberId(options.orderId)}/payments${buildQueryString({
        page: 1,
        limit: DEFAULT_LIMIT,
      })}`;
    }

    const response = await apiClient<ApiRecord>(endpoint);
    const { items } = extractListData(response, mapPayment);
    set({ payments: items });
  },

  async addPayment(orderId, amount, refreshScope = 'mine') {
    await apiClient(`/orders/${toNumberId(orderId)}/pay`, {
      method: 'POST',
      body: JSON.stringify({ amount }),
    });

    if (refreshScope === 'all') {
      await Promise.all([get().fetchPayments(), get().fetchOrders()]);
      return;
    }

    await Promise.all([get().fetchPayments({ mine: true }), get().fetchOrders({ mine: true })]);
  },

  async fetchInstallmentPlans() {
    const response = await apiClient<ApiRecord>(
      `/installment-plans${buildQueryString({ page: 1, limit: DEFAULT_LIMIT })}`,
    );
    const { items } = extractListData(response, mapInstallmentPlan);
    set({ installmentPlans: items });
  },

  async addInstallmentPlan(payload) {
    await apiClient('/installment-plans', {
      method: 'POST',
      body: JSON.stringify(normalizeInstallmentPayload(payload)),
    });

    await get().fetchInstallmentPlans();
  },

  async updateInstallmentPlan(id, payload) {
    await apiClient(`/installment-plans/${toNumberId(id)}`, {
      method: 'PATCH',
      body: JSON.stringify(normalizeInstallmentPayload(payload)),
    });

    await get().fetchInstallmentPlans();
  },

  async deleteInstallmentPlan(id) {
    await apiClient(`/installment-plans/delete/${toNumberId(id)}`, {
      method: 'DELETE',
    });

    await get().fetchInstallmentPlans();
  },

  async fetchCampaigns() {
    const response = await apiClient<ApiRecord>(
      `/campaigns${buildQueryString({ page: 1, limit: DEFAULT_LIMIT })}`,
    );
    const { items } = extractListData(response, mapCampaign);
    set({ campaigns: items });
  },

  async addCampaign(payload) {
    const createdCampaign = await apiClient<ApiRecord>('/campaigns', {
      method: 'POST',
      body: JSON.stringify({
        name: payload.name,
        description: payload.description,
        discount: payload.discount,
        startDate: toIsoDate(payload.startDate),
        endDate: toIsoDate(payload.endDate, true),
      }),
    });

    await attachCampaignCars(String(createdCampaign.id), payload.carIds);
    await get().fetchCampaigns();
  },

  async updateCampaign(id, payload) {
    const currentCampaign = get().campaigns.find((campaign) => campaign.id === id);

    await apiClient(`/campaigns/${toNumberId(id)}`, {
      method: 'PATCH',
      body: JSON.stringify({
        name: payload.name,
        description: payload.description,
        discount: payload.discount,
        startDate: toIsoDate(payload.startDate),
        endDate: toIsoDate(payload.endDate, true),
      }),
    });

    await syncCampaignCars(id, currentCampaign?.carIds || [], payload.carIds);
    await get().fetchCampaigns();
  },

  async deleteCampaign(id) {
    await apiClient(`/campaigns/${toNumberId(id)}`, {
      method: 'DELETE',
    });

    set((state) => ({
      campaigns: state.campaigns.filter((campaign) => campaign.id !== id),
    }));
  },

  async fetchActionLogs() {
    const response = await apiClient<ApiRecord>(
      `/admin-logs${buildQueryString({ page: 1, limit: DEFAULT_LIMIT })}`,
    );
    const { items } = extractListData(response, mapAdminActionLog);
    set({ actionLogs: items });
  },

  async deleteActionLog(id) {
    await apiClient(`/admin-logs/${toNumberId(id)}`, {
      method: 'DELETE',
    });

    set((state) => ({
      actionLogs: state.actionLogs.filter((log) => log.id !== id),
    }));
  },

  async fetchUsers() {
    const response = await apiClient<ApiRecord>(
      `/user/all/with/search${buildQueryString({
        page: 1,
        limit: DEFAULT_LIMIT,
        status: 'active',
      })}`,
    );
    const { items } = extractListData(response, mapUser);
    set({ users: items });
  },

  async createAdmin(payload) {
    const formData = new FormData();
    formData.append('name', payload.name);
    formData.append('email', payload.email);
    formData.append('phone', payload.phone);
    formData.append('password', payload.password);

    await apiClient('/user/create/admin', {
      method: 'POST',
      body: formData,
    });

    await get().fetchUsers();
  },

  async updateUser(id, payload) {
    await apiClient(`/user/update/byAdmin/${toNumberId(id)}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });

    await get().fetchUsers();
  },

  async deleteUser(id) {
    await apiClient(`/user/delete/byAdmin/${toNumberId(id)}`, {
      method: 'DELETE',
    });

    set((state) => ({
      users: state.users.filter((user) => user.id !== id),
    }));
  },

  async fetchStats() {
    const response = await apiClient<ApiRecord>('/stats');
    const stats = mapStats(response);
    set({ stats });
    return stats;
  },

  async recalculateStats() {
    const response = await apiClient<ApiRecord>('/stats/recalculate', {
      method: 'POST',
      body: JSON.stringify({ key: 'dashboard' }),
    });
    const stats = mapStats(response);
    set({ stats });
    return stats;
  },
}));
