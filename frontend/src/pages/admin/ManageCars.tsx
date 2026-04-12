import { useEffect, useState } from 'react';
import { Plus, Edit2, Trash2, Search, X } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import type { Car, CarCondition, CarFormValues } from '../../types';

const BLANK: CarFormValues = {
  title: '', brand: '', price: 0, description: '', year: new Date().getFullYear(),
  mileage: 0, condition: 'New', image: '', engine: 'Petrol', transmission: 'Automatic',
};

const BRANDS = ['Tesla','Porsche','Audi','BMW','Mercedes','Ferrari','Lamborghini','Ford','Toyota','Lexus','Chevrolet','Land Rover','Aston Martin'];
const CONDITIONS: CarCondition[] = ['New', 'Used', 'Certified'];
const ENGINES = ['Petrol', 'Diesel', 'Electric', 'Hybrid'];
const TRANSMISSIONS = ['Automatic', 'Manual'];

export function ManageCars() {
  const { cars, fetchCars, addCar, updateCar, deleteCar } = useAppStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [modal, setModal]     = useState<'add' | 'edit' | null>(null);
  const [editing, setEditing] = useState<Car | null>(null);
  const [form, setForm]       = useState<CarFormValues>(BLANK);

  useEffect(() => {
    void fetchCars();
  }, [fetchCars]);

  const filteredCars = cars.filter(car =>
    car.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    car.brand.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const openAdd  = () => { setForm(BLANK); setEditing(null); setModal('add'); };
  const openEdit = (car: Car) => {
    setForm({
      title: car.title,
      brand: car.brand,
      price: car.price,
      description: car.description,
      year: car.year,
      mileage: car.mileage,
      condition: car.condition,
      image: car.image,
      engine: car.engine || 'Petrol',
      transmission: car.transmission || 'Automatic',
    });
    setEditing(car);
    setModal('edit');
  };
  const closeModal = () => setModal(null);

  const handleSave = async () => {
    if (!form.title.trim())  { toast.error('Title is required.'); return; }
    if (!form.brand.trim())  { toast.error('Brand is required.'); return; }
    if (form.price <= 0)     { toast.error('Price must be > 0.'); return; }
    if (!form.image?.trim())  { toast.error('Image URL is required.'); return; }

    try {
      if (modal === 'edit' && editing) {
        await updateCar(editing.id, form);
        toast.success('Car updated successfully.');
      } else {
        await addCar(form);
        toast.success('Car added successfully!');
      }
      closeModal();
    } catch (error: any) {
      toast.error(error.message || 'Failed to save car.');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this vehicle listing?')) return;
    try {
      await deleteCar(id);
      toast.success('Car deleted.');
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete car.');
    }
  };

  const field = (key: keyof CarFormValues, label: string, type: string, ph?: string, opts?: string[]) => (
    <div key={key}>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{label}</label>
      {opts ? (
        <select
          value={(form as any)[key] ?? ''}
          onChange={e => setForm(p => ({ ...p, [key]: type === 'number' ? Number(e.target.value) : e.target.value }))}
          className="w-full px-3 py-2.5 bg-white/70 dark:bg-gray-800 border border-gray-200 dark:border-white/10 rounded-xl text-sm text-gray-900 dark:text-white focus:outline-none input-glow"
        >
          <option value="">-- Select --</option>
          {opts.map(o => <option key={o} value={o}>{o}</option>)}
        </select>
      ) : (
        <input
          type={type}
          value={(form as any)[key] ?? ''}
          onChange={e => setForm(p => ({ ...p, [key]: type === 'number' ? Number(e.target.value) : e.target.value }))}
          placeholder={ph}
          min={type === 'number' ? 0 : undefined}
          className="w-full px-3 py-2.5 bg-white/70 dark:bg-white/10 border border-gray-200 dark:border-white/10 rounded-xl text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none input-glow"
        />
      )}
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">Vehicles</h1>
          <p className="text-gray-400 mt-1">Manage your car listings ({cars.length} total).</p>
        </div>
        <button
          onClick={openAdd}
          className="flex items-center gap-2 px-4 py-2.5 bg-primary text-white rounded-xl text-sm font-semibold btn-hover-scale shadow-sm shadow-primary/30"
        >
          <Plus size={17} /> Add New Car
        </button>
      </div>

      {/* Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        className="glass-card overflow-hidden"
      >
        <div className="p-4 border-b border-gray-100 dark:border-white/10 bg-white/20 dark:bg-white/5">
          <div className="relative w-72">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Search cars..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-white/60 dark:bg-white/10 border border-gray-200 dark:border-white/10 rounded-xl text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none input-glow transition-all-smooth"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-600 dark:text-gray-300">
            <thead className="text-xs uppercase bg-gray-50/80 dark:bg-white/5 font-semibold border-b border-gray-100 dark:border-white/10">
              <tr>
                <th className="px-6 py-4">Vehicle</th>
                <th className="px-6 py-4">Brand</th>
                <th className="px-6 py-4">Price</th>
                <th className="px-6 py-4">Year</th>
                <th className="px-6 py-4">Condition</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-white/10">
              {filteredCars.map((car, idx) => (
                <motion.tr
                  key={car.id}
                  initial={{ opacity: 0, x: -16 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.04 }}
                  className="hover:bg-white/40 dark:hover:bg-white/5 transition-colors"
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <img src={car.image} alt={car.title} className="w-12 h-10 rounded-xl object-cover border border-white/20 flex-shrink-0" />
                      <div className="min-w-0">
                        <span className="font-semibold text-gray-900 dark:text-white block truncate max-w-[180px]">{car.title}</span>
                        {car.discount && (
                          <span className="text-[10px] font-bold text-accent">{car.discount}% OFF</span>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">{car.brand}</td>
                  <td className="px-6 py-4 font-semibold text-gray-900 dark:text-white">${car.price.toLocaleString()}</td>
                  <td className="px-6 py-4">{car.year}</td>
                  <td className="px-6 py-4">
                    <span className={`badge ${car.condition === 'New' ? 'badge-new' : 'badge-used'}`}>
                      {car.condition}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => openEdit(car)}
                        className="p-2 text-gray-400 hover:text-primary hover:bg-primary/10 rounded-lg btn-hover-scale"
                        title="Edit"
                      >
                        <Edit2 size={15} />
                      </button>
                      <button
                        onClick={() => handleDelete(car.id)}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg btn-hover-scale"
                        title="Delete"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>

          {filteredCars.length === 0 && (
            <div className="p-10 text-center text-gray-400">No vehicles found for "{searchTerm}".</div>
          )}
        </div>
      </motion.div>

      {/* Add / Edit modal */}
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
                  {modal === 'edit' ? 'Edit Vehicle' : 'Add New Vehicle'}
                </h2>
                <button onClick={closeModal} className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-white/10 transition-colors">
                  <X size={18} className="text-gray-500" />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {field('title',       'Title',           'text',   'e.g. Tesla Model S')}
                {field('brand',       'Brand',           'text',   '', BRANDS)}
                {field('condition',   'Condition',       'text',   '', CONDITIONS as string[])}
                {field('price',       'Price ($)',        'number', '50000')}
                {field('year',        'Year',            'number', '2024')}
                {field('mileage',     'Mileage (mi)',    'number', '0')}
                {field('engine',      'Engine',          'text',   '', ENGINES)}
                {field('transmission','Transmission',    'text',   '', TRANSMISSIONS)}
              </div>

              <div className="mt-4 space-y-4">
                {field('image',       'Image URL',       'text',   'https://...')}
                {field('description', 'Description',     'text',   'Brief description...')}

                {/* Image preview */}
                {form.image && (
                  <div className="rounded-xl overflow-hidden h-32 border border-white/20">
                    <img src={form.image} alt="preview" className="w-full h-full object-cover" onError={e => (e.currentTarget.style.display = 'none')} />
                  </div>
                )}
              </div>

              <div className="flex gap-3 mt-6">
                <button onClick={closeModal} className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                  Cancel
                </button>
                <button onClick={handleSave} className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white bg-primary btn-hover-scale shadow-sm shadow-primary/30">
                  {modal === 'edit' ? 'Save Changes' : 'Add Vehicle'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
