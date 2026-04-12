import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, ShoppingBag, CarFront, DollarSign, ArrowUpRight } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';

/* ─── Monthly revenue data ─── */
const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const REV    = [320,540,410,760,630,850,710,920,680,1040,880,1260].map(v => v * 1000);
const ORDERS_DATA = [12,18,14,26,22,31,28,35,24,38,33,47];

/* ─── Bar chart ─── */
function BarChart({ data, color = '#4F46E5', formatter = (v: number) => `$${(v/1000).toFixed(0)}k` }: {
  data: number[]; color?: string; formatter?: (v: number) => string;
}) {
  const [hovered, setHovered] = useState(-1);
  const max = Math.max(...data);
  return (
    <div className="w-full overflow-x-auto">
      <svg viewBox="0 0 700 200" className="w-full h-44 min-w-[400px]">
        <defs>
          <linearGradient id={`bg_${color.replace('#','')}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor={color} />
            <stop offset="100%" stopColor={color} stopOpacity="0.5" />
          </linearGradient>
        </defs>
        {/* Grid lines */}
        {[0, 0.25, 0.5, 0.75, 1].map(f => (
          <line key={f} x1={0} x2={700} y1={158 - f * 140} y2={158 - f * 140}
            stroke="currentColor" strokeWidth={1} strokeDasharray="4 4" className="text-gray-200 dark:text-gray-700" opacity={0.7} />
        ))}
        {data.map((v, i) => {
          const h = (v / max) * 140;
          const x = i * 58 + 4; const y = 158 - h;
          const isHov = hovered === i;
          return (
            <g key={i}
              onMouseEnter={() => setHovered(i)}
              onMouseLeave={() => setHovered(-1)}
              className="cursor-pointer"
            >
              <motion.rect
                x={x} width={44} rx={7}
                initial={{ y: 158, height: 0 }}
                animate={{ y, height: h }}
                transition={{ delay: i * 0.06, duration: 0.7, ease: 'easeOut' }}
                fill={`url(#bg_${color.replace('#','')})`}
                opacity={isHov ? 1 : 0.85}
              />
              {isHov && (
                <g>
                  <rect x={x - 5} y={y - 28} width={54} height={22} rx={5} fill="#1e293b" />
                  <text x={x + 22} y={y - 13} textAnchor="middle" fill="white" fontSize={10} fontWeight="bold">
                    {formatter(v)}
                  </text>
                </g>
              )}
              <text x={x + 22} y={178} textAnchor="middle" fill="#94a3b8" fontSize={10}>{MONTHS[i]}</text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

/* ─── Donut chart for order status ─── */
function DonutChart({ data }: { data: { label: string; value: number; color: string }[] }) {
  const total = data.reduce((s, d) => s + d.value, 0) || 1;
  let cumAngle = -Math.PI / 2;
  const R = 60, cx = 80, cy = 80;

  const slices = data.map(d => {
    const angle = (d.value / total) * 2 * Math.PI;
    const x1 = cx + R * Math.cos(cumAngle);
    const y1 = cy + R * Math.sin(cumAngle);
    cumAngle += angle;
    const x2 = cx + R * Math.cos(cumAngle);
    const y2 = cy + R * Math.sin(cumAngle);
    const largeArc = angle > Math.PI ? 1 : 0;
    return { ...d, d: `M ${cx} ${cy} L ${x1} ${y1} A ${R} ${R} 0 ${largeArc} 1 ${x2} ${y2} Z` };
  });

  return (
    <div className="flex items-center gap-6 flex-wrap">
      <svg viewBox="0 0 160 160" className="w-36 h-36 flex-shrink-0">
        {slices.map((s, i) => (
          <motion.path
            key={i} d={s.d} fill={s.color}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            transition={{ delay: i * 0.15 }}
            className="hover:opacity-80 transition-opacity cursor-pointer"
          />
        ))}
        <circle cx={cx} cy={cy} r={38} fill="white" className="dark:fill-gray-800" />
        <text x={cx} y={cy - 5} textAnchor="middle" fill="#94a3b8" fontSize={9}>Total</text>
        <text x={cx} y={cy + 10} textAnchor="middle" fill="currentColor" fontSize={16} fontWeight="bold" className="text-gray-900">{total}</text>
      </svg>
      <div className="space-y-2">
        {data.map(d => (
          <div key={d.label} className="flex items-center gap-2 text-sm">
            <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: d.color }} />
            <span className="text-gray-600 dark:text-gray-400">{d.label}</span>
            <span className="font-bold text-gray-900 dark:text-white ml-auto">{d.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function Analytics() {
  const { orders, cars, fetchOrders, fetchCars } = useAppStore();

  useEffect(() => {
    void Promise.all([fetchOrders(), fetchCars()]);
  }, [fetchCars, fetchOrders]);

  const totalRevenue = orders
    .filter(o => o.status !== 'CANCELLED')
    .reduce((s, o) => s + o.price, 0);

  const avgOrderValue = orders.length ? totalRevenue / orders.length : 0;

  const topCars = [...cars]
    .map(c => ({
      ...c,
      orderCount: orders.filter(o => o.carId === c.id).length,
      revenue: orders.filter(o => o.carId === c.id).reduce((s, o) => s + o.price, 0),
    }))
    .sort((a, b) => b.orderCount - a.orderCount)
    .slice(0, 5);

  const statusBreakdown = [
    { label: 'Pending',   value: orders.filter(o => o.status === 'PENDING').length,   color: '#F59E0B' },
    { label: 'Confirmed', value: orders.filter(o => o.status === 'CONFIRMED').length,  color: '#3B82F6' },
    { label: 'Delivered', value: orders.filter(o => o.status === 'DELIVERED').length,  color: '#10B981' },
    { label: 'Cancelled', value: orders.filter(o => o.status === 'CANCELLED').length,  color: '#EF4444' },
  ];

  const kpis = [
    { label: 'Total Revenue', value: `$${(totalRevenue/1000).toFixed(0)}k`, icon: DollarSign, color: 'text-emerald-600', bg: 'bg-emerald-100 dark:bg-emerald-900/30', change: '+18.4%' },
    { label: 'Total Orders',  value: orders.length, icon: ShoppingBag, color: 'text-blue-600', bg: 'bg-blue-100 dark:bg-blue-900/30', change: '+12%' },
    { label: 'Avg Order',     value: `$${(avgOrderValue/1000).toFixed(0)}k`, icon: TrendingUp, color: 'text-purple-600', bg: 'bg-purple-100 dark:bg-purple-900/30', change: '+5.7%' },
    { label: 'Listings',      value: cars.length, icon: CarFront, color: 'text-orange-600', bg: 'bg-orange-100 dark:bg-orange-900/30', change: '+3' },
  ];

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">Analytics</h1>
        <p className="text-gray-400 mt-1">Insights into your marketplace performance.</p>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        {kpis.map((k, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="glass-card p-5 flex items-center gap-4"
          >
            <div className={`p-3 rounded-xl ${k.bg} ${k.color}`}><k.icon size={20} /></div>
            <div>
              <p className="text-xs text-gray-400">{k.label}</p>
              <p className="text-xl font-extrabold text-gray-900 dark:text-white">{k.value}</p>
              <p className="text-xs text-emerald-500 font-semibold flex items-center gap-0.5 mt-0.5">
                <ArrowUpRight size={11} />{k.change}
              </p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Revenue chart */}
      <motion.div
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
        className="glass-card p-6 mb-6"
      >
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">Monthly Revenue (2024)</h2>
          <span className="text-xs text-emerald-500 font-semibold bg-emerald-50 dark:bg-emerald-900/20 px-2.5 py-1 rounded-lg">
            <ArrowUpRight size={11} className="inline" /> +18.4% YoY
          </span>
        </div>
        <BarChart data={REV} color="#4F46E5" />
      </motion.div>

      {/* Orders chart + Donut */}
      <div className="grid lg:grid-cols-2 gap-6 mb-6">
        <motion.div
          initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4 }}
          className="glass-card p-6"
        >
          <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Monthly Orders (2024)</h2>
          <BarChart data={ORDERS_DATA} color="#F59E0B" formatter={v => String(v)} />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.45 }}
          className="glass-card p-6"
        >
          <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-5">Order Status Distribution</h2>
          <DonutChart data={statusBreakdown} />
        </motion.div>
      </div>

      {/* Top cars */}
      <motion.div
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
        className="glass-card p-6"
      >
        <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-5">Top Selling Vehicles</h2>
        <div className="space-y-4">
          {topCars.map((car, i) => (
            <div key={car.id} className="flex items-center gap-4">
              <span className="w-6 text-sm font-bold text-gray-400">#{i + 1}</span>
              <img src={car.image} alt={car.title} className="w-12 h-10 rounded-xl object-cover border border-white/20 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{car.title}</p>
                <p className="text-xs text-gray-400">{car.orderCount} orders · ${(car.revenue/1000).toFixed(0)}k revenue</p>
              </div>
              <div className="w-32">
                <div className="h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${topCars[0].orderCount ? (car.orderCount / topCars[0].orderCount) * 100 : 0}%` }}
                    transition={{ delay: 0.6 + i * 0.1, duration: 0.8, ease: 'easeOut' }}
                    className="h-full progress-bar"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
