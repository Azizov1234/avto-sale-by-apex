import { useEffect, useState, type ElementType } from 'react';
import { motion } from 'framer-motion';
import { Search, Car, ShoppingCart, Users, Tag, CreditCard, ScrollText } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import type { AdminActionLogEntry } from '../../types';

const TARGET_ICONS: Record<AdminActionLogEntry['targetType'], ElementType> = {
  Car: Car, Order: ShoppingCart, User: Users, Campaign: Tag, Plan: CreditCard,
};

const ACTION_COLORS: Record<string, string> = {
  CREATE: 'badge-active',
  UPDATE: 'text-blue-600   bg-blue-50   dark:bg-blue-900/20',
  DELETE: 'text-red-600    bg-red-50    dark:bg-red-900/20',
  REMOVE: 'text-red-600    bg-red-50    dark:bg-red-900/20',
};

function timeAgo(ts: string) {
  const diff = (Date.now() - new Date(ts).getTime()) / 1000;
  if (diff < 60)   return 'Just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400)return `${Math.floor(diff / 3600)}h ago`;
  return new Date(ts).toLocaleDateString();
}

export function AdminActionLog() {
  const { actionLogs, fetchActionLogs } = useAppStore();
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<string>('All');

  useEffect(() => {
    void fetchActionLogs();
  }, [fetchActionLogs]);

  const types = ['All', 'Car', 'Order', 'User', 'Campaign', 'Plan'];

  const filtered = actionLogs.filter(log => {
    const q = search.toLowerCase();
    const matchQ = !q || log.action.toLowerCase().includes(q) || log.adminName.toLowerCase().includes(q) || (log.details ?? '').toLowerCase().includes(q);
    const matchT = filterType === 'All' || log.targetType === filterType;
    return matchQ && matchT;
  });

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">Action Logs</h1>
          <p className="text-gray-400 mt-1">Full audit trail of all admin actions.</p>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 bg-white/60 dark:bg-white/10 border border-white/40 dark:border-white/10 rounded-xl px-4 py-2">
          <ScrollText size={15} /> {actionLogs.length} entries
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Search logs..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 bg-white/70 dark:bg-white/10 border border-gray-200 dark:border-white/10 rounded-xl text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none input-glow transition-all-smooth"
          />
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {types.map(t => (
            <button
              key={t}
              onClick={() => setFilterType(t)}
              className={`px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                filterType === t
                  ? 'bg-primary text-white shadow-sm shadow-primary/30'
                  : 'bg-white/60 dark:bg-white/10 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-white/10 hover:border-primary hover:text-primary'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Log entries */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card overflow-hidden"
      >
        {filtered.length === 0 ? (
          <div className="p-10 text-center text-gray-400">
            <ScrollText size={40} className="mx-auto mb-3 opacity-30" />
            No matching log entries found.
          </div>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-white/10">
            {filtered.map((log, i) => {
              const TargetIcon = TARGET_ICONS[log.targetType];
              const actionKey = Object.keys(ACTION_COLORS).find((key) => log.action.includes(key));
              const actionColor = (actionKey ? ACTION_COLORS[actionKey] : undefined) ?? 'text-gray-600 bg-gray-100';
              return (
                <motion.div
                  key={log.id}
                  initial={{ opacity: 0, x: -16 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className="flex items-start gap-4 p-4 sm:p-5 hover:bg-white/40 dark:hover:bg-white/5 transition-colors"
                >
                  {/* Icon */}
                  <div className="flex-shrink-0 w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center mt-0.5">
                    <TargetIcon size={18} className="text-primary" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span className={`text-[10px] font-bold uppercase tracking-wide px-2.5 py-0.5 rounded-full ${actionColor}`}>
                        {log.action}
                      </span>
                      <span className="text-xs font-bold text-gray-700 dark:text-gray-300">{log.targetType}</span>
                      <span className="text-xs font-mono text-gray-400">#{log.targetId}</span>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{log.details}</p>
                  </div>

                  <div className="flex-shrink-0 text-right">
                    <p className="text-xs font-semibold text-gray-700 dark:text-gray-300">{log.adminName}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{timeAgo(log.timestamp)}</p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </motion.div>
    </div>
  );
}
