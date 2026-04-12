import type { Order } from '../types';

export const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export function buildMonthlyOrderSeries(orders: Order[]) {
  const revenue = Array.from({ length: 12 }, () => 0);
  const counts = Array.from({ length: 12 }, () => 0);

  orders.forEach((order) => {
    if (!order.date) {
      return;
    }

    const orderDate = new Date(order.date);
    const monthIndex = orderDate.getMonth();

    if (Number.isNaN(monthIndex) || monthIndex < 0 || monthIndex > 11) {
      return;
    }

    counts[monthIndex] += 1;

    if (order.status !== 'CANCELLED') {
      revenue[monthIndex] += order.price;
    }
  });

  return { revenue, counts };
}
