import { useCallback, useEffect, useMemo, useState } from 'react';
import { AlertCircle, RotateCcw, Search, SlidersHorizontal, X } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { useLanguageStore } from '../../store/useLanguageStore';
import type { Car } from '../../types';
import { motion, AnimatePresence } from 'framer-motion';
import { OrderForm } from '../../components/OrderForm';
import { CarCard } from '../../components/CarCard';
import { HeroCarousel } from '../../components/HeroCarousel';

const CONDITIONS = ['All', 'New', 'Used', 'Certified'];

function getErrorMessage(error: unknown) {
  return error instanceof Error
    ? error.message
    : 'Avtomobillarni yuklashda xatolik yuz berdi.';
}

export function CarListing() {
  const { cars, fetchCars } = useAppStore();
  const { t } = useLanguageStore();

  const [selectedCar, setSelectedCar] = useState<Car | null>(null);
  const [modalView, setModalView] = useState<'detail' | 'order'>('detail');
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [condition, setCondition] = useState('All');
  const [brand, setBrand] = useState('All');
  const [maxPrice, setMaxPrice] = useState(300000);

  const loadCars = useCallback(async () => {
    setIsLoading(true);
    setLoadError('');

    try {
      await fetchCars();
    } catch (error: unknown) {
      setLoadError(getErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  }, [fetchCars]);

  useEffect(() => {
    void loadCars();
  }, [loadCars]);

  const categories = useMemo(
    () => [
      'All',
      ...new Set(
        cars
          .map((car) => car.category)
          .filter((value): value is string => Boolean(value)),
      ),
    ],
    [cars],
  );

  const brands = useMemo(
    () => [
      'All',
      ...new Set(
        cars
          .map((car) => car.brand)
          .filter((value): value is string => Boolean(value)),
      ),
    ],
    [cars],
  );

  const filtered = cars.filter((car) => {
    const query = search.trim().toLowerCase();
    const matchSearch =
      !query ||
      car.title.toLowerCase().includes(query) ||
      car.brand.toLowerCase().includes(query);
    const matchCategory = category === 'All' || car.category === category;
    const matchCondition = condition === 'All' || car.condition === condition;
    const matchBrand = brand === 'All' || car.brand === brand;
    const matchPrice = car.price <= maxPrice;

    return matchSearch && matchCategory && matchCondition && matchBrand && matchPrice;
  });

  const activeFiltersCount = [
    category !== 'All',
    condition !== 'All',
    brand !== 'All',
    maxPrice < 300000,
  ].filter(Boolean).length;

  const handleBuyClick = (car: Car) => {
    setSelectedCar(car);
    setModalView('detail');
  };

  const clearFilters = () => {
    setSearch('');
    setCategory('All');
    setCondition('All');
    setBrand('All');
    setMaxPrice(300000);
  };

  return (
    <div className="w-full">
      {!isLoading && !loadError && <HeroCarousel cars={cars} onBuy={handleBuyClick} />}

      <div className="mb-6 flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {categories.map((item) => (
          <button
            key={item}
            onClick={() => setCategory(item)}
            className={`flex-shrink-0 rounded-full px-4 py-2 text-sm font-semibold transition-all ${
              category === item
                ? 'bg-primary text-white shadow-md shadow-primary/30'
                : 'bg-white text-gray-700 border border-gray-200 hover:border-primary hover:text-primary dark:bg-white/10 dark:text-gray-300 dark:border-white/10'
            }`}
          >
            {item}
          </button>
        ))}
      </div>

      <div className="mb-8 flex items-center gap-3">
        <div className="relative flex-1">
          <Search
            size={17}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <input
            type="text"
            placeholder={t('searchPlaceholder')}
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="input-field input-glow w-full py-2.5 pl-10 pr-4 shadow-sm"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 transition-colors hover:text-gray-600 dark:hover:text-gray-200"
            >
              <X size={16} />
            </button>
          )}
        </div>

        <button
          onClick={() => setShowFilters((value) => !value)}
          className={`relative flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold transition-all shadow-sm ${
            showFilters || activeFiltersCount > 0
              ? 'border-primary bg-primary text-white shadow-primary/30'
              : 'border-gray-200 bg-white text-gray-700 hover:border-primary hover:text-primary dark:border-white/10 dark:bg-white/10 dark:text-gray-300'
          }`}
        >
          <SlidersHorizontal size={17} />
          {t('filters')}
          {activeFiltersCount > 0 && (
            <span className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-accent text-[10px] font-bold text-white">
              {activeFiltersCount}
            </span>
          )}
        </button>
      </div>

      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-8 overflow-hidden"
          >
            <div className="glass-card grid grid-cols-1 gap-5 p-6 sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  Brand
                </label>
                <select
                  value={brand}
                  onChange={(event) => setBrand(event.target.value)}
                  className="input-field input-glow w-full px-3 py-2"
                >
                  {brands.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  Condition
                </label>
                <div className="flex gap-2">
                  {CONDITIONS.map((item) => (
                    <button
                      key={item}
                      onClick={() => setCondition(item)}
                      className={`flex-1 rounded-xl border py-2 text-sm font-semibold transition-all ${
                        condition === item
                          ? 'border-primary bg-primary text-white'
                          : 'border-gray-200 bg-white text-gray-600 hover:border-primary dark:border-white/10 dark:bg-gray-800 dark:text-gray-300'
                      }`}
                    >
                      {item}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  Max Price: <span className="text-primary">${maxPrice.toLocaleString()}</span>
                </label>
                <input
                  type="range"
                  min={10000}
                  max={300000}
                  step={5000}
                  value={maxPrice}
                  onChange={(event) => setMaxPrice(Number(event.target.value))}
                  className="w-full accent-primary"
                />
                <div className="mt-1 flex justify-between text-xs text-gray-400">
                  <span>$10k</span>
                  <span>$300k</span>
                </div>
              </div>

              <div className="flex items-end">
                <button
                  onClick={clearFilters}
                  className="w-full rounded-xl border border-red-200 py-2 text-sm font-semibold text-red-500 transition-colors hover:bg-red-50 dark:border-red-500/30 dark:hover:bg-red-900/20"
                >
                  Clear Filters
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="mb-5 flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">
          {isLoading
            ? 'Loading...'
            : loadError
              ? 'Vehicles could not be loaded'
              : `${filtered.length} Vehicle${filtered.length !== 1 ? 's' : ''} Found`}
        </h2>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, index) => (
            <div
              key={index}
              className="flex flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white animate-pulse dark:border-white/10 dark:bg-gray-800"
            >
              <div className="aspect-[4/3] w-full bg-gray-200 dark:bg-gray-700" />
              <div className="space-y-3 p-5">
                <div className="h-3 w-16 rounded bg-gray-200 dark:bg-gray-700" />
                <div className="h-5 w-full rounded bg-gray-200 dark:bg-gray-700" />
                <div className="h-4 w-2/3 rounded bg-gray-200 dark:bg-gray-700" />
                <div className="flex justify-between border-t border-gray-100 pt-3 dark:border-gray-700">
                  <div className="h-6 w-20 rounded bg-gray-200 dark:bg-gray-700" />
                  <div className="h-8 w-20 rounded-xl bg-gray-200 dark:bg-gray-700" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : loadError ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="panel-surface rounded-3xl px-6 py-16 text-center"
        >
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-red-500/10 text-red-500">
            <AlertCircle size={28} />
          </div>
          <p className="mb-2 text-xl font-semibold text-gray-900 dark:text-white">
            Avtomobillar yuklanmadi
          </p>
          <p className="mx-auto max-w-xl text-sm text-gray-500 dark:text-gray-400">
            {loadError}
          </p>
          <button
            onClick={() => void loadCars()}
            className="mt-5 inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-primary/20"
          >
            <RotateCcw size={16} />
            Qayta urinish
          </button>
        </motion.div>
      ) : filtered.length === 0 ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="py-24 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-3xl bg-primary/10 text-primary">
            <Search size={30} />
          </div>
          <p className="mb-2 text-xl font-semibold text-gray-700 dark:text-gray-300">
            {t('noVehicles')}
          </p>
          <p className="text-sm text-gray-400">Try adjusting your search or filters.</p>
          <button
            onClick={clearFilters}
            className="mt-4 text-sm font-semibold text-primary hover:underline"
          >
            Reset all filters
          </button>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((car, index) => (
            <CarCard key={car.id} car={car} onBuy={handleBuyClick} index={index} />
          ))}
        </div>
      )}

      <AnimatePresence>
        {selectedCar && (
          <div className="modal-backdrop fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, y: 80, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 80, scale: 0.95 }}
              transition={{ type: 'spring', damping: 26, stiffness: 220 }}
              className="glass-card flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden"
            >
              <div className="relative h-64 shrink-0 overflow-hidden">
                <motion.img
                  initial={{ scale: 1.08, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.5 }}
                  src={selectedCar.image}
                  alt={selectedCar.title}
                  className="h-full w-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                <button
                  onClick={() => setSelectedCar(null)}
                  className="absolute right-4 top-4 z-10 rounded-full bg-black/50 p-2 text-white backdrop-blur-md transition-colors hover:bg-black/70"
                >
                  <X size={18} />
                </button>
              </div>

              <AnimatePresence mode="wait">
                {modalView === 'detail' ? (
                  <motion.div
                    key="detail"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="flex flex-1 flex-col overflow-y-auto p-6 md:p-8"
                  >
                    <div className="mb-5 flex items-start justify-between">
                      <div>
                        <div className="mb-1 text-xs font-semibold uppercase tracking-wider text-primary">
                          {selectedCar.brand}
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                          {selectedCar.title}
                        </h2>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {selectedCar.year} | {selectedCar.condition}
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-primary">
                          ${selectedCar.price.toLocaleString()}
                        </div>
                        {selectedCar.discount && (
                          <div className="text-xs font-semibold text-emerald-500">
                            {selectedCar.discount}% OFF Applied
                          </div>
                        )}
                      </div>
                    </div>

                    <p className="mb-5 text-sm text-gray-500 dark:text-gray-400">
                      {selectedCar.description}
                    </p>

                    <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
                      {[
                        { label: 'Mileage', value: `${selectedCar.mileage.toLocaleString()} mi` },
                        { label: 'Condition', value: selectedCar.condition },
                        { label: 'Engine', value: selectedCar.engine || 'N/A' },
                        { label: 'Transmission', value: selectedCar.transmission || 'N/A' },
                      ].map((item) => (
                        <div
                          key={item.label}
                          className="rounded-xl border border-white/40 bg-white/50 p-3 dark:border-white/10 dark:bg-white/5"
                        >
                          <div className="mb-1 text-[10px] font-semibold uppercase text-gray-400">
                            {item.label}
                          </div>
                          <div className="text-sm font-semibold text-gray-900 dark:text-white">
                            {item.value}
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="mt-auto flex gap-3">
                      <button
                        onClick={() => setSelectedCar(null)}
                        className="btn-hover-scale flex-1 rounded-xl border border-white/50 bg-white/70 py-3 text-sm font-semibold text-gray-700 dark:border-white/10 dark:bg-white/10 dark:text-gray-300"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => setModalView('order')}
                        className="btn-hover-scale flex-1 rounded-xl bg-primary py-3 text-sm font-semibold text-white shadow-lg shadow-primary/30"
                      >
                        {t('buyNow')} {'->'}
                      </button>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    key="order"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    className="flex-1 overflow-hidden"
                  >
                    <OrderForm car={selectedCar} onClose={() => setSelectedCar(null)} />
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
