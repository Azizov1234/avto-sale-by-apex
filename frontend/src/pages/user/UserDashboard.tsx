import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShoppingBag, Clock, User as UserIcon, Star,
  CheckCircle, Package, Truck, XCircle, CreditCard,
} from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';
import { useAppStore } from '../../store/useAppStore';
import toast from 'react-hot-toast';

const TABS = [
  { key: 'orders',   label: 'My Orders',       icon: ShoppingBag },
  { key: 'payments', label: 'Payment History',  icon: CreditCard  },
  { key: 'profile',  label: 'My Profile',       icon: UserIcon    },
  { key: 'review',   label: 'Write a Review',   icon: Star        },
] as const;
type TabKey = typeof TABS[number]['key'];

const STATUS_MAP = {
  PENDING:   { label: 'Pending',   icon: Clock,        color: 'text-amber-500',  bg: 'bg-amber-50  dark:bg-amber-900/20',  progress: 10 },
  CONFIRMED: { label: 'Confirmed', icon: CheckCircle,  color: 'text-blue-500',   bg: 'bg-blue-50   dark:bg-blue-900/20',   progress: 50 },
  DELIVERED: { label: 'Delivered', icon: Truck,        color: 'text-emerald-500',bg: 'bg-emerald-50 dark:bg-emerald-900/20',progress: 100 },
  CANCELLED: { label: 'Cancelled', icon: XCircle,      color: 'text-red-500',    bg: 'bg-red-50    dark:bg-red-900/20',    progress: 0 },
};

function StarPicker({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [hover, setHover] = useState(0);
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map(i => (
        <button
          key={i}
          onMouseEnter={() => setHover(i)}
          onMouseLeave={() => setHover(0)}
          onClick={() => onChange(i)}
          className="star transition-transform hover:scale-110"
          aria-label={`${i} stars`}
        >
          <Star
            size={28}
            className={
              i <= (hover || value)
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
    orders,
    reviews,
    payments,
    cars,
    fetchCars,
    fetchOrders,
    fetchPayments,
    fetchReviews,
    addReview,
  } = useAppStore();
  const [activeTab, setActiveTab] = useState<TabKey>('orders');
  const [isLoading, setIsLoading] = useState(true);

  // Profile form
  const [profileName,  setProfileName]  = useState(user?.name  ?? '');
  const [profileEmail, setProfileEmail] = useState(user?.email ?? '');
  const [profilePhone, setProfilePhone] = useState(user?.phone ?? '');

  // Review form
  const [reviewCarId,  setReviewCarId]  = useState('');
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewText,   setReviewText]   = useState('');

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

    loadDashboard();

    return () => {
      isMounted = false;
    };
  }, [fetchCars, fetchOrders, fetchPayments, fetchReviews, user]);

  if (!user) return null;

  const myOrders  = orders;
  const myReviews = reviews;

  const totalSpent = myOrders
    .filter(o => o.status !== 'CANCELLED')
    .reduce((s, o) => s + o.price, 0);

  const handleSaveProfile = async () => {
    try {
      await updateProfile({
        name: profileName,
        email: profileEmail,
        phone: profilePhone,
      });
      toast.success('Profile updated successfully!');
    } catch (error: any) {
      toast.error(error.message || 'Failed to update profile.');
    }
  };

  const handleSubmitReview = async () => {
    if (!reviewCarId) { toast.error('Please select a car.'); return; }
    if (!reviewRating) { toast.error('Please select a rating.'); return; }
    if (!reviewText.trim()) { toast.error('Please write a comment.'); return; }

    try {
      await addReview({
        carId: reviewCarId,
        rating: reviewRating,
        comment: reviewText.trim(),
      });
      toast.success('Review submitted! Thank you.');
      setReviewCarId('');  setReviewRating(0);  setReviewText('');
    } catch (error: any) {
      toast.error(error.message || 'Failed to submit review.');
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="max-w-4xl mx-auto">

      {/* Profile header */}
      <div className="glass-card p-6 mb-6 flex items-center gap-5">
        <img src={user.avatarUrl} alt={user.name} className="w-16 h-16 rounded-2xl object-cover border-2 border-primary/30 shadow-md" />
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-extrabold text-gray-900 dark:text-white">{user.name}</h1>
          <p className="text-gray-400 text-sm">{user.email}</p>
          <span className="inline-block mt-1 text-xs font-bold px-2.5 py-0.5 rounded-full bg-primary/10 text-primary capitalize">{user.role}</span>
        </div>
        <div className="hidden sm:grid grid-cols-3 gap-4 text-center">
          {[
            { label: 'Orders',  value: myOrders.length },
            { label: 'Reviews', value: myReviews.length },
            { label: 'Spent',   value: `$${(totalSpent/1000).toFixed(0)}k` },
          ].map(s => (
            <div key={s.label}>
              <div className="text-xl font-extrabold text-primary">{s.value}</div>
              <div className="text-xs text-gray-400">{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-white/60 dark:bg-white/5 border border-white/40 dark:border-white/10 p-1.5 rounded-2xl">
        {TABS.map(tab => (
          <button
            key={tab.key}
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

      {/* Tab content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -12 }}
          transition={{ duration: 0.28 }}
        >

          {/* ── My Orders ── */}
          {activeTab === 'orders' && (
            <div className="space-y-4">
              {isLoading ? (
                <div className="glass-card p-10 text-center text-gray-400">
                  Loading your orders...
                </div>
              ) : myOrders.length === 0 ? (
                <div className="glass-card p-10 text-center text-gray-400">
                  <Package size={40} className="mx-auto mb-3 opacity-30" />
                  <p>You haven't placed any orders yet.</p>
                </div>
              ) : myOrders.map((order, i) => {
                const st = STATUS_MAP[order.status];
                const Icon = st.icon;
                return (
                  <motion.div
                    key={order.id}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.07 }}
                    className="glass-card p-5"
                  >
                    <div className="flex items-start justify-between gap-3 mb-3 flex-wrap">
                      <div>
                        <p className="font-bold text-gray-900 dark:text-white">{order.carTitle}</p>
                        <p className="text-xs text-gray-400 font-mono">#{order.id.toUpperCase()}</p>
                      </div>
                      <div className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full ${st.bg} ${st.color}`}>
                        <Icon size={12} /> {st.label}
                      </div>
                    </div>

                    {/* Progress bar */}
                    {order.status !== 'CANCELLED' && (
                      <div className="mb-3">
                        <div className="h-1.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${st.progress}%` }}
                            transition={{ delay: 0.3 + i * 0.07, duration: 1, ease: 'easeOut' }}
                            className="progress-bar h-full"
                          />
                        </div>
                        <div className="flex justify-between text-[10px] text-gray-400 mt-1">
                          <span>Ordered</span><span>Confirmed</span><span>Delivered</span>
                        </div>
                      </div>
                    )}

                    <div className="flex items-center justify-between text-sm flex-wrap gap-2">
                      <span className="text-gray-400">{order.date}</span>
                      <span className="font-bold text-gray-900 dark:text-white">${order.price.toLocaleString()}</span>
                    </div>
                    {order.installmentMonths && (
                      <div className="mt-2 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg px-3 py-1.5 flex items-center justify-between text-xs">
                        <span className="text-indigo-600 dark:text-indigo-400 font-semibold">
                          {order.installmentMonths}-month installment
                        </span>
                        <span className="font-bold text-indigo-700 dark:text-indigo-300">
                          ${order.monthlyPayment?.toLocaleString()}/mo
                        </span>
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </div>
          )}

          {/* ── Payment History ── */}
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
                  {payments.map((payment, i) => (
                    <motion.div
                      key={payment.id}
                      initial={{ opacity: 0, x: -16 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.07 }}
                      className="flex items-center gap-4 p-4 hover:bg-white/40 dark:hover:bg-white/5 transition-colors"
                    >
                      <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                        <CreditCard size={18} className="text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{payment.orderTitle}</p>
                        <p className="text-xs text-gray-400">{payment.paidAt}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-gray-900 dark:text-white">${payment.amount.toLocaleString()}</p>
                        <span className="text-[10px] font-bold badge badge-confirmed">
                          PAID
                        </span>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── Profile ── */}
          {activeTab === 'profile' && (
            <div className="glass-card p-6 space-y-5">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">Edit Profile</h2>
              {[
                { label: 'Full Name',     value: profileName,  setter: setProfileName,  type: 'text',  ph: 'Your name'   },
                { label: 'Email Address', value: profileEmail, setter: setProfileEmail, type: 'email', ph: 'you@example.com' },
                { label: 'Phone Number',  value: profilePhone, setter: setProfilePhone, type: 'tel',   ph: '+1 234 567 8900' },
              ].map(f => (
                <div key={f.label}>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{f.label}</label>
                  <input
                    type={f.type}
                    value={f.value}
                    onChange={e => f.setter(e.target.value)}
                    placeholder={f.ph}
                    className="w-full px-4 py-2.5 bg-white/70 dark:bg-white/10 border border-gray-200 dark:border-white/10 rounded-xl text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none input-glow transition-all-smooth"
                  />
                </div>
              ))}
              <button
                onClick={handleSaveProfile}
                className="btn-primary px-6 py-3 rounded-xl text-sm"
              >
                Save Changes
              </button>
            </div>
          )}

          {/* ── Write a Review ── */}
          {activeTab === 'review' && (
            <div className="glass-card p-6 space-y-5">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">Leave a Review</h2>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Select Vehicle</label>
                <select
                  value={reviewCarId}
                  onChange={e => setReviewCarId(e.target.value)}
                  className="w-full px-4 py-2.5 bg-white/70 dark:bg-gray-800 border border-gray-200 dark:border-white/10 rounded-xl text-sm text-gray-900 dark:text-white focus:outline-none input-glow"
                >
                  <option value="">-- Choose a car --</option>
                  {cars.map(c => (
                    <option key={c.id} value={c.id}>{c.title}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Your Rating</label>
                <StarPicker value={reviewRating} onChange={setReviewRating} />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Your Comment</label>
                <textarea
                  rows={4}
                  value={reviewText}
                  onChange={e => setReviewText(e.target.value)}
                  placeholder="Share your experience with this vehicle..."
                  className="w-full px-4 py-2.5 bg-white/70 dark:bg-white/10 border border-gray-200 dark:border-white/10 rounded-xl text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none input-glow transition-all-smooth resize-none"
                />
              </div>

              <button
                onClick={handleSubmitReview}
                className="btn-primary px-6 py-3 rounded-xl text-sm flex items-center gap-2"
              >
                <Star size={16} /> Submit Review
              </button>

              {/* Past reviews */}
              {myReviews.length > 0 && (
                <div className="border-t border-gray-100 dark:border-white/10 pt-5 mt-5">
                  <h3 className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-3">Your Previous Reviews</h3>
                  <div className="space-y-3">
                    {myReviews.map(r => (
                      <div key={r.id} className="bg-white/40 dark:bg-white/5 rounded-xl p-4 border border-white/30 dark:border-white/10">
                        <div className="flex justify-between items-start mb-2">
                          <p className="text-sm font-semibold text-gray-900 dark:text-white">{r.carTitle}</p>
                          <div className="flex gap-0.5">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <Star key={i} size={12} className={i < r.rating ? 'text-amber-400 fill-amber-400' : 'text-gray-300'} />
                            ))}
                          </div>
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{r.comment}</p>
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
