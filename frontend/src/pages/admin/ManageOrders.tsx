import { useEffect } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { useLanguageStore } from '../../store/useLanguageStore';
import type { Order } from '../../types';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import { Trash2 } from 'lucide-react';

const statuses: Order['status'][] = ['PENDING', 'CONFIRMED', 'DELIVERED', 'CANCELLED'];

export function ManageOrders() {
  const { orders, fetchOrders, updateOrderStatus, deleteOrder } = useAppStore();
  const { t } = useLanguageStore();

  useEffect(() => {
    void fetchOrders();
  }, [fetchOrders]);

  const handleStatusChange = async (id: string, status: Order['status']) => {
    try {
      await updateOrderStatus(id, status);
      toast.success(`${t('status')} ${t('orderStatusUpdated') || 'updated to'} ${t(status.toLowerCase())}`);
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : 'Failed to update order status.');
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm(t('confirmDelete') || 'Are you sure you want to delete this order?')) {
      try {
        await deleteOrder(id);
        toast.success(t('orderDeleted') || 'Order deleted successfully');
      } catch (error: unknown) {
        toast.error(error instanceof Error ? error.message : 'Failed to delete order.');
      }
    }
  };

  const statusColors: Record<Order['status'], string> = {
    PENDING: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
    CONFIRMED: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    DELIVERED: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
    CANCELLED: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  };

  return (
    <div className="max-w-7xl mx-auto w-full">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">{t('orders') || 'Orders'}</h1>
        <p className="text-gray-500 mt-1">{t('manageOrdersDesc') || 'Manage customer purchases.'}</p>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="glass-card overflow-hidden"
      >
        <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
          <table className="w-full text-left text-sm text-gray-600 border-collapse">
            <thead className="sticky top-0 z-10 text-xs uppercase bg-gray-50/95 backdrop-blur-sm text-gray-500 font-semibold border-b border-border">
              <tr>
                <th className="px-6 py-4">{t('orderId')}</th>
                <th className="px-6 py-4">{t('customer')}</th>
                <th className="px-6 py-4">{t('vehicle')}</th>
                <th className="px-6 py-4">{t('date')}</th>
                <th className="px-6 py-4">{t('amount')}</th>
                <th className="px-6 py-4">{t('status')}</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {orders.map((order, idx) => (
                <motion.tr 
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  key={order.id} 
                  className="hover:bg-white/40 transition-colors"
                >
                  <td className="px-6 py-4 font-mono text-xs text-gray-500">#{order.id.toUpperCase()}</td>
                  <td className="px-6 py-4 font-medium text-gray-900">{order.userName}</td>
                  <td className="px-6 py-4">{order.carTitle}</td>
                  <td className="px-6 py-4">{order.date}</td>
                  <td className="px-6 py-4 font-medium text-gray-900">${order.price.toLocaleString()}</td>
                  <td className="px-6 py-4">
                    <select
                      value={order.status}
                      onChange={(e) => handleStatusChange(order.id, e.target.value as Order['status'])}
                      className={`text-xs font-semibold px-3 py-1.5 rounded-lg border border-white/40 shadow-sm cursor-pointer focus:ring-2 focus:ring-primary/20 outline-none appearance-none transition-all-smooth ${statusColors[order.status]}`}
                    >
                      {statuses.map(s => (
                        <option key={s} value={s} className="bg-white text-gray-900">{t(s.toLowerCase())}</option>
                      ))}
                    </select>
                  </td>
                  <td className="px-6 py-4 flex justify-end">
                    <button
                      onClick={() => handleDelete(order.id)}
                      title="Delete order"
                      className="p-2 text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg btn-hover-scale"
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
          {orders.length === 0 && (
             <div className="p-8 text-center text-gray-500">
             No orders found.
           </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
