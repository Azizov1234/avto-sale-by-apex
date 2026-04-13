import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, Calculator } from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import { useAppStore } from '../store/useAppStore';
import { useLanguageStore } from '../store/useLanguageStore';
import type { Car, InstallmentPlan } from '../types';
import toast from 'react-hot-toast';

interface OrderFormProps {
  car: Car;
  onClose: () => void;
}

export function OrderForm({ car, onClose }: OrderFormProps) {
  const { user } = useAuthStore();
  const { addOrder } = useAppStore();
  const { t } = useLanguageStore();
  const plans = (car.installmentPlans || []).filter((plan) => plan.isActive);
  const [selectedPlan, setSelectedPlan] = useState<InstallmentPlan | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const baseDiscount = car.discount ?? 0;
  const combinedDiscount = selectedPlan
    ? Math.min(baseDiscount + selectedPlan.discount, 100)
    : baseDiscount;

  const finalPrice = selectedPlan
    ? car.price -
      (car.price * combinedDiscount) / 100 +
      (car.price * selectedPlan.interest) / 100
    : car.price - (car.price * combinedDiscount) / 100;

  const monthlyPayment = selectedPlan ? finalPrice / selectedPlan.months : 0;

  const handleSubmit = async () => {
    if (!user) {
      toast.error('Please login to place an order.');
      return;
    }

    setIsSubmitting(true);

    try {
      await addOrder({
        carId: car.id,
        orderType: selectedPlan ? 'INSTALLMENT' : 'FULL_PAYMENT',
        ...(selectedPlan ? { planId: selectedPlan.id } : {}),
      });

      toast.success('Order placed successfully!');
      onClose();
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : 'Failed to place order.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="panel-surface flex h-full min-h-0 flex-col md:bg-transparent">
      <div className="min-h-0 flex-1 overflow-y-auto p-6 md:p-8">
        <div className="mb-6 flex items-start justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{car.title}</h2>
            <p className="text-gray-500 dark:text-gray-400">
              {car.brand} | {car.year}
            </p>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold text-gray-900 dark:text-white">
              ${car.price.toLocaleString()}
            </div>
          </div>
        </div>

        <div className="mb-8">
          <h3 className="mb-4 flex items-center gap-2 text-lg font-bold text-gray-900 dark:text-white">
            <Calculator size={20} className="text-primary" />
            {t('selectPlan') || 'Select Installment Plan'}
          </h3>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <button
              type="button"
              onClick={() => setSelectedPlan(null)}
              className={`panel-surface relative overflow-hidden rounded-2xl p-4 text-left transition-all btn-hover-scale ${
                !selectedPlan
                  ? 'border-primary ring-2 ring-primary/20 shadow-lg shadow-primary/10'
                  : 'border-gray-200 dark:border-slate-700'
              }`}
            >
              <div className="mb-1 font-bold text-gray-900 dark:text-white">
                {t('payFull') || 'Pay in Full'}
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                {t('noInterest') || 'No extra interest'}
              </div>
              {!selectedPlan && (
                <motion.div
                  layoutId="plan-outline"
                  className="absolute inset-0 rounded-2xl border-2 border-primary"
                />
              )}
            </button>

            {plans.map((plan, index) => (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                key={plan.id}
                onClick={() => setSelectedPlan(plan)}
                className={`panel-surface relative cursor-pointer overflow-hidden rounded-2xl p-4 transition-all btn-hover-scale ${
                  selectedPlan?.id === plan.id
                    ? 'border-primary ring-2 ring-primary/20 shadow-lg shadow-primary/10'
                    : 'border-gray-200 dark:border-slate-700'
                }`}
              >
                {plan.tag && (
                  <span className="absolute right-0 top-0 rounded-bl-lg bg-secondary px-2 py-1 text-[10px] font-bold text-secondary-foreground shadow-sm">
                    {plan.tag}
                  </span>
                )}

                <div className="mb-1 font-bold text-gray-900 dark:text-white">
                  {plan.months} {t('months') || 'Months'}
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  {plan.interest}% {t('interest') || 'Interest'}
                </div>
                {plan.discount > 0 && (
                  <div className="mt-1 text-xs font-semibold text-emerald-500">
                    +{plan.discount}% plan discount
                  </div>
                )}

                {selectedPlan?.id === plan.id && (
                  <motion.div
                    layoutId="plan-outline"
                    className="absolute inset-0 rounded-2xl border-2 border-primary"
                  />
                )}
              </motion.div>
            ))}
          </div>

          {plans.length === 0 && (
            <p className="mt-3 text-sm text-gray-400 dark:text-gray-500">
              No installment plans available for this vehicle right now.
            </p>
          )}
        </div>

        <AnimatePresence mode="wait">
          {selectedPlan && (
            <motion.div
              key="order-summary"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="panel-surface mb-2 flex flex-col gap-2 rounded-2xl p-4"
            >
              <h4 className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-gray-900 dark:text-white">
                {t('summary')}
              </h4>

              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-500 dark:text-gray-400">{t('basePrice')}</span>
                <span className="font-medium text-gray-900 dark:text-white">
                  ${car.price.toLocaleString()}
                </span>
              </div>

              {combinedDiscount > 0 && (
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-500 dark:text-gray-400">
                    Discount ({combinedDiscount}%)
                  </span>
                  <span className="font-medium text-emerald-500">
                    -${((car.price * combinedDiscount) / 100).toLocaleString()}
                  </span>
                </div>
              )}

              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-500 dark:text-gray-400">
                  {t('interest')} ({selectedPlan.interest}%)
                </span>
                <span className="font-medium text-gray-900 dark:text-white">
                  +${(car.price * (selectedPlan.interest / 100)).toLocaleString()}
                </span>
              </div>

              <div className="flex items-center justify-between border-t border-gray-200 pt-2 dark:border-slate-700">
                <span className="text-sm font-bold text-gray-900 dark:text-white">{t('total')}</span>
                <span className="text-lg font-bold text-primary">
                  ${finalPrice.toLocaleString()}
                </span>
              </div>

              <div className="mt-1 rounded-xl border border-indigo-100 bg-indigo-100/70 p-3 dark:border-indigo-500/20 dark:bg-indigo-950/35">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-indigo-900 dark:text-indigo-200">
                    {t('monthlyPayment')}
                  </span>
                  <span className="text-lg font-bold text-indigo-700 dark:text-indigo-300">
                    ${Math.round(monthlyPayment).toLocaleString()}/mo
                  </span>
                </div>
                <div className="mt-0.5 text-right text-[10px] text-indigo-500 dark:text-indigo-300">
                  {selectedPlan.months} {t('months')}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="sticky bottom-0 z-10 shrink-0 border-t border-gray-200/80 bg-slate-50/95 px-6 py-5 backdrop-blur dark:border-slate-700 dark:bg-slate-950/85 md:px-8">
        <div className="flex gap-4">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="panel-surface flex-1 rounded-xl px-4 py-3 text-sm font-semibold text-gray-700 btn-hover-scale disabled:opacity-50 dark:text-slate-200"
          >
            {t('cancel') || 'Cancel'}
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="btn-hover-scale flex flex-1 items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-white shadow-lg disabled:opacity-50"
          >
            {isSubmitting ? (
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
            ) : (
              <>
                <CheckCircle2 size={18} />
                {t('confirmOrder') || 'Confirm Order'}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
