import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  ArrowUpRight,
  CarFront,
  DollarSign,
  ShoppingBag,
  TrendingUp,
} from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { MONTH_LABELS, buildMonthlyOrderSeries } from '../../lib/analytics';

function BarChart({
  data,
  color = '#4F46E5',
  formatter = (value: number) => `$${(value / 1000).toFixed(0)}k`,
}: {
  data: number[];
  color?: string;
  formatter?: (value: number) => string;
}) {
  const [hovered, setHovered] = useState(-1);
  const max = Math.max(...data, 1);

  return (
    <div className="w-full overflow-x-auto">
      <svg viewBox="0 0 700 200" className="w-full h-44 min-w-[400px]">
        <defs>
          <linearGradient id={`bg_${color.replace('#', '')}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} />
            <stop offset="100%" stopColor={color} stopOpacity="0.5" />
          </linearGradient>
        </defs>
        {[0, 0.25, 0.5, 0.75, 1].map((fraction) => (
          <line
            key={fraction}
            x1={0}
            x2={700}
            y1={158 - fraction * 140}
            y2={158 - fraction * 140}
            stroke="currentColor"
            strokeWidth={1}
            strokeDasharray="4 4"
            className="text-gray-200 dark:text-gray-700"
            opacity={0.7}
          />
        ))}
        {data.map((value, index) => {
          const height = (value / max) * 140;
          const x = index * 58 + 4;
          const y = 158 - height;
          const isHovered = hovered === index;

          return (
            <g
              key={MONTH_LABELS[index]}
              onMouseEnter={() => setHovered(index)}
              onMouseLeave={() => setHovered(-1)}
              className="cursor-pointer"
            >
              <motion.rect
                x={x}
                width={44}
                rx={7}
                initial={{ y: 158, height: 0 }}
                animate={{ y, height }}
                transition={{ delay: index * 0.06, duration: 0.7, ease: 'easeOut' }}
                fill={`url(#bg_${color.replace('#', '')})`}
                opacity={isHovered ? 1 : 0.85}
              />
              {isHovered && (
                <g>
                  <rect x={x - 5} y={y - 28} width={54} height={22} rx={5} fill="#1e293b" />
                  <text
                    x={x + 22}
                    y={y - 13}
                    textAnchor="middle"
                    fill="white"
                    fontSize={10}
                    fontWeight="bold"
                  >
                    {formatter(value)}
                  </text>
                </g>
              )}
              <text
                x={x + 22}
                y={178}
                textAnchor="middle"
                fill="#94a3b8"
                fontSize={10}
              >
                {MONTH_LABELS[index]}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

function DonutChart({
  data,
}: {
  data: { label: string; value: number; color: string }[];
}) {
  const total = data.reduce((sum, item) => sum + item.value, 0) || 1;
  const radius = 60;
  const cx = 80;
  const cy = 80;

  const slices = data.reduce<
    Array<{ label: string; value: number; color: string; path: string }>
  >((accumulator, item) => {
    const previousAngle = accumulator.reduce(
      (sum, entry) => sum + (entry.value / total) * 2 * Math.PI,
      -Math.PI / 2,
    );
    const angle = (item.value / total) * 2 * Math.PI;
    const nextAngle = previousAngle + angle;
    const x1 = cx + radius * Math.cos(previousAngle);
    const y1 = cy + radius * Math.sin(previousAngle);
    const x2 = cx + radius * Math.cos(nextAngle);
    const y2 = cy + radius * Math.sin(nextAngle);
    const largeArc = angle > Math.PI ? 1 : 0;

    accumulator.push({
      ...item,
      path: `M ${cx} ${cy} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} Z`,
    });

    return accumulator;
  }, []);

  return (
    <div className="flex items-center gap-6 flex-wrap">
      <svg viewBox="0 0 160 160" className="w-36 h-36 flex-shrink-0">
        {slices.map((slice, index) => (
          <motion.path
            key={slice.label}
            d={slice.path}
            fill={slice.color}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: index * 0.15 }}
            className="hover:opacity-80 transition-opacity cursor-pointer"
          />
        ))}
        <circle cx={cx} cy={cy} r={38} fill="white" className="dark:fill-gray-800" />
        <text x={cx} y={cy - 5} textAnchor="middle" fill="#94a3b8" fontSize={9}>
          Total
        </text>
        <text
          x={cx}
          y={cy + 10}
          textAnchor="middle"
          fill="currentColor"
          fontSize={16}
          fontWeight="bold"
          className="text-gray-900"
        >
          {total}
        </text>
      </svg>
      <div className="space-y-2">
        {data.map((item) => (
          <div key={item.label} className="flex items-center gap-2 text-sm">
            <div
              className="w-3 h-3 rounded-full flex-shrink-0"
              style={{ background: item.color }}
            />
            <span className="text-gray-600 dark:text-gray-400">{item.label}</span>
            <span className="font-bold text-gray-900 dark:text-white ml-auto">
              {item.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function Analytics() {
  const { cars, fetchCars, fetchOrders, orders } = useAppStore();

  useEffect(() => {
    void Promise.all([fetchOrders(), fetchCars()]);
  }, [fetchCars, fetchOrders]);

  const { counts: monthlyOrders, revenue: monthlyRevenue } = useMemo(
    () => buildMonthlyOrderSeries(orders),
    [orders],
  );

  const totalRevenue = orders
    .filter((order) => order.status !== 'CANCELLED')
    .reduce((sum, order) => sum + order.price, 0);

  const avgOrderValue = orders.length ? totalRevenue / orders.length : 0;
  const deliveredOrders = orders.filter((order) => order.status === 'DELIVERED').length;

  const topCars = useMemo(
    () =>
      [...cars]
        .map((car) => ({
          ...car,
          orderCount: orders.filter((order) => order.carId === car.id).length,
          revenue: orders
            .filter((order) => order.carId === car.id && order.status !== 'CANCELLED')
            .reduce((sum, order) => sum + order.price, 0),
        }))
        .sort((first, second) => second.orderCount - first.orderCount)
        .slice(0, 5),
    [cars, orders],
  );

  const statusBreakdown = [
    { label: 'Pending', value: orders.filter((order) => order.status === 'PENDING').length, color: '#F59E0B' },
    { label: 'Confirmed', value: orders.filter((order) => order.status === 'CONFIRMED').length, color: '#3B82F6' },
    { label: 'Delivered', value: deliveredOrders, color: '#10B981' },
    { label: 'Cancelled', value: orders.filter((order) => order.status === 'CANCELLED').length, color: '#EF4444' },
  ];

  const kpis = [
    {
      label: 'Total Revenue',
      value: `$${(totalRevenue / 1000).toFixed(0)}k`,
      icon: DollarSign,
      color: 'text-emerald-600',
      bg: 'bg-emerald-100 dark:bg-emerald-900/30',
      change: `${deliveredOrders} delivered`,
    },
    {
      label: 'Total Orders',
      value: orders.length,
      icon: ShoppingBag,
      color: 'text-blue-600',
      bg: 'bg-blue-100 dark:bg-blue-900/30',
      change: `${statusBreakdown[0].value} pending`,
    },
    {
      label: 'Avg Order',
      value: `$${(avgOrderValue / 1000).toFixed(0)}k`,
      icon: TrendingUp,
      color: 'text-purple-600',
      bg: 'bg-purple-100 dark:bg-purple-900/30',
      change: 'live data',
    },
    {
      label: 'Listings',
      value: cars.length,
      icon: CarFront,
      color: 'text-orange-600',
      bg: 'bg-orange-100 dark:bg-orange-900/30',
      change: `${cars.filter((car) => car.condition === 'New').length} new`,
    },
  ];

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">
          Analytics
        </h1>
        <p className="text-gray-400 mt-1">
          Insights powered by current backend orders, cars and payment totals.
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        {kpis.map((kpi, index) => (
          <motion.div
            key={kpi.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="glass-card p-5 flex items-center gap-4"
          >
            <div className={`p-3 rounded-xl ${kpi.bg} ${kpi.color}`}>
              <kpi.icon size={20} />
            </div>
            <div>
              <p className="text-xs text-gray-400">{kpi.label}</p>
              <p className="text-xl font-extrabold text-gray-900 dark:text-white">
                {kpi.value}
              </p>
              <p className="text-xs text-emerald-500 font-semibold flex items-center gap-0.5 mt-0.5">
                <ArrowUpRight size={11} /> {kpi.change}
              </p>
            </div>
          </motion.div>
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="glass-card p-6 mb-6"
      >
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">Monthly Revenue</h2>
          <span className="text-xs text-emerald-500 font-semibold bg-emerald-50 dark:bg-emerald-900/20 px-2.5 py-1 rounded-lg">
            <ArrowUpRight size={11} className="inline" /> backend sourced
          </span>
        </div>
        <BarChart data={monthlyRevenue} color="#4F46E5" />
      </motion.div>

      <div className="grid lg:grid-cols-2 gap-6 mb-6">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
          className="glass-card p-6"
        >
          <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Monthly Orders</h2>
          <BarChart data={monthlyOrders} color="#F59E0B" formatter={(value) => String(value)} />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.45 }}
          className="glass-card p-6"
        >
          <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-5">
            Order Status Distribution
          </h2>
          <DonutChart data={statusBreakdown} />
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="glass-card p-6"
      >
        <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-5">
          Top Selling Vehicles
        </h2>
        {topCars.length === 0 ? (
          <div className="text-sm text-gray-400">No order data available yet.</div>
        ) : (
          <div className="space-y-4">
            {topCars.map((car, index) => (
              <div key={car.id} className="flex items-center gap-4">
                <span className="w-6 text-sm font-bold text-gray-400">#{index + 1}</span>
                <img
                  src={car.image}
                  alt={car.title}
                  className="w-12 h-10 rounded-xl object-cover border border-white/20 flex-shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                    {car.title}
                  </p>
                  <p className="text-xs text-gray-400">
                    {car.orderCount} orders | ${(car.revenue / 1000).toFixed(0)}k revenue
                  </p>
                </div>
                <div className="w-32">
                  <div className="h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{
                        width: `${topCars[0].orderCount ? (car.orderCount / topCars[0].orderCount) * 100 : 0}%`,
                      }}
                      transition={{ delay: 0.6 + index * 0.1, duration: 0.8, ease: 'easeOut' }}
                      className="h-full progress-bar"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
}
