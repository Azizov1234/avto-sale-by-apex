import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, Edit2, X, Tag, Calendar } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import type { CampaignFormValues, DiscountCampaign } from '../../types';
import toast from 'react-hot-toast';

const BLANK: CampaignFormValues = {
  name: '', discount: 5, startDate: '', endDate: '', carIds: [], description: '',
};

export function DiscountCampaigns() {
  const { campaigns, cars, fetchCampaigns, fetchCars, addCampaign, updateCampaign, deleteCampaign } = useAppStore();
  const activeCars = cars.filter((car) => car.status === 'active');
  const [modal, setModal]     = useState<'add' | 'edit' | null>(null);
  const [editing, setEditing] = useState<DiscountCampaign | null>(null);
  const [form, setForm]       = useState<CampaignFormValues>(BLANK);

  useEffect(() => {
    void Promise.all([fetchCampaigns(), fetchCars()]);
  }, [fetchCampaigns, fetchCars]);

  const openAdd  = () => { setForm(BLANK); setEditing(null); setModal('add'); };
  const openEdit = (c: DiscountCampaign) => {
    setForm({ name: c.name, discount: c.discount, startDate: c.startDate, endDate: c.endDate, carIds: c.carIds, description: c.description ?? '' });
    setEditing(c);
    setModal('edit');
  };
  const closeModal = () => setModal(null);

  const toggleCar = (id: string) =>
    setForm(p => ({
      ...p,
      carIds: p.carIds.includes(id) ? p.carIds.filter(c => c !== id) : [...p.carIds, id],
    }));

  const handleSave = async () => {
    if (!form.name.trim())  { toast.error('Campaign name is required.'); return; }
    if (form.discount <= 0) { toast.error('Discount must be greater than 0.'); return; }
    if (!form.startDate)    { toast.error('Start date is required.'); return; }
    if (!form.endDate)      { toast.error('End date is required.'); return; }

    try {
      if (modal === 'edit' && editing) {
        await updateCampaign(editing.id, form);
        toast.success('Campaign updated.');
      } else {
        await addCampaign(form);
        toast.success('Campaign created!');
      }
      closeModal();
    } catch (error: any) {
      toast.error(error.message || 'Failed to save campaign.');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this campaign?')) return;
    try {
      await deleteCampaign(id);
      toast.success('Campaign deleted.');
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete campaign.');
    }
  };

  const now = new Date().toISOString().split('T')[0];
  const isLive = (c: DiscountCampaign) => c.state === 'active' && c.startDate <= now && c.endDate >= now;

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">Discount Campaigns</h1>
          <p className="text-gray-400 mt-1">Create and manage promotional discount campaigns.</p>
        </div>
        <button
          onClick={openAdd}
          className="flex items-center gap-2 px-4 py-2.5 bg-primary text-white rounded-xl text-sm font-semibold btn-hover-scale shadow-sm shadow-primary/30"
        >
          <Plus size={17} /> New Campaign
        </button>
      </div>

      {/* Campaign cards */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {campaigns.map((camp, i) => (
          <motion.div
            key={camp.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
            className={`glass-card p-6 relative overflow-hidden flex flex-col ${camp.state !== 'active' ? 'opacity-65' : ''}`}
          >
            {/* Live badge */}
            {isLive(camp) && (
              <div className="absolute top-3 right-3 flex items-center gap-1 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold px-2.5 py-1 rounded-full">
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                LIVE
              </div>
            )}

            {/* Icon + discount */}
            <div className="flex items-start gap-3 mb-4">
              <div className="p-2.5 bg-amber-100 dark:bg-amber-900/30 rounded-xl">
                <Tag size={20} className="text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900 dark:text-white leading-tight">{camp.name}</h3>
                {camp.description && (
                  <p className="text-xs text-gray-400 mt-0.5 line-clamp-2">{camp.description}</p>
                )}
              </div>
            </div>

            {/* Discount value */}
            <div className="text-4xl font-extrabold text-accent mb-1">{camp.discount}%</div>
            <div className="text-xs text-gray-400 mb-4">discount applied</div>

            {/* Dates */}
            <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 mb-3">
              <Calendar size={13} />
              <span>{camp.startDate}</span>
              <span className="text-gray-300">→</span>
              <span>{camp.endDate}</span>
            </div>

            {/* Affected cars */}
            <div className="mb-5">
              <p className="text-[10px] text-gray-400 uppercase font-semibold mb-1.5">
                Applied to {camp.carIds.length} vehicle{camp.carIds.length !== 1 ? 's' : ''}
              </p>
              <div className="flex -space-x-2 overflow-hidden">
                {camp.carIds.slice(0, 5).map(cid => {
                  const car = cars.find(c => c.id === cid);
                  return car ? (
                    <img
                      key={cid}
                      src={car.image}
                      alt={car.title}
                      title={car.title}
                      className="w-8 h-8 rounded-full object-cover border-2 border-white dark:border-gray-800"
                    />
                  ) : null;
                })}
                {camp.carIds.length > 5 && (
                  <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 border-2 border-white dark:border-gray-800 flex items-center justify-center text-[10px] font-bold text-gray-500">
                    +{camp.carIds.length - 5}
                  </div>
                )}
              </div>
            </div>

            {/* Status + actions */}
            <div className="mt-auto flex gap-2">
              <button
                type="button"
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold border transition-colors ${
                  camp.state === 'active'
                    ? 'border-emerald-200 dark:border-emerald-700 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20'
                    : 'border-gray-200 dark:border-white/10 text-gray-500 hover:bg-gray-50 dark:hover:bg-white/5'
                }`}
              >
                {camp.state.toUpperCase()}
              </button>
              <button
                onClick={() => openEdit(camp)}
                className="p-2 text-gray-400 hover:text-primary hover:bg-primary/10 rounded-xl transition-colors btn-hover-scale"
                title="Edit"
              >
                <Edit2 size={15} />
              </button>
              <button
                onClick={() => handleDelete(camp.id)}
                className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors btn-hover-scale"
                title="Delete"
              >
                <Trash2 size={15} />
              </button>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Modal */}
      <AnimatePresence>
        {modal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 modal-backdrop">
            <motion.div
              initial={{ opacity: 0, scale: 0.93, y: 24 }}
              animate={{ opacity: 1, scale: 1,    y: 0  }}
              exit={{ opacity: 0, scale: 0.93,    y: 24 }}
              transition={{ type: 'spring', damping: 26 }}
              className="glass-card w-full max-w-lg p-7 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  {modal === 'edit' ? 'Edit Campaign' : 'New Campaign'}
                </h2>
                <button onClick={closeModal} className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-white/10 transition-colors">
                  <X size={18} className="text-gray-500" />
                </button>
              </div>

              <div className="space-y-4">
                {/* Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Campaign Name</label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                    placeholder="e.g. Summer Sale 2024"
                    className="w-full px-4 py-2.5 bg-white/70 dark:bg-white/10 border border-gray-200 dark:border-white/10 rounded-xl text-sm text-gray-900 dark:text-white focus:outline-none input-glow"
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description (optional)</label>
                  <textarea
                    rows={2}
                    value={form.description}
                    onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                    placeholder="Short description of this campaign..."
                    className="w-full px-4 py-2.5 bg-white/70 dark:bg-white/10 border border-gray-200 dark:border-white/10 rounded-xl text-sm text-gray-900 dark:text-white focus:outline-none input-glow resize-none"
                  />
                </div>

                {/* Discount */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Discount: <span className="text-accent font-bold">{form.discount}%</span>
                  </label>
                  <input
                    type="range" min={1} max={50} step={1}
                    value={form.discount}
                    onChange={e => setForm(p => ({ ...p, discount: Number(e.target.value) }))}
                    className="w-full accent-amber-400"
                  />
                  <div className="flex justify-between text-xs text-gray-400 mt-1"><span>1%</span><span>50%</span></div>
                </div>

                {/* Dates */}
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: 'Start Date', key: 'startDate' },
                    { label: 'End Date',   key: 'endDate'   },
                  ].map(f => (
                    <div key={f.key}>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{f.label}</label>
                      <input
                        type="date"
                        value={(form as any)[f.key]}
                        onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                        className="w-full px-3 py-2.5 bg-white/70 dark:bg-gray-800 border border-gray-200 dark:border-white/10 rounded-xl text-sm text-gray-900 dark:text-white focus:outline-none input-glow"
                      />
                    </div>
                  ))}
                </div>

                {/* Applicable cars */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Apply to Cars ({form.carIds.length} selected)
                  </label>
                  <div className="max-h-44 overflow-y-auto space-y-1.5 border border-gray-100 dark:border-white/10 rounded-xl p-3 bg-white/40 dark:bg-white/5">
                  {activeCars.map(car => (
                    <label key={car.id} className="flex items-center gap-2.5 cursor-pointer hover:bg-white/40 dark:hover:bg-white/10 p-1.5 rounded-lg transition-colors">
                        <input
                          type="checkbox"
                          checked={form.carIds.includes(car.id)}
                          onChange={() => toggleCar(car.id)}
                          className="w-4 h-4 accent-primary rounded"
                        />
                        <img src={car.image} alt={car.title} className="w-8 h-8 rounded-lg object-cover" />
                        <span className="text-sm text-gray-700 dark:text-gray-300 truncate">{car.title}</span>
                      </label>
                    ))}
                  </div>
                </div>

              </div>

              <div className="flex gap-3 mt-6">
                <button onClick={closeModal} className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                  Cancel
                </button>
                <button onClick={handleSave} className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white bg-primary btn-hover-scale shadow-sm shadow-primary/30">
                  {modal === 'edit' ? 'Save Changes' : 'Create Campaign'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
