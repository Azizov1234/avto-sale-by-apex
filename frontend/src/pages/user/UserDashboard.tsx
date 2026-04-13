import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Camera,
  CheckCircle,
  Clock,
  CreditCard,
  Package,
  ShoppingBag,
  Star,
  Truck,
  User as UserIcon,
  XCircle,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuthStore } from '../../store/useAuthStore';
import { useAppStore } from '../../store/useAppStore';
import { buildAvatarUrl } from '../../lib/mappers';

const TABS = [
  { key: 'orders', label: 'My Orders', icon: ShoppingBag },
  { key: 'payments', label: 'Payment History', icon: CreditCard },
  { key: 'profile', label: 'My Profile', icon: UserIcon },
  { key: 'review', label: 'Write a Review', icon: Star },
] as const;

type TabKey = (typeof TABS)[number]['key'];

const STATUS_MAP = {
  PENDING: {
    label: 'Pending',
    icon: Clock,
    color: 'text-amber-500',
    bg: 'bg-amber-50 dark:bg-amber-900/20',
    progress: 10,
  },
  CONFIRMED: {
    label: 'Confirmed',
    icon: CheckCircle,
    color: 'text-blue-500',
    bg: 'bg-blue-50 dark:bg-blue-900/20',
    progress: 50,
  },
  DELIVERED: {
    label: 'Delivered',
    icon: Truck,
    color: 'text-emerald-500',
    bg: 'bg-emerald-50 dark:bg-emerald-900/20',
    progress: 100,
  },
  CANCELLED: {
    label: 'Cancelled',
    icon: XCircle,
    color: 'text-red-500',
    bg: 'bg-red-50 dark:bg-red-900/20',
    progress: 0,
  },
} as const;

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : 'Something went wrong';
}

function StarPicker({
  value,
  onChange,
}: {
  value: number;
  onChange: (value: number) => void;
}) {
  const [hover, setHover] = useState(0);

  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((rating) => (
        <button
          key={rating}
          type="button"
          onMouseEnter={() => setHover(rating)}
          onMouseLeave={() => setHover(0)}
          onClick={() => onChange(rating)}
          className="star transition-transform hover:scale-110"
          aria-label={`${rating} stars`}
        >
          <Star
            size={28}
            className={
              rating <= (hover || value)
                ? 'text-amber-400 fill-amber-400'
                : 'text-gray-300 dark:text-gray-600'
            }
          />
        </button>
      ))}
    </div>
  );
}

export function UserDashboard() {
  const { user, updateProfile } = useAuthStore();
  const {
    addPayment,
    addReview,
    cars,
    fetchCars,
    fetchOrders,
    fetchPayments,
    fetchReviews,
    orders,
    payments,
    reviews,
  } = useAppStore();
  const [activeTab, setActiveTab] = useState<TabKey>('orders');
  const [isLoading, setIsLoading] = useState(true);
  const [paymentAmounts, setPaymentAmounts] = useState<Record<string, string>>(
    {},
  );

  const [profileName, setProfileName] = useState(user?.name ?? '');
  const [profileEmail, setProfileEmail] = useState(user?.email ?? '');
  const [profilePhone, setProfilePhone] = useState(user?.phone ?? '');
  const [profilePassword, setProfilePassword] = useState('');
  const [profileAvatarFile, setProfileAvatarFile] = useState<File | null>(null);
  const [profileAvatarPreview, setProfileAvatarPreview] = useState('');

  const [reviewCarId, setReviewCarId] = useState('');
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewText, setReviewText] = useState('');

  const fallbackAvatar = useMemo(
    () => buildAvatarUrl(profileName || profileEmail || user?.name || 'User'),
    [profileEmail, profileName, user?.name],
  );

  useEffect(() => {
    setProfileName(user?.name ?? '');
    setProfileEmail(user?.email ?? '');
    setProfilePhone(user?.phone ?? '');
  }, [user]);

  useEffect(() => {
    if (!profileAvatarFile) {
      setProfileAvatarPreview('');
      return;
    }

    const objectUrl = URL.createObjectURL(profileAvatarFile);
    setProfileAvatarPreview(objectUrl);

    return () => {
      URL.revokeObjectURL(objectUrl);
    };
  }, [profileAvatarFile]);

  useEffect(() => {
    if (!user) {
      setIsLoading(false);
      return;
    }

    let isMounted = true;

    const loadDashboard = async () => {
      try {
        await Promise.all([
          fetchCars(),
          fetchOrders({ mine: true }),
          fetchPayments({ mine: true }),
          fetchReviews({ mine: true }),
        ]);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    void loadDashboard();

    return () => {
      isMounted = false;
    };
  }, [fetchCars, fetchOrders, fetchPayments, fetchReviews, user]);

  if (!user) {
    return null;
  }

  const totalSpent = orders
    .filter((order) => order.status !== 'CANCELLED')
    .reduce((sum, order) => sum + (order.totalPaid ?? 0), 0);

  const handleSaveProfile = async () => {
    try {
      await updateProfile({
        name: profileName.trim(),
        email: profileEmail.trim(),
        phone: profilePhone.trim(),
        password: profilePassword || undefined,
        avatarFile: profileAvatarFile ?? undefined,
      });
      setProfilePassword('');
      setProfileAvatarFile(null);
      toast.success('Profile updated successfully!');
    } catch (error: unknown) {
      toast.error(getErrorMessage(error));
    }
  };

  const handleSubmitReview = async () => {
    if (!reviewCarId) {
      toast.error('Please select a car.');
      return;
    }

    if (!reviewRating) {
      toast.error('Please select a rating.');
      return;
    }

    if (!reviewText.trim()) {
      toast.error('Please write a comment.');
      return;
    }

    try {
      await addReview({
        carId: reviewCarId,
        rating: reviewRating,
        comment: reviewText.trim(),
      });
      toast.success('Review submitted! Thank you.');
      setReviewCarId('');
      setReviewRating(0);
      setReviewText('');
    } catch (error: unknown) {
      toast.error(getErrorMessage(error));
    }
  };

  const handlePaymentChange = (orderId: string, value: string) => {
    setPaymentAmounts((current) => ({
      ...current,
      [orderId]: value,
    }));
  };

  const handlePayOrder = async (orderId: string) => {
    const rawAmount = paymentAmounts[orderId]?.trim() ?? '';
    const amount = Number(rawAmount);

    if (!rawAmount || Number.isNaN(amount) || amount <= 0) {
      toast.error('Please enter a valid payment amount.');
      return;
    }

    try {
      await addPayment(orderId, amount);
      setPaymentAmounts((current) => ({
        ...current,
        [orderId]: '',
      }));
      toast.success('Payment recorded successfully.');
    } catch (error: unknown) {
      toast.error(getErrorMessage(error));
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-4xl mx-auto"
    >
      <div className="glass-card p-6 mb-6 flex items-center gap-5">
        <img
          src={user.avatarUrl}
          alt={user.name}
          className="w-16 h-16 rounded-2xl object-cover border-2 border-primary/30 shadow-md"
        />
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-extrabold text-gray-900 dark:text-white">
            {user.name}
          </h1>
          <p className="text-gray-400 text-sm">{user.email}</p>
          <span className="inline-block mt-1 text-xs font-bold px-2.5 py-0.5 rounded-full bg-primary/10 text-primary capitalize">
            {user.role}
          </span>
        </div>
        <div className="hidden sm:grid grid-cols-3 gap-4 text-center">
          {[
            { label: 'Orders', value: orders.length },
            { label: 'Reviews', value: reviews.length },
            { label: 'Spent', value: `$${(totalSpent / 1000).toFixed(0)}k` },
          ].map((stat) => (
            <div key={stat.label}>
              <div className="text-xl font-extrabold text-primary">{stat.value}</div>
              <div className="text-xs text-gray-400">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex gap-1 mb-6 bg-white/60 dark:bg-white/5 border border-white/40 dark:border-white/10 p-1.5 rounded-2xl">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveTab(tab.key)}
            className={`relative flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-semibold rounded-xl transition-all ${
              activeTab === tab.key
                ? 'text-white'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            {activeTab === tab.key && (
              <motion.div
                layoutId="tab-pill"
                className="absolute inset-0 bg-primary rounded-xl shadow-md shadow-primary/30"
                transition={{ type: 'spring', stiffness: 380, damping: 32 }}
              />
            )}
            <tab.icon size={16} className="relative z-10" />
            <span className="relative z-10 hidden sm:block">{tab.label}</span>
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -12 }}
          transition={{ duration: 0.28 }}
        >
          {activeTab === 'orders' && (
            <div className="space-y-4">
              {isLoading ? (
                <div className="glass-card p-10 text-center text-gray-400">
                  Loading your orders...
                </div>
              ) : orders.length === 0 ? (
                <div className="glass-card p-10 text-center text-gray-400">
                  <Package size={40} className="mx-auto mb-3 opacity-30" />
                  <p>You have not placed any orders yet.</p>
                </div>
              ) : (
                orders.map((order, index) => {
                  const statusConfig = STATUS_MAP[order.status];
                  const StatusIcon = statusConfig.icon;
                  const paidAmount = order.totalPaid ?? 0;
                  const remainingAmount = order.remainingAmount ?? order.price;
                  const paymentProgress = order.paymentProgressPercent ?? 0;
                  const paymentState = order.isFullyPaid
                    ? {
                        label: 'Paid in full',
                        color:
                          'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
                      }
                    : paidAmount > 0
                      ? {
                          label: 'Partially paid',
                          color:
                            'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
                        }
                      : {
                          label: 'Payment pending',
                          color:
                            'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
                        };

                  return (
                    <motion.div
                      key={order.id}
                      initial={{ opacity: 0, y: 16 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.07 }}
                      className="glass-card p-5"
                    >
                      <div className="flex items-start justify-between gap-3 mb-3 flex-wrap">
                        <div>
                          <p className="font-bold text-gray-900 dark:text-white">
                            {order.carTitle}
                          </p>
                          <p className="text-xs text-gray-400 font-mono">#{order.id}</p>
                        </div>
                        <div
                          className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full ${statusConfig.bg} ${statusConfig.color}`}
                        >
                          <StatusIcon size={12} /> {statusConfig.label}
                        </div>
                      </div>

                      {order.status !== 'CANCELLED' && (
                        <div className="mb-3">
                          <div className="h-1.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${statusConfig.progress}%` }}
                              transition={{
                                delay: 0.3 + index * 0.07,
                                duration: 1,
                                ease: 'easeOut',
                              }}
                              className="progress-bar h-full"
                            />
                          </div>
                          <div className="flex justify-between text-[10px] text-gray-400 mt-1">
                            <span>Ordered</span>
                            <span>Confirmed</span>
                            <span>Delivered</span>
                          </div>
                        </div>
                      )}

                      <div className="flex items-center justify-between text-sm flex-wrap gap-2">
                        <span className="text-gray-400">{order.date}</span>
                        <span className="font-bold text-gray-900 dark:text-white">
                          ${order.price.toLocaleString()}
                        </span>
                      </div>

                      <div className="mt-4 rounded-2xl border border-gray-100 bg-white/60 p-4 dark:border-white/10 dark:bg-white/5">
                        <div className="mb-3 flex items-center justify-between gap-3 flex-wrap">
                          <div>
                            <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                              Payment progress
                            </p>
                            <p className="text-sm font-bold text-gray-900 dark:text-white">
                              ${paidAmount.toLocaleString()} paid
                              <span className="text-gray-400 font-medium">
                                {' '}
                                / ${order.price.toLocaleString()}
                              </span>
                            </p>
                          </div>
                          <span
                            className={`rounded-full px-3 py-1 text-[11px] font-bold ${paymentState.color}`}
                          >
                            {paymentState.label}
                          </span>
                        </div>

                        <div className="h-2 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-700">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${paymentProgress}%` }}
                            transition={{
                              delay: 0.2 + index * 0.05,
                              duration: 0.8,
                              ease: 'easeOut',
                            }}
                            className={`h-full rounded-full ${
                              order.isFullyPaid ? 'bg-emerald-500' : 'bg-primary'
                            }`}
                          />
                        </div>

                        <div className="mt-2 grid grid-cols-2 gap-3 text-xs sm:grid-cols-4">
                          <div className="rounded-xl bg-gray-50 px-3 py-2 dark:bg-white/5">
                            <div className="text-gray-400">Paid</div>
                            <div className="mt-1 font-semibold text-gray-900 dark:text-white">
                              ${paidAmount.toLocaleString()}
                            </div>
                          </div>
                          <div className="rounded-xl bg-gray-50 px-3 py-2 dark:bg-white/5">
                            <div className="text-gray-400">Remaining</div>
                            <div className="mt-1 font-semibold text-gray-900 dark:text-white">
                              ${remainingAmount.toLocaleString()}
                            </div>
                          </div>
                          <div className="rounded-xl bg-gray-50 px-3 py-2 dark:bg-white/5">
                            <div className="text-gray-400">Progress</div>
                            <div className="mt-1 font-semibold text-gray-900 dark:text-white">
                              {paymentProgress}%
                            </div>
                          </div>
                          <div className="rounded-xl bg-gray-50 px-3 py-2 dark:bg-white/5">
                            <div className="text-gray-400">Payments</div>
                            <div className="mt-1 font-semibold text-gray-900 dark:text-white">
                              {order.paymentCount ?? order.payments?.length ?? 0}
                            </div>
                          </div>
                        </div>

                        {order.installmentMonths && (
                          <div className="mt-3 rounded-xl bg-indigo-50 px-3 py-3 dark:bg-indigo-900/20">
                            <div className="flex items-center justify-between gap-3 text-xs flex-wrap">
                              <span className="font-semibold text-indigo-700 dark:text-indigo-300">
                                {order.installmentMonths}-month installment
                              </span>
                              <span className="font-bold text-indigo-800 dark:text-indigo-200">
                                ${order.monthlyPayment?.toLocaleString()}/mo
                              </span>
                            </div>
                            <div className="mt-2 grid grid-cols-2 gap-3 text-xs">
                              <div>
                                <span className="text-indigo-500">Months paid: </span>
                                <span className="font-semibold text-indigo-900 dark:text-indigo-100">
                                  {order.installmentMonthsPaid ?? 0}/{order.installmentMonthsTotal ?? order.installmentMonths}
                                </span>
                              </div>
                              <div>
                                <span className="text-indigo-500">Months left: </span>
                                <span className="font-semibold text-indigo-900 dark:text-indigo-100">
                                  {order.installmentMonthsRemaining ?? 0}
                                </span>
                              </div>
                            </div>
                          </div>
                        )}

                        {order.status !== 'CANCELLED' && !order.isFullyPaid && (
                          <div className="mt-4 rounded-xl border border-dashed border-primary/30 bg-primary/5 p-3">
                            <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
                              <div className="flex-1">
                                <label className="mb-1 block text-xs font-semibold text-gray-600 dark:text-gray-300">
                                  Make a payment
                                </label>
                                <input
                                  type="number"
                                  min="0.01"
                                  step="0.01"
                                  value={paymentAmounts[order.id] ?? ''}
                                  onChange={(event) =>
                                    handlePaymentChange(order.id, event.target.value)
                                  }
                                  placeholder={`Up to ${remainingAmount.toFixed(2)}`}
                                  className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-900 outline-none transition-all focus:border-primary/50 focus:ring-2 focus:ring-primary/15 dark:border-white/10 dark:bg-white/10 dark:text-white"
                                />
                              </div>
                              <button
                                type="button"
                                onClick={() => handlePayOrder(order.id)}
                                className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white shadow-sm shadow-primary/30 btn-hover-scale"
                              >
                                <CreditCard size={16} /> Pay now
                              </button>
                            </div>
                          </div>
                        )}

                        {order.isFullyPaid && (
                          <div className="mt-4 rounded-xl bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300">
                            This car has been fully paid.
                          </div>
                        )}

                        {order.payments && order.payments.length > 0 && (
                          <div className="mt-4">
                            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">
                              Payment history
                            </p>
                            <div className="space-y-2">
                              {order.payments.map((payment) => (
                                <div
                                  key={payment.id}
                                  className="flex items-center justify-between rounded-xl bg-gray-50 px-3 py-2 text-xs dark:bg-white/5"
                                >
                                  <div>
                                    <div className="font-semibold text-gray-900 dark:text-white">
                                      ${payment.amount.toLocaleString()}
                                    </div>
                                    <div className="text-gray-400">{payment.paidAt}</div>
                                  </div>
                                  <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-[10px] font-bold text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300">
                                    PAID
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  );
                })
              )}
            </div>
          )}

          {activeTab === 'payments' && (
            <div className="glass-card overflow-hidden">
              {isLoading ? (
                <div className="p-10 text-center text-gray-400">
                  <CreditCard size={40} className="mx-auto mb-3 opacity-30" />
                  Loading payment history...
                </div>
              ) : payments.length === 0 ? (
                <div className="p-10 text-center text-gray-400">
                  <CreditCard size={40} className="mx-auto mb-3 opacity-30" />
                  No payment history yet.
                </div>
              ) : (
                <div className="divide-y divide-gray-100 dark:divide-white/10">
                  {payments.map((payment, index) => (
                    <motion.div
                      key={payment.id}
                      initial={{ opacity: 0, x: -16 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.07 }}
                      className="flex items-center gap-4 p-4 hover:bg-white/40 dark:hover:bg-white/5 transition-colors"
                    >
                      <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                        <CreditCard size={18} className="text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                          {payment.orderTitle || 'Order payment'}
                        </p>
                        <p className="text-xs text-gray-400">{payment.paidAt}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-gray-900 dark:text-white">
                          ${payment.amount.toLocaleString()}
                        </p>
                        <span className="text-[10px] font-bold badge badge-confirmed">
                          {payment.orderPaymentStatus === 'CONFIRMED' ? 'ORDER PAID' : 'PAID'}
                        </span>
                        {payment.orderPrice !== undefined && (
                          <p className="mt-1 text-[10px] text-gray-400">
                            of ${payment.orderPrice.toLocaleString()}
                          </p>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'profile' && (
            <div className="glass-card p-6 space-y-5">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">Edit Profile</h2>

              <div className="flex items-center gap-4 p-4 rounded-2xl bg-white/50 dark:bg-white/5 border border-white/40 dark:border-white/10">
                <div className="relative">
                  <img
                    src={profileAvatarPreview || user.avatarUrl || fallbackAvatar}
                    alt={profileName || user.name}
                    className="w-20 h-20 rounded-2xl object-cover border border-primary/20 shadow-sm"
                  />
                  <label
                    htmlFor="profile-avatar"
                    className="absolute -bottom-2 -right-2 flex items-center justify-center w-9 h-9 rounded-full bg-primary text-white shadow-lg cursor-pointer hover:bg-indigo-600 transition-colors"
                  >
                    <Camera size={16} />
                  </label>
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">
                    Profile Avatar
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Upload a new image or keep the current avatar. If no avatar exists, a default one is used.
                  </p>
                </div>
                <input
                  id="profile-avatar"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(event) => setProfileAvatarFile(event.target.files?.[0] ?? null)}
                />
              </div>

              {[
                {
                  label: 'Full Name',
                  value: profileName,
                  setter: setProfileName,
                  type: 'text',
                  placeholder: 'Your name',
                },
                {
                  label: 'Email Address',
                  value: profileEmail,
                  setter: setProfileEmail,
                  type: 'email',
                  placeholder: 'you@example.com',
                },
                {
                  label: 'Phone Number',
                  value: profilePhone,
                  setter: setProfilePhone,
                  type: 'tel',
                  placeholder: '+998901234567',
                },
                {
                  label: 'New Password',
                  value: profilePassword,
                  setter: setProfilePassword,
                  type: 'password',
                  placeholder: 'Leave blank to keep current password',
                },
              ].map((field) => (
                <div key={field.label}>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {field.label}
                  </label>
                  <input
                    type={field.type}
                    value={field.value}
                    onChange={(event) => field.setter(event.target.value)}
                    placeholder={field.placeholder}
                    className="w-full px-4 py-2.5 bg-white/70 dark:bg-white/10 border border-gray-200 dark:border-white/10 rounded-xl text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none input-glow transition-all-smooth"
                  />
                </div>
              ))}

              <button
                type="button"
                onClick={handleSaveProfile}
                className="btn-primary px-6 py-3 rounded-xl text-sm"
              >
                Save Changes
              </button>
            </div>
          )}

          {activeTab === 'review' && (
            <div className="glass-card p-6 space-y-5">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">Leave a Review</h2>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Select Vehicle
                </label>
                <select
                  value={reviewCarId}
                  onChange={(event) => setReviewCarId(event.target.value)}
                  className="w-full px-4 py-2.5 bg-white/70 dark:bg-gray-800 border border-gray-200 dark:border-white/10 rounded-xl text-sm text-gray-900 dark:text-white focus:outline-none input-glow"
                >
                  <option value="">-- Choose a car --</option>
                  {cars.map((car) => (
                    <option key={car.id} value={car.id}>
                      {car.title}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Your Rating
                </label>
                <StarPicker value={reviewRating} onChange={setReviewRating} />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Your Comment
                </label>
                <textarea
                  rows={4}
                  value={reviewText}
                  onChange={(event) => setReviewText(event.target.value)}
                  placeholder="Share your experience with this vehicle..."
                  className="w-full px-4 py-2.5 bg-white/70 dark:bg-white/10 border border-gray-200 dark:border-white/10 rounded-xl text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none input-glow transition-all-smooth resize-none"
                />
              </div>

              <button
                type="button"
                onClick={handleSubmitReview}
                className="btn-primary px-6 py-3 rounded-xl text-sm flex items-center gap-2"
              >
                <Star size={16} /> Submit Review
              </button>

              {reviews.length > 0 && (
                <div className="border-t border-gray-100 dark:border-white/10 pt-5 mt-5">
                  <h3 className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-3">
                    Your Previous Reviews
                  </h3>
                  <div className="space-y-3">
                    {reviews.map((review) => (
                      <div
                        key={review.id}
                        className="bg-white/40 dark:bg-white/5 rounded-xl p-4 border border-white/30 dark:border-white/10"
                      >
                        <div className="flex justify-between items-start mb-2">
                          <p className="text-sm font-semibold text-gray-900 dark:text-white">
                            {review.carTitle}
                          </p>
                          <div className="flex gap-0.5">
                            {Array.from({ length: 5 }).map((_, index) => (
                              <Star
                                key={index}
                                size={12}
                                className={
                                  index < review.rating
                                    ? 'text-amber-400 fill-amber-400'
                                    : 'text-gray-300'
                                }
                              />
                            ))}
                          </div>
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {review.comment}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </motion.div>
  );
}
