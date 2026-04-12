import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, Edit2, X, CheckCircle, CreditCard } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import type { InstallmentPlan, InstallmentPlanFormValues } from '../../types';
import toast from 'react-hot-toast';

const BLANK: InstallmentPlanFormValues = {
  carId: '',
  months: 12,
  discount: 0,
  interest: 0,
  isActive: true,
};

const MONTH_OPTIONS = [1, 3, 6, 9, 12, 24];

export function ManageInstallments() {
  const {
    cars,
    installmentPlans,
    fetchCars,
    fetchInstallmentPlans,
    addInstallmentPlan,
    updateInstallmentPlan,
    deleteInstallmentPlan,
  } = useAppStore();
  const activeCars = cars.filter((car) => car.status === 'active');
  const [modal, setModal] = useState<'add' | 'edit' | null>(null);
  const [editing, setEditing] = useState<InstallmentPlan | null>(null);
  const [form, setForm] = useState<InstallmentPlanFormValues>(BLANK);

  useEffect(() => {
    void Promise.all([fetchCars(), fetchInstallmentPlans()]);
  }, [fetchCars, fetchInstallmentPlans]);

  const openAdd = () => {
    setForm(BLANK);
    setEditing(null);
    setModal('add');
  };

  const openEdit = (plan: InstallmentPlan) => {
    setForm({
      carId: plan.carId,
      months: plan.months,
      discount: plan.discount,
      interest: plan.interest,
      isActive: plan.isActive,
    });
    setEditing(plan);
    setModal('edit');
  };

  const closeModal = () => setModal(null);

  const handleSave = async () => {
    if (!form.carId) { toast.error('Please select a car.'); return; }
    if (form.months < 1) { toast.error('Months must be at least 1.'); return; }
    if (form.interest < 0) { toast.error('Interest cannot be negative.'); return; }
    if (form.discount < 0) { toast.error('Discount cannot be negative.'); return; }

    try {
      if (modal === 'edit' && editing) {
        await updateInstallmentPlan(editing.id, form);
        toast.success('Plan updated.');
      } else {
        await addInstallmentPlan(form);
        toast.success('Plan created.');
      }
      closeModal();
    } catch (error: any) {
      toast.error(error.message || 'Failed to save plan.');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this plan?')) return;

    try {
      await deleteInstallmentPlan(id);
      toast.success('Plan deleted.');
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete plan.');
    }
  };

  const toggleActive = async (plan: InstallmentPlan) => {
    try {
      await updateInstallmentPlan(plan.id, { isActive: !plan.isActive });
      toast.success(`Plan ${plan.isActive ? 'disabled' : 'enabled'}.`);
    } catch (error: any) {
      toast.error(error.message || 'Failed to update plan status.');
    }
  };

  const monthly = (price: number) =>
    form.months > 0
      ? (price - (price * form.discount) / 100 + (price * form.interest) / 100) / form.months
      : 0;

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">Installment Plans</h1>
          <p className="text-gray-400 mt-1">Configure financing options for customers.</p>
        </div>
        <button
          onClick={openAdd}
          className="flex items-center gap-2 px-4 py-2.5 bg-primary text-white rounded-xl text-sm font-semibold btn-hover-scale shadow-sm shadow-primary/30"
        >
          <Plus size={17} /> New Plan
        </button>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {installmentPlans.map((plan, i) => (
          <motion.div
            key={plan.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
            className={`glass-card p-6 relative overflow-hidden ${!plan.isActive ? 'opacity-60' : ''}`}
          >
            {plan.tag && (
              <span className="absolute top-0 right-0 bg-accent text-white text-[10px] font-bold px-3 py-1.5 rounded-bl-xl">
                {plan.tag}
              </span>
            )}

            <div className="flex items-center justify-between mb-4">
              <div className="bg-primary/10 p-2.5 rounded-xl">
                <CreditCard size={20} className="text-primary" />
              </div>
              <button
                onClick={() => toggleActive(plan)}
                className={`text-xs font-bold px-3 py-1.5 rounded-full transition-colors ${
                  plan.isActive
                    ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400'
                    : 'bg-gray-100 dark:bg-white/10 text-gray-500 dark:text-gray-400'
                }`}
              >
                {plan.isActive ? <span className="flex items-center gap-1"><CheckCircle size={11} />Active</span> : 'Inactive'}
              </button>
            </div>

            <div className="text-xs text-gray-400 mb-2 truncate">{plan.carTitle}</div>
            <div className="text-4xl font-extrabold text-gray-900 dark:text-white mb-1">{plan.months}</div>
            <div className="text-sm text-gray-400 mb-3">months</div>
            <div className="text-sm text-gray-600 dark:text-gray-300 mb-1">
              Discount: <span className="font-bold text-emerald-500">{plan.discount}%</span>
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-300 mb-1">
              Interest: <span className="font-bold text-gray-900 dark:text-white">
                {plan.interest === 0 ? '0% (Free)' : `${plan.interest}%`}
              </span>
            </div>
            <div className="text-xs text-gray-400 mb-5">
              e.g. $50k car → <span className="font-semibold text-primary">${Math.round((50000 - (50000 * plan.discount) / 100 + (50000 * plan.interest) / 100) / plan.months).toLocaleString()}/mo</span>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => openEdit(plan)}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold text-primary border border-primary/30 hover:bg-primary/10 transition-colors"
              >
                <Edit2 size={13} /> Edit
              </button>
              <button
                onClick={() => handleDelete(plan.id)}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold text-red-500 border border-red-200 dark:border-red-500/30 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
              >
                <Trash2 size={13} /> Delete
              </button>
            </div>
          </motion.div>
        ))}
      </div>

      <AnimatePresence>
        {modal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 modal-backdrop">
            <motion.div
              initial={{ opacity: 0, scale: 0.94, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94, y: 30 }}
              transition={{ type: 'spring', damping: 26 }}
              className="glass-card w-full max-w-md p-7"
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  {modal === 'edit' ? 'Edit Plan' : 'New Installment Plan'}
                </h2>
                <button onClick={closeModal} className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-white/10 transition-colors">
                  <X size={18} className="text-gray-500" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Vehicle</label>
                  <select
                    value={form.carId}
                    onChange={(event) => setForm((prev) => ({ ...prev, carId: event.target.value }))}
                    className="w-full px-4 py-2.5 bg-white/70 dark:bg-white/10 border border-gray-200 dark:border-white/10 rounded-xl text-sm text-gray-900 dark:text-white focus:outline-none input-glow"
                  >
                    <option value="">-- Select a car --</option>
                    {activeCars.map((car) => (
                      <option key={car.id} value={car.id}>
                        {car.title}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Duration (months)</label>
                  <select
                    value={form.months}
                    onChange={(event) => setForm((prev) => ({ ...prev, months: Number(event.target.value) }))}
                    className="w-full px-4 py-2.5 bg-white/70 dark:bg-white/10 border border-gray-200 dark:border-white/10 rounded-xl text-sm text-gray-900 dark:text-white focus:outline-none input-glow"
                  >
                    {MONTH_OPTIONS.map((month) => (
                      <option key={month} value={month}>
                        {month} months
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Discount Rate (%)</label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={form.discount}
                    onChange={(event) => setForm((prev) => ({ ...prev, discount: Number(event.target.value) }))}
                    className="w-full px-4 py-2.5 bg-white/70 dark:bg-white/10 border border-gray-200 dark:border-white/10 rounded-xl text-sm text-gray-900 dark:text-white focus:outline-none input-glow"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Interest Rate (%)</label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={form.interest}
                    onChange={(event) => setForm((prev) => ({ ...prev, interest: Number(event.target.value) }))}
                    className="w-full px-4 py-2.5 bg-white/70 dark:bg-white/10 border border-gray-200 dark:border-white/10 rounded-xl text-sm text-gray-900 dark:text-white focus:outline-none input-glow"
                  />
                </div>

                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.isActive}
                    onChange={(event) => setForm((prev) => ({ ...prev, isActive: event.target.checked }))}
                    className="w-4 h-4 accent-primary rounded"
                  />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Active (visible to customers)</span>
                </label>

                {form.months > 0 && (
                  <div className="bg-indigo-50 dark:bg-indigo-900/20 rounded-xl p-4 text-sm">
                    <div className="text-xs text-indigo-500 font-semibold uppercase mb-1">Preview for $50,000 car</div>
                    <div className="font-bold text-indigo-700 dark:text-indigo-300 text-lg">
                      ${Math.round(monthly(50000)).toLocaleString()}/mo
                    </div>
                    <div className="text-xs text-indigo-400 mt-0.5">
                      Total: ${Math.round(50000 - (50000 * form.discount) / 100 + (50000 * form.interest) / 100).toLocaleString()}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex gap-3 mt-6">
                <button onClick={closeModal} className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                  Cancel
                </button>
                <button onClick={handleSave} className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white bg-primary btn-hover-scale shadow-sm shadow-primary/30">
                  {modal === 'edit' ? 'Save Changes' : 'Create Plan'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
