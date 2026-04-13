import { useEffect, useMemo, type ElementType } from 'react';
import { motion } from 'framer-motion';
import {
  ArrowUpRight,
  CarFront,
  CheckCircle,
  Clock,
  RefreshCw,
  ShoppingBag,
  TrendingUp,
  Truck,
  Users,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAppStore } from '../../store/useAppStore';
import { useAuthStore } from '../../store/useAuthStore';
import { MONTH_LABELS, buildMonthlyOrderSeries } from '../../lib/analytics';

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : 'Failed to refresh statistics';
}

function RevenueChart({ data }: { data: number[] }) {
  const max = Math.max(...data, 1);

  return (
    <div className="w-full overflow-x-auto">
      <svg viewBox="0 0 700 200" className="w-full h-44 min-w-[400px]">
        <defs>
          <linearGradient id="barG" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#4F46E5" />
            <stop offset="100%" stopColor="#6366F1" stopOpacity="0.7" />
          </linearGradient>
        </defs>
        {data.map((value, index) => {
          const height = (value / max) * 150;
          const x = index * 58 + 6;
          const y = 165 - height;
          return (
            <g key={MONTH_LABELS[index]}>
              <motion.rect
                x={x}
                width={42}
                rx={6}
                initial={{ y: 165, height: 0 }}
                animate={{ y, height }}
                transition={{ delay: index * 0.06, duration: 0.7, ease: 'easeOut' }}
                fill="url(#barG)"
                className="cursor-pointer hover:opacity-80 transition-opacity"
              />
              <text
                x={x + 21}
                y={185}
                textAnchor="middle"
                fill="#94a3b8"
                fontSize={10}
              >
                {MONTH_LABELS[index]}
              </text>
            </g>
          );
        })}
        {[0, 0.25, 0.5, 0.75, 1].map((fraction) => (
          <line
            key={fraction}
            x1={0}
            x2={700}
            y1={165 - fraction * 150}
            y2={165 - fraction * 150}
            stroke="#e2e8f0"
            strokeWidth={1}
            strokeDasharray="4 4"
            opacity={0.6}
          />
        ))}
      </svg>
    </div>
  );
}

const STATUS_COLORS: Record<string, string> = {
  PENDING: 'text-amber-500 bg-amber-50 dark:bg-amber-900/20',
  CONFIRMED: 'text-blue-500 bg-blue-50 dark:bg-blue-900/20',
  DELIVERED: 'text-emerald-500 bg-emerald-50 dark:bg-emerald-900/20',
  CANCELLED: 'text-red-500 bg-red-50 dark:bg-red-900/20',
};

const STATUS_ICONS: Record<string, ElementType> = {
  PENDING: Clock,
  CONFIRMED: CheckCircle,
  DELIVERED: Truck,
};

export function Dashboard() {
  const {
    cars,
    fetchCars,
    fetchOrders,
    fetchStats,
    orders,
    recalculateStats,
    stats,
  } = useAppStore();
  const { user } = useAuthStore();
  const isSuperadmin = user?.role === 'SUPERADMIN';

  useEffect(() => {
    const tasks: Promise<unknown>[] = [fetchOrders(), fetchCars()];

    if (isSuperadmin) {
      tasks.push(fetchStats());
    }

    void Promise.all(tasks);
  }, [fetchCars, fetchOrders, fetchStats, isSuperadmin]);

  const { revenue: monthlyRevenue } = useMemo(
    () => buildMonthlyOrderSeries(orders),
    [orders],
  );

  const totalRevenue =
    stats?.revenue ??
    orders
      .filter((order) => order.status !== 'CANCELLED')
      .reduce((sum, order) => sum + order.price, 0);

  const pendingCount = orders.filter((order) => order.status === 'PENDING').length;
  const deliveredCount = orders.filter((order) => order.status === 'DELIVERED').length;
  const newCarsCount = cars.filter((car) => car.condition === 'New').length;

  const statCards = [
    {
      label: 'Total Revenue',
      value: `$${(totalRevenue / 1000).toFixed(0)}k`,
      icon: TrendingUp,
      color: 'text-emerald-600',
      bg: 'bg-emerald-100 dark:bg-emerald-900/30',
      change: stats?.fromCache ? 'cached data' : 'live data',
    },
    {
      label: 'Total Orders',
      value: String(stats?.orders ?? orders.length),
      icon: ShoppingBag,
      color: 'text-blue-600',
      bg: 'bg-blue-100 dark:bg-blue-900/30',
      change: `${orders.length} loaded`,
    },
    {
      label: 'Active Listings',
      value: String(stats?.cars ?? cars.length),
      icon: CarFront,
      color: 'text-purple-600',
      bg: 'bg-purple-100 dark:bg-purple-900/30',
      change: `${newCarsCount} new`,
    },
  ];

  if (isSuperadmin) {
    statCards.push({
      label: 'Active Users',
      value: String(stats?.users ?? 0),
      icon: Users,
      color: 'text-orange-600',
      bg: 'bg-orange-100 dark:bg-orange-900/30',
      change: stats?.lastCalculated ? `updated ${stats.lastCalculated}` : 'cached summary',
    });
  }

  const handleRefreshStats = async () => {
    if (!isSuperadmin) {
      return;
    }

    try {
      await recalculateStats();
      toast.success('Dashboard statistics recalculated.');
    } catch (error: unknown) {
      toast.error(getErrorMessage(error));
    }
  };

  return (
    <div className="max-w-7xl mx-auto w-full">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
      >
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">
            Welcome back, {user?.name?.split(' ')[0] ?? 'Admin'}
          </h1>
          <p className="text-gray-400 mt-1">
            Here is what is happening in your marketplace right now.
          </p>
        </div>
        {isSuperadmin && (
          <button
            onClick={handleRefreshStats}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white bg-primary shadow-sm shadow-primary/30 btn-hover-scale"
          >
            <RefreshCw size={16} /> Recalculate Stats
          </button>
        )}
      </motion.div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        {statCards.map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1, duration: 0.5 }}
            className="glass-card p-6 flex items-center gap-4 group"
          >
            <div
              className={`p-3.5 rounded-2xl ${stat.bg} ${stat.color} group-hover:scale-110 transition-transform duration-300`}
            >
              <stat.icon size={22} />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                {stat.label}
              </p>
              <p className="text-2xl font-extrabold text-gray-900 dark:text-white mt-0.5">
                {stat.value}
              </p>
              <p className="text-xs text-emerald-500 font-semibold flex items-center gap-0.5 mt-0.5">
                <ArrowUpRight size={12} /> {stat.change}
              </p>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6 mb-8">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
          className="lg:col-span-2 glass-card p-6"
        >
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">Monthly Revenue</h2>
            <span className="text-xs text-gray-400 bg-gray-100 dark:bg-white/10 px-2.5 py-1 rounded-lg font-medium">
              Based on backend orders
            </span>
          </div>
          <RevenueChart data={monthlyRevenue} />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5 }}
          className="glass-card p-6 flex flex-col"
        >
          <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Recent Orders</h2>
          <div className="flex-1 space-y-3 overflow-hidden">
            {orders.slice(0, 5).map((order, index) => {
              const StatusIcon = STATUS_ICONS[order.status] ?? Clock;
              return (
                <motion.div
                  key={order.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.55 + index * 0.08 }}
                  className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-white/40 dark:hover:bg-white/5 transition-colors cursor-pointer"
                >
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${STATUS_COLORS[order.status]}`}
                  >
                    <StatusIcon size={14} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-gray-900 dark:text-white truncate">
                      {order.carTitle}
                    </p>
                    <p className="text-[10px] text-gray-400 truncate">{order.userName}</p>
                  </div>
                  <div className="text-xs font-bold text-gray-900 dark:text-white flex-shrink-0">
                    ${(order.price / 1000).toFixed(0)}k
                  </div>
                </motion.div>
              );
            })}
            {orders.length === 0 && (
              <div className="text-sm text-gray-400">No orders available yet.</div>
            )}
          </div>
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="glass-card p-6"
      >
        <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
          Order Status Breakdown
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: 'Pending', count: pendingCount, color: 'bg-amber-500' },
            {
              label: 'Confirmed',
              count: orders.filter((order) => order.status === 'CONFIRMED').length,
              color: 'bg-blue-500',
            },
            { label: 'Delivered', count: deliveredCount, color: 'bg-emerald-500' },
            {
              label: 'Cancelled',
              count: orders.filter((order) => order.status === 'CANCELLED').length,
              color: 'bg-red-500',
            },
          ].map((status) => (
            <div key={status.label} className="text-center">
              <div className="text-2xl font-extrabold text-gray-900 dark:text-white">
                {status.count}
              </div>
              <div className="text-xs text-gray-400 mb-2">{status.label}</div>
              <div className="h-1.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${orders.length ? (status.count / orders.length) * 100 : 0}%` }}
                  transition={{ delay: 0.7, duration: 1, ease: 'easeOut' }}
                  className={`h-full rounded-full ${status.color}`}
                />
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
