import { useState, useEffect } from 'react';
import { Search, SlidersHorizontal, X } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { useLanguageStore } from '../../store/useLanguageStore';
import type { Car } from '../../types';
import { motion, AnimatePresence } from 'framer-motion';
import { OrderForm } from '../../components/OrderForm';
import { CarCard } from '../../components/CarCard';
import { HeroCarousel } from '../../components/HeroCarousel';

const CATEGORIES = ['All', 'SUV', 'Sedan', 'Sports', 'Coupe', 'Wagon'];
const CONDITIONS  = ['All', 'New', 'Used'];
const BRANDS = ['All', 'Tesla', 'Porsche', 'Audi', 'BMW', 'Mercedes', 'Ferrari', 'Lamborghini', 'Ford', 'Toyota', 'Lexus', 'Chevrolet', 'Land Rover', 'Aston Martin'];

export function CarListing() {
  const { cars, fetchCars } = useAppStore();
  const { t } = useLanguageStore();

  const [selectedCar, setSelectedCar]       = useState<Car | null>(null);
  const [modalView, setModalView]           = useState<'detail' | 'order'>('detail');
  const [isLoading, setIsLoading]           = useState(true);
  const [showFilters, setShowFilters]       = useState(false);

  // Filter state
  const [search, setSearch]         = useState('');
  const [category, setCategory]     = useState('All');
  const [condition, setCondition]   = useState('All');
  const [brand, setBrand]           = useState('All');
  const [maxPrice, setMaxPrice]     = useState(300000);

  useEffect(() => {
    let isMounted = true;

    const loadCars = async () => {
      try {
        await fetchCars();
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadCars();

    return () => {
      isMounted = false;
    };
  }, [fetchCars]);

  const filtered = cars.filter(car => {
    const q = search.toLowerCase();
    const matchSearch = !q || car.title.toLowerCase().includes(q) || car.brand.toLowerCase().includes(q);
    const matchCat  = category  === 'All' || car.category  === category;
    const matchCond = condition === 'All' || car.condition === condition;
    const matchBrand= brand     === 'All' || car.brand     === brand;
    const matchPrice= car.price <= maxPrice;
    return matchSearch && matchCat && matchCond && matchBrand && matchPrice;
  });

  const activeFiltersCount = [
    category !== 'All', condition !== 'All', brand !== 'All', maxPrice < 300000
  ].filter(Boolean).length;

  const handleBuyClick = (car: Car) => { setSelectedCar(car); setModalView('detail'); };
  const clearFilters = () => { setCategory('All'); setCondition('All'); setBrand('All'); setMaxPrice(300000); };

  return (
    <div className="w-full">
      {/* Hero Carousel */}
      {!isLoading && <HeroCarousel cars={cars} onBuy={handleBuyClick} />}

      {/* Category chips */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-6 scrollbar-hide">
        {CATEGORIES.map(cat => (
          <button
            key={cat}
            onClick={() => setCategory(cat)}
            className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-semibold transition-all ${
              category === cat
                ? 'bg-primary text-white shadow-md shadow-primary/30'
                : 'bg-white dark:bg-white/10 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-white/10 hover:border-primary hover:text-primary'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Search + Filters Row */}
      <div className="flex gap-3 items-center mb-8">
        <div className="relative flex-1">
          <Search size={17} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          <input
            type="text"
            placeholder={t('searchPlaceholder')}
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-white/10 border border-gray-200 dark:border-white/10 rounded-xl text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none input-glow transition-all-smooth shadow-sm"
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
              <X size={16} />
            </button>
          )}
        </div>
        <button
          onClick={() => setShowFilters(v => !v)}
          className={`relative flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold border transition-all shadow-sm ${
            showFilters || activeFiltersCount > 0
              ? 'bg-primary text-white border-primary shadow-primary/30'
              : 'bg-white dark:bg-white/10 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-white/10 hover:border-primary hover:text-primary'
          }`}
        >
          <SlidersHorizontal size={17} /> Filters
          {activeFiltersCount > 0 && (
            <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-accent text-white text-[10px] font-bold rounded-full flex items-center justify-center">
              {activeFiltersCount}
            </span>
          )}
        </button>
      </div>

      {/* Expanded filters panel */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden mb-8"
          >
            <div className="glass-card p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {/* Brand */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Brand</label>
                <select
                  value={brand}
                  onChange={e => setBrand(e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-white/10 rounded-xl text-sm text-gray-900 dark:text-white focus:outline-none input-glow"
                >
                  {BRANDS.map(b => <option key={b} value={b}>{b}</option>)}
                </select>
              </div>
              {/* Condition */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Condition</label>
                <div className="flex gap-2">
                  {CONDITIONS.map(c => (
                    <button
                      key={c}
                      onClick={() => setCondition(c)}
                      className={`flex-1 py-2 rounded-xl text-sm font-semibold border transition-all ${
                        condition === c
                          ? 'bg-primary text-white border-primary'
                          : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-white/10 hover:border-primary'
                      }`}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </div>
              {/* Max Price */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                  Max Price: <span className="text-primary">${maxPrice.toLocaleString()}</span>
                </label>
                <input
                  type="range"
                  min={10000} max={300000} step={5000}
                  value={maxPrice}
                  onChange={e => setMaxPrice(Number(e.target.value))}
                  className="w-full accent-primary"
                />
                <div className="flex justify-between text-xs text-gray-400 mt-1">
                  <span>$10k</span><span>$300k</span>
                </div>
              </div>
              {/* Clear */}
              <div className="flex items-end">
                <button
                  onClick={clearFilters}
                  className="w-full py-2 rounded-xl text-sm font-semibold text-red-500 border border-red-200 dark:border-red-500/30 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                >
                  Clear Filters
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Results header */}
      <div className="flex justify-between items-center mb-5">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">
          {isLoading ? 'Loading...' : `${filtered.length} Vehicle${filtered.length !== 1 ? 's' : ''} Found`}
        </h2>
      </div>

      {/* Car Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {Array.from({ length: 8 }).map((_, n) => (
            <div key={n} className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-white/10 overflow-hidden flex flex-col animate-pulse">
              <div className="aspect-[4/3] bg-gray-200 dark:bg-gray-700 w-full" />
              <div className="p-5 space-y-3">
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-16" />
                <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-full" />
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3" />
                <div className="flex justify-between pt-3 border-t border-gray-100 dark:border-gray-700">
                  <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-20" />
                  <div className="h-8 w-20 bg-gray-200 dark:bg-gray-700 rounded-xl" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-24">
          <div className="text-6xl mb-4">🚗</div>
          <p className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-2">{t('noVehicles')}</p>
          <p className="text-gray-400 text-sm">Try adjusting your search or filters.</p>
          <button onClick={clearFilters} className="mt-4 text-primary font-semibold text-sm hover:underline">Reset all filters</button>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filtered.map((car, index) => (
            <CarCard key={car.id} car={car} onBuy={handleBuyClick} index={index} />
          ))}
        </div>
      )}

      {/* Car Detail / Order Modal */}
      <AnimatePresence>
        {selectedCar && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 modal-backdrop">
            <motion.div
              initial={{ opacity: 0, y: 80, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 80, scale: 0.95 }}
              transition={{ type: 'spring', damping: 26, stiffness: 220 }}
              className="glass-card w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col"
            >
              {/* Image header */}
              <div className="relative h-64 overflow-hidden shrink-0">
                <motion.img
                  initial={{ scale: 1.08, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.5 }}
                  src={selectedCar.image} alt={selectedCar.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                <button
                  onClick={() => setSelectedCar(null)}
                  className="absolute top-4 right-4 bg-black/50 hover:bg-black/70 text-white rounded-full p-2 transition-colors backdrop-blur-md z-10"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Detail view */}
              <AnimatePresence mode="wait">
                {modalView === 'detail' ? (
                  <motion.div
                    key="detail"
                    initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                    className="p-6 md:p-8 flex flex-col flex-1 overflow-y-auto"
                  >
                    <div className="flex justify-between items-start mb-5">
                      <div>
                        <div className="text-xs font-semibold text-primary uppercase tracking-wider mb-1">{selectedCar.brand}</div>
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{selectedCar.title}</h2>
                        <p className="text-gray-500 dark:text-gray-400 text-sm">{selectedCar.year} · {selectedCar.condition}</p>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-primary">${selectedCar.price.toLocaleString()}</div>
                        {selectedCar.discount && (
                          <div className="text-xs text-emerald-500 font-semibold">{selectedCar.discount}% OFF Applied</div>
                        )}
                      </div>
                    </div>

                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-5">{selectedCar.description}</p>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
                      {[
                        { label: 'Mileage',      value: `${selectedCar.mileage.toLocaleString()} mi` },
                        { label: 'Condition',    value: selectedCar.condition },
                        { label: 'Engine',       value: selectedCar.engine       || 'N/A' },
                        { label: 'Transmission', value: selectedCar.transmission || 'N/A' },
                      ].map(s => (
                        <div key={s.label} className="bg-white/50 dark:bg-white/5 p-3 rounded-xl border border-white/40 dark:border-white/10">
                          <div className="text-[10px] text-gray-400 uppercase font-semibold mb-1">{s.label}</div>
                          <div className="text-sm font-semibold text-gray-900 dark:text-white">{s.value}</div>
                        </div>
                      ))}
                    </div>

                    <div className="flex gap-3 mt-auto">
                      <button
                        onClick={() => setSelectedCar(null)}
                        className="flex-1 py-3 rounded-xl text-sm font-semibold text-gray-700 dark:text-gray-300 bg-white/70 dark:bg-white/10 border border-white/50 dark:border-white/10 btn-hover-scale"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => setModalView('order')}
                        className="flex-1 py-3 rounded-xl text-sm font-semibold text-white bg-primary btn-hover-scale shadow-lg shadow-primary/30"
                      >
                        {t('buyNow')} →
                      </button>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    key="order"
                    initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}
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
