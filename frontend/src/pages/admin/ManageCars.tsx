import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Edit2, Plus, Search, Trash2, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAppStore } from '../../store/useAppStore';
import type { Car, CarCondition, CarFormValues } from '../../types';

const BLANK: CarFormValues = {
  title: '',
  brand: '',
  price: 0,
  description: '',
  year: new Date().getFullYear(),
  mileage: 0,
  condition: 'New',
  image: '',
  engine: 'Petrol',
  transmission: 'Automatic',
  categoryId: '',
};

const CONDITIONS: CarCondition[] = ['New', 'Used', 'Certified'];
const ENGINES = ['Petrol', 'Diesel', 'Electric', 'Hybrid'];
const TRANSMISSIONS = ['Automatic', 'Manual'];

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : 'Failed to save car.';
}

export function ManageCars() {
  const {
    addCar,
    cars,
    categories,
    deleteCar,
    fetchCars,
    fetchCategories,
    updateCar,
  } = useAppStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [modal, setModal] = useState<'add' | 'edit' | null>(null);
  const [editing, setEditing] = useState<Car | null>(null);
  const [form, setForm] = useState<CarFormValues>(BLANK);

  useEffect(() => {
    void Promise.all([fetchCars(), fetchCategories()]);
  }, [fetchCars, fetchCategories]);

  const filteredCars = useMemo(
    () =>
      cars.filter(
        (car) =>
          car.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          car.brand.toLowerCase().includes(searchTerm.toLowerCase()),
      ),
    [cars, searchTerm],
  );

  const openAdd = () => {
    setForm(BLANK);
    setEditing(null);
    setModal('add');
  };

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
      categoryId: car.categoryId || '',
    });
    setEditing(car);
    setModal('edit');
  };

  const closeModal = () => setModal(null);

  const handleSave = async () => {
    if (!form.title.trim()) {
      toast.error('Title is required.');
      return;
    }

    if (!form.brand.trim()) {
      toast.error('Brand is required.');
      return;
    }

    if (form.price <= 0) {
      toast.error('Price must be greater than 0.');
      return;
    }

    try {
      if (modal === 'edit' && editing) {
        await updateCar(editing.id, form);
        toast.success('Car updated successfully.');
      } else {
        await addCar(form);
        toast.success('Car added successfully!');
      }
      closeModal();
    } catch (error: unknown) {
      toast.error(getErrorMessage(error));
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this vehicle listing?')) {
      return;
    }

    try {
      await deleteCar(id);
      toast.success('Car deleted.');
    } catch (error: unknown) {
      toast.error(getErrorMessage(error));
    }
  };

  const updateForm = <K extends keyof CarFormValues>(key: K, value: CarFormValues[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <div className="max-w-7xl mx-auto w-full">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">
            Vehicles
          </h1>
          <p className="text-gray-400 mt-1">Manage your car listings ({cars.length} total).</p>
        </div>
        <button
          onClick={openAdd}
          className="flex items-center gap-2 px-4 py-2.5 bg-primary text-white rounded-xl text-sm font-semibold btn-hover-scale shadow-sm shadow-primary/30"
        >
          <Plus size={17} /> Add New Car
        </button>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card overflow-hidden"
      >
        <div className="p-4 border-b border-gray-100 dark:border-white/10 bg-white/20 dark:bg-white/5">
          <div className="relative w-72">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
            />
            <input
              type="text"
              placeholder="Search cars..."
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
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
                <th className="px-6 py-4">Category</th>
                <th className="px-6 py-4">Price</th>
                <th className="px-6 py-4">Year</th>
                <th className="px-6 py-4">Condition</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-white/10">
              {filteredCars.map((car, index) => (
                <motion.tr
                  key={car.id}
                  initial={{ opacity: 0, x: -16 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.04 }}
                  className="hover:bg-white/40 dark:hover:bg-white/5 transition-colors"
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <img
                        src={car.image}
                        alt={car.title}
                        className="w-12 h-10 rounded-xl object-cover border border-white/20 flex-shrink-0"
                      />
                      <div className="min-w-0">
                        <span className="font-semibold text-gray-900 dark:text-white block truncate max-w-[180px]">
                          {car.title}
                        </span>
                        {car.discount && (
                          <span className="text-[10px] font-bold text-accent">
                            {car.discount}% OFF
                          </span>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">{car.brand}</td>
                  <td className="px-6 py-4">{car.category || 'Uncategorized'}</td>
                  <td className="px-6 py-4 font-semibold text-gray-900 dark:text-white">
                    ${car.price.toLocaleString()}
                  </td>
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
            <div className="p-10 text-center text-gray-400">
              No vehicles found for "{searchTerm}".
            </div>
          )}
        </div>
      </motion.div>

      <AnimatePresence>
        {modal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 modal-backdrop">
            <motion.div
              initial={{ opacity: 0, scale: 0.93, y: 24 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.93, y: 24 }}
              transition={{ type: 'spring', damping: 26 }}
              className="glass-card w-full max-w-lg p-7 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  {modal === 'edit' ? 'Edit Vehicle' : 'Add New Vehicle'}
                </h2>
                <button
                  onClick={closeModal}
                  className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
                >
                  <X size={18} className="text-gray-500" />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Title
                  </label>
                  <input
                    type="text"
                    value={form.title}
                    onChange={(event) => updateForm('title', event.target.value)}
                    placeholder="e.g. Tesla Model S"
                    className="w-full px-3 py-2.5 bg-white/70 dark:bg-white/10 border border-gray-200 dark:border-white/10 rounded-xl text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none input-glow"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Brand
                  </label>
                  <input
                    type="text"
                    value={form.brand}
                    onChange={(event) => updateForm('brand', event.target.value)}
                    placeholder="e.g. BMW"
                    className="w-full px-3 py-2.5 bg-white/70 dark:bg-white/10 border border-gray-200 dark:border-white/10 rounded-xl text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none input-glow"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Category
                  </label>
                  <select
                    value={form.categoryId || ''}
                    onChange={(event) => updateForm('categoryId', event.target.value)}
                    className="w-full px-3 py-2.5 bg-white/70 dark:bg-gray-800 border border-gray-200 dark:border-white/10 rounded-xl text-sm text-gray-900 dark:text-white focus:outline-none input-glow"
                  >
                    <option value="">-- No category --</option>
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Condition
                  </label>
                  <select
                    value={form.condition}
                    onChange={(event) =>
                      updateForm('condition', event.target.value as CarCondition)
                    }
                    className="w-full px-3 py-2.5 bg-white/70 dark:bg-gray-800 border border-gray-200 dark:border-white/10 rounded-xl text-sm text-gray-900 dark:text-white focus:outline-none input-glow"
                  >
                    {CONDITIONS.map((condition) => (
                      <option key={condition} value={condition}>
                        {condition}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Price ($)
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={form.price}
                    onChange={(event) => updateForm('price', Number(event.target.value))}
                    className="w-full px-3 py-2.5 bg-white/70 dark:bg-white/10 border border-gray-200 dark:border-white/10 rounded-xl text-sm text-gray-900 dark:text-white focus:outline-none input-glow"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Year
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={form.year}
                    onChange={(event) => updateForm('year', Number(event.target.value))}
                    className="w-full px-3 py-2.5 bg-white/70 dark:bg-white/10 border border-gray-200 dark:border-white/10 rounded-xl text-sm text-gray-900 dark:text-white focus:outline-none input-glow"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Mileage
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={form.mileage}
                    onChange={(event) => updateForm('mileage', Number(event.target.value))}
                    className="w-full px-3 py-2.5 bg-white/70 dark:bg-white/10 border border-gray-200 dark:border-white/10 rounded-xl text-sm text-gray-900 dark:text-white focus:outline-none input-glow"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Engine
                  </label>
                  <select
                    value={form.engine}
                    onChange={(event) => updateForm('engine', event.target.value)}
                    className="w-full px-3 py-2.5 bg-white/70 dark:bg-gray-800 border border-gray-200 dark:border-white/10 rounded-xl text-sm text-gray-900 dark:text-white focus:outline-none input-glow"
                  >
                    {ENGINES.map((engine) => (
                      <option key={engine} value={engine}>
                        {engine}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Transmission
                  </label>
                  <select
                    value={form.transmission}
                    onChange={(event) => updateForm('transmission', event.target.value)}
                    className="w-full px-3 py-2.5 bg-white/70 dark:bg-gray-800 border border-gray-200 dark:border-white/10 rounded-xl text-sm text-gray-900 dark:text-white focus:outline-none input-glow"
                  >
                    {TRANSMISSIONS.map((transmission) => (
                      <option key={transmission} value={transmission}>
                        {transmission}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="mt-4 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Image URL
                  </label>
                  <input
                    type="text"
                    value={form.image || ''}
                    onChange={(event) => updateForm('image', event.target.value)}
                    placeholder="Optional image URL"
                    className="w-full px-3 py-2.5 bg-white/70 dark:bg-white/10 border border-gray-200 dark:border-white/10 rounded-xl text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none input-glow"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Description
                  </label>
                  <textarea
                    rows={4}
                    value={form.description}
                    onChange={(event) => updateForm('description', event.target.value)}
                    placeholder="Brief description..."
                    className="w-full px-3 py-2.5 bg-white/70 dark:bg-white/10 border border-gray-200 dark:border-white/10 rounded-xl text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none input-glow resize-none"
                  />
                </div>

                {form.image && (
                  <div className="rounded-xl overflow-hidden h-32 border border-white/20">
                    <img
                      src={form.image}
                      alt="preview"
                      className="w-full h-full object-cover"
                      onError={(event) => {
                        event.currentTarget.style.display = 'none';
                      }}
                    />
                  </div>
                )}
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={closeModal}
                  className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white bg-primary btn-hover-scale shadow-sm shadow-primary/30"
                >
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
