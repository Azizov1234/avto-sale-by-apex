import { useEffect, type ElementType } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { useAuthStore } from '../../store/useAuthStore';
import { motion } from 'framer-motion';
import {
  TrendingUp, ShoppingBag, CarFront, Users,
  ArrowUpRight, Clock, CheckCircle, Truck,
} from 'lucide-react';

/* ── Animated bar chart (pure SVG) ── */
const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const REVENUE = [320,540,410,760,630,850,710,920,680,1040,880,1260].map(v => v * 100);

function RevenueChart() {
  const max = Math.max(...REVENUE);
  return (
    <div className="w-full overflow-x-auto">
      <svg viewBox="0 0 700 200" className="w-full h-44 min-w-[400px]">
        <defs>
          <linearGradient id="barG" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor="#4F46E5" />
            <stop offset="100%" stopColor="#6366F1" stopOpacity="0.7" />
          </linearGradient>
        </defs>
        {REVENUE.map((v, i) => {
          const h   = (v / max) * 150;
          const x   = i * 58 + 6;
          const y   = 165 - h;
          return (
            <g key={i}>
              <motion.rect
                x={x} width={42} rx={6}
                initial={{ y: 165, height: 0 }}
                animate={{ y, height: h }}
                transition={{ delay: i * 0.06, duration: 0.7, ease: 'easeOut' }}
                fill="url(#barG)"
                className="cursor-pointer hover:opacity-80 transition-opacity"
              />
              <text x={x + 21} y={185} textAnchor="middle" fill="#94a3b8" fontSize={10}>{MONTHS[i]}</text>
            </g>
          );
        })}
        {/* Horizontal guide lines */}
        {[0,0.25,0.5,0.75,1].map(f => (
          <line key={f} x1={0} x2={700} y1={165 - f * 150} y2={165 - f * 150}
            stroke="#e2e8f0" strokeWidth={1} strokeDasharray="4 4" opacity={0.6} />
        ))}
      </svg>
    </div>
  );
}

const STATUS_COLORS: Record<string, string> = {
  PENDING:   'text-amber-500  bg-amber-50  dark:bg-amber-900/20',
  CONFIRMED: 'text-blue-500   bg-blue-50   dark:bg-blue-900/20',
  DELIVERED: 'text-emerald-500 bg-emerald-50 dark:bg-emerald-900/20',
  CANCELLED: 'text-red-500    bg-red-50    dark:bg-red-900/20',
};
const STATUS_ICONS: Record<string, ElementType> = {
  PENDING: Clock, CONFIRMED: CheckCircle, DELIVERED: Truck,
};

export function Dashboard() {
  const { orders, cars, stats, fetchStats, fetchOrders, fetchCars } = useAppStore();
  const { user } = useAuthStore();

  useEffect(() => {
    void Promise.all([
      fetchStats(),
      fetchOrders(),
      fetchCars(),
    ]);
  }, [fetchCars, fetchOrders, fetchStats]);

  const totalRevenue = stats?.revenue ?? orders
    .filter(o => o.status !== 'CANCELLED' && o.status !== 'PENDING')
    .reduce((s, o) => s + o.price, 0);

  const pendingCount   = orders.filter(o => o.status === 'PENDING').length;
  const deliveredCount = orders.filter(o => o.status === 'DELIVERED').length;
  const newCarsCount   = cars.filter(c => c.condition === 'New').length;

  const statCards = [
    { label: 'Total Revenue',   value: `$${(totalRevenue/1000).toFixed(0)}k`,                  icon: TrendingUp, color: 'text-emerald-600', bg: 'bg-emerald-100 dark:bg-emerald-900/30', change: stats?.fromCache ? 'cached' : 'live' },
    { label: 'Total Orders',    value: String(stats?.orders ?? orders.length),                 icon: ShoppingBag, color: 'text-blue-600',    bg: 'bg-blue-100   dark:bg-blue-900/30',    change: '+8.2%'  },
    { label: 'Active Listings', value: String(stats?.cars ?? cars.length),                     icon: CarFront,    color: 'text-purple-600',  bg: 'bg-purple-100 dark:bg-purple-900/30',  change: '+3.1%'  },
    { label: 'Active Users',    value: String(stats?.users ?? 0),                              icon: Users,       color: 'text-orange-600',  bg: 'bg-orange-100 dark:bg-orange-900/30',  change: `new ${newCarsCount}` },
  ];

  return (
    <div className="max-w-7xl mx-auto w-full">
      {/* Welcome */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">
          Welcome back, {user?.name?.split(' ')[0] ?? 'Admin'} 👋
        </h1>
        <p className="text-gray-400 mt-1">Here's what's happening in your marketplace today.</p>
      </motion.div>

      {/* KPI cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        {statCards.map((s, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1, duration: 0.5 }}
            className="glass-card p-6 flex items-center gap-4 group"
          >
            <div className={`p-3.5 rounded-2xl ${s.bg} ${s.color} group-hover:scale-110 transition-transform duration-300`}>
              <s.icon size={22} />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{s.label}</p>
              <p className="text-2xl font-extrabold text-gray-900 dark:text-white mt-0.5">{s.value}</p>
              <p className="text-xs text-emerald-500 font-semibold flex items-center gap-0.5 mt-0.5">
                <ArrowUpRight size={12} />{s.change} this month
              </p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Revenue chart + recent orders */}
      <div className="grid lg:grid-cols-3 gap-6 mb-8">
        <motion.div
          initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4 }}
          className="lg:col-span-2 glass-card p-6"
        >
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">Monthly Revenue</h2>
            <span className="text-xs text-gray-400 bg-gray-100 dark:bg-white/10 px-2.5 py-1 rounded-lg font-medium">2024</span>
          </div>
          <RevenueChart />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.5 }}
          className="glass-card p-6 flex flex-col"
        >
          <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Recent Orders</h2>
          <div className="flex-1 space-y-3 overflow-hidden">
            {orders.slice(0, 5).map((order, idx) => {
              const Icon = STATUS_ICONS[order.status] ?? Clock;
              return (
                <motion.div
                  key={order.id}
                  initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.55 + idx * 0.08 }}
                  className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-white/40 dark:hover:bg-white/5 transition-colors cursor-pointer"
                >
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${STATUS_COLORS[order.status]}`}>
                    <Icon size={14} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-gray-900 dark:text-white truncate">{order.carTitle}</p>
                    <p className="text-[10px] text-gray-400 truncate">{order.userName}</p>
                  </div>
                  <div className="text-xs font-bold text-gray-900 dark:text-white flex-shrink-0">
                    ${(order.price / 1000).toFixed(0)}k
                  </div>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      </div>

      {/* Order status summary */}
      <motion.div
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}
        className="glass-card p-6"
      >
        <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Order Status Breakdown</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: 'Pending',   count: pendingCount,                                         color: 'bg-amber-500'  },
            { label: 'Confirmed', count: orders.filter(o => o.status === 'CONFIRMED').length,  color: 'bg-blue-500'   },
            { label: 'Delivered', count: deliveredCount,                                        color: 'bg-emerald-500'},
            { label: 'Cancelled', count: orders.filter(o => o.status === 'CANCELLED').length,  color: 'bg-red-500'    },
          ].map(s => (
            <div key={s.label} className="text-center">
              <div className="text-2xl font-extrabold text-gray-900 dark:text-white">{s.count}</div>
              <div className="text-xs text-gray-400 mb-2">{s.label}</div>
              <div className="h-1.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${orders.length ? (s.count / orders.length) * 100 : 0}%` }}
                  transition={{ delay: 0.7, duration: 1, ease: 'easeOut' }}
                  className={`h-full rounded-full ${s.color}`}
                />
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
