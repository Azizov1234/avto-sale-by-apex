import { useEffect, useState } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { useLanguageStore } from '../../store/useLanguageStore';
import type { Order } from '../../types';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import { Trash2 } from 'lucide-react';

const statuses: Order['status'][] = ['PENDING', 'CONFIRMED', 'DELIVERED', 'CANCELLED'];

export function ManageOrders() {
  const { orders, fetchOrders, updateOrderStatus, deleteOrder, addPayment } = useAppStore();
  const { t } = useLanguageStore();
  const [paymentInputs, setPaymentInputs] = useState<Record<string, string>>({});

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

  const handlePaymentInputChange = (orderId: string, value: string) => {
    setPaymentInputs((prev) => ({
      ...prev,
      [orderId]: value,
    }));
  };

  const handleAddPayment = async (order: Order) => {
    if (order.status === 'CANCELLED') {
      toast.error('Cancelled orders cannot accept payment.');
      return;
    }

    if (order.status !== 'CONFIRMED') {
      toast.error('Payment can start only after order is confirmed.');
      return;
    }

    const rawAmount = paymentInputs[order.id]?.trim() ?? '';
    const amount = Number(rawAmount);
    const remainingAmount = order.remainingAmount ?? order.price;

    if (!rawAmount || Number.isNaN(amount) || amount <= 0) {
      toast.error('Enter a valid payment amount.');
      return;
    }

    if (amount > remainingAmount) {
      toast.error(`Amount exceeds remaining balance: ${remainingAmount.toFixed(2)}`);
      return;
    }

    try {
      await addPayment(order.id, amount, 'all');
      setPaymentInputs((prev) => ({
        ...prev,
        [order.id]: '',
      }));
      toast.success('Payment added successfully.');
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : 'Failed to add payment.');
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
                <th className="px-6 py-4">Payment</th>
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
                  <td className="px-6 py-4 min-w-[220px]">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between gap-2 text-xs">
                        <span className="font-semibold text-gray-700">
                          ${(order.totalPaid ?? 0).toLocaleString()} / ${order.price.toLocaleString()}
                        </span>
                        <span
                          className={`rounded-full px-2 py-1 font-bold ${
                            order.isFullyPaid
                              ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300'
                              : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300'
                          }`}
                        >
                          {order.isFullyPaid ? 'Paid' : `${order.paymentProgressPercent ?? 0}%`}
                        </span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-700">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${order.paymentProgressPercent ?? 0}%` }}
                          transition={{ delay: idx * 0.05, duration: 0.6 }}
                          className={`h-full rounded-full ${
                            order.isFullyPaid ? 'bg-emerald-500' : 'bg-primary'
                          }`}
                        />
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-gray-400">
                        <span>Remaining: ${(order.remainingAmount ?? order.price).toLocaleString()}</span>
                        <span>{order.paymentCount ?? 0} payments</span>
                      </div>
                      {!order.isFullyPaid && (
                        <div className="mt-3 border-t border-gray-100 pt-3 dark:border-white/10">
                          {order.status !== 'CONFIRMED' ? (
                            <div className="rounded-lg bg-amber-100 px-2.5 py-2 text-[11px] font-semibold text-amber-700 dark:bg-amber-900/20 dark:text-amber-300">
                              {order.status === 'PENDING'
                                ? 'Approve order first to start payment.'
                                : order.status === 'CANCELLED'
                                  ? 'Cancelled order cannot accept payment.'
                                  : 'Payment is available after confirmation.'}
                            </div>
                          ) : (
                            <div className="flex items-end gap-2">
                              <div className="flex-1">
                                <input
                                  type="number"
                                  min="0.01"
                                  step="0.01"
                                  value={paymentInputs[order.id] ?? ''}
                                  onChange={(event) =>
                                    handlePaymentInputChange(order.id, event.target.value)
                                  }
                                  placeholder={`Up to ${(order.remainingAmount ?? order.price).toFixed(2)}`}
                                  className="w-full rounded-lg border border-gray-200 bg-white px-2.5 py-2 text-xs text-gray-900 outline-none transition-all focus:border-primary/50 focus:ring-2 focus:ring-primary/15 dark:border-white/10 dark:bg-white/5 dark:text-white"
                                />
                              </div>
                              <button
                                type="button"
                                onClick={() => handleAddPayment(order)}
                                className="rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-white shadow-sm shadow-primary/30"
                              >
                                Add payment
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </td>
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
