import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronLeft, ChevronRight, Star, Calendar, Gauge,
  Cog, Repeat, Palette, ArrowLeft, ShoppingCart, Shield,
} from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { useAuthStore } from '../../store/useAuthStore';
import { OrderForm } from '../../components/OrderForm';
import type { Review } from '../../types';
import toast from 'react-hot-toast';

function StarRating({ rating, max = 5 }: { rating: number; max?: number }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: max }).map((_, i) => (
        <Star
          key={i}
          size={14}
          className={i < rating ? 'text-amber-400 fill-amber-400' : 'text-gray-300 dark:text-gray-600'}
        />
      ))}
    </div>
  );
}

export function CarDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { cars, reviews, fetchCarById, fetchReviews } = useAppStore();
  const { user } = useAuthStore();
  const [isLoading, setIsLoading] = useState(true);

  const car = cars.find(c => c.id === id);
  const carReviews = reviews.filter(r => r.carId === id);
  const avgRating = carReviews.length
    ? carReviews.reduce((s, r) => s + r.rating, 0) / carReviews.length
    : 0;

  const [imgIdx, setImgIdx]       = useState(0);
  const [showOrder, setShowOrder] = useState(false);

  const images = car?.images?.length ? car.images : [car?.image ?? ''];

  useEffect(() => {
    window.scrollTo(0, 0);

    if (!id) {
      setIsLoading(false);
      return;
    }

    let isMounted = true;

    const loadCarDetails = async () => {
      try {
        await Promise.all([
          fetchCarById(id),
          fetchReviews({ carId: id }),
        ]);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadCarDetails();

    return () => {
      isMounted = false;
    };
  }, [fetchCarById, fetchReviews, id]);

  if (isLoading) {
    return (
      <div className="text-center py-24 text-gray-500 dark:text-gray-400">
        Loading vehicle details...
      </div>
    );
  }

  if (!car) {
    return (
      <div className="text-center py-24">
        <p className="text-2xl font-bold text-gray-700 dark:text-gray-300 mb-4">Vehicle not found</p>
        <button onClick={() => navigate('/')} className="text-primary font-semibold flex items-center gap-2 mx-auto hover:underline">
          <ArrowLeft size={16} /> Back to listings
        </button>
      </div>
    );
  }

  const discountedPrice = car.discount
    ? Math.round(car.price * (1 - car.discount / 100))
    : car.price;

  const specs = [
    { icon: Calendar, label: 'Year',         value: String(car.year) },
    { icon: Gauge,    label: 'Mileage',      value: `${car.mileage.toLocaleString()} mi` },
    { icon: Cog,      label: 'Engine',       value: car.engine        || 'N/A' },
    { icon: Repeat,   label: 'Transmission', value: car.transmission  || 'N/A' },
    { icon: Shield,   label: 'Condition',    value: car.condition },
    { icon: Palette,  label: 'Color',        value: car.color         || 'N/A' },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="max-w-5xl mx-auto"
    >
      {/* Back */}
      <button
        onClick={() => navigate('/')}
        className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 hover:text-primary mb-6 transition-colors"
      >
        <ArrowLeft size={16} /> Back to listings
      </button>

      <div className="grid lg:grid-cols-2 gap-8 mb-10">
        {/* Image carousel */}
        <div className="space-y-3">
          <div className="relative aspect-[4/3] rounded-2xl overflow-hidden bg-gray-100 dark:bg-gray-800 shadow-xl">
            <AnimatePresence mode="wait">
              <motion.img
                key={imgIdx}
                src={images[imgIdx]}
                alt={car.title}
                initial={{ opacity: 0, scale: 1.04 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.96 }}
                transition={{ duration: 0.35 }}
                className="w-full h-full object-cover"
              />
            </AnimatePresence>

            {images.length > 1 && (
              <>
                <button
                  onClick={() => setImgIdx(i => (i - 1 + images.length) % images.length)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/60 text-white p-2.5 rounded-full backdrop-blur-sm"
                >
                  <ChevronLeft size={18} />
                </button>
                <button
                  onClick={() => setImgIdx(i => (i + 1) % images.length)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/60 text-white p-2.5 rounded-full backdrop-blur-sm"
                >
                  <ChevronRight size={18} />
                </button>
              </>
            )}

            {car.discount && (
              <div className="absolute top-4 left-4 bg-accent text-white text-xs font-bold px-3 py-1.5 rounded-lg shadow-md">
                {car.discount}% OFF
              </div>
            )}
             <div className={`absolute top-4 right-4 text-xs font-bold px-3 py-1.5 rounded-lg shadow-md ${
              car.condition === 'New' ? 'bg-emerald-500 text-white' : 'bg-white/90 text-gray-900'
            }`}>
              {car.condition}
            </div>
          </div>

          {/* Thumbnails */}
          {images.length > 1 && (
            <div className="flex gap-2 overflow-x-auto">
              {images.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setImgIdx(i)}
                  className={`flex-shrink-0 w-16 h-16 rounded-xl overflow-hidden border-2 transition-all ${
                    i === imgIdx ? 'border-primary shadow-md scale-105' : 'border-transparent opacity-60 hover:opacity-100'
                  }`}
                >
                  <img src={img} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Info column */}
        <div className="flex flex-col">
          <div className="text-xs font-bold text-primary uppercase tracking-widest mb-1">{car.brand}</div>
          <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white mb-2">{car.title}</h1>

          {/* Rating */}
          {carReviews.length > 0 && (
            <div className="flex items-center gap-2 mb-4">
              <StarRating rating={Math.round(avgRating)} />
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {avgRating.toFixed(1)} ({carReviews.length} review{carReviews.length !== 1 ? 's' : ''})
              </span>
            </div>
          )}

          <p className="text-gray-500 dark:text-gray-400 text-sm mb-6 leading-relaxed">{car.description}</p>

          {/* Specs grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
            {specs.map(s => (
              <div key={s.label} className="glass-card p-3 flex items-start gap-2.5">
                <s.icon size={16} className="text-primary mt-0.5 flex-shrink-0" />
                <div>
                  <div className="text-[10px] text-gray-400 uppercase font-semibold">{s.label}</div>
                  <div className="text-sm font-semibold text-gray-900 dark:text-white">{s.value}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Price block */}
          <div className="glass-card p-5 mb-5">
            <div className="text-xs text-gray-400 uppercase font-semibold mb-1">Price</div>
            <div className="flex items-baseline gap-3 mb-1">
              <span className="text-3xl font-extrabold text-primary">${discountedPrice.toLocaleString()}</span>
              {car.discount && (
                <span className="text-lg text-gray-400 line-through">${car.price.toLocaleString()}</span>
              )}
            </div>
            {car.discount && (
              <div className="text-sm text-emerald-500 font-semibold">
                💰 You save ${(car.price - discountedPrice).toLocaleString()}
              </div>
            )}
            <div className="text-xs text-gray-400 mt-2">
              Or from <span className="font-bold text-gray-700 dark:text-gray-300">${Math.round(discountedPrice / 60).toLocaleString()}/mo</span> with financing
            </div>
          </div>

          <button
            onClick={() => {
              if (!user) { toast.error('Please login to place an order.'); return; }
              setShowOrder(true);
            }}
            className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl text-base font-bold text-white bg-primary btn-hover-scale shadow-lg shadow-primary/30"
          >
            <ShoppingCart size={20} /> Order Now — ${discountedPrice.toLocaleString()}
          </button>
        </div>
      </div>

      {/* Reviews section */}
      <div className="mb-10">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-5">
          Customer Reviews {carReviews.length > 0 && <span className="text-lg text-gray-400">({carReviews.length})</span>}
        </h2>
        {carReviews.length === 0 ? (
          <div className="glass-card p-8 text-center text-gray-400">
            <Star size={36} className="mx-auto mb-2 opacity-30" />
            No reviews yet. Be the first to review this car!
          </div>
        ) : (
          <div className="space-y-4">
            {carReviews.map((review: Review, i) => (
              <motion.div
                key={review.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }}
                className="glass-card p-5"
              >
                <div className="flex items-start gap-3 mb-3">
                  <img
                    src={review.userAvatar || `https://ui-avatars.com/api/?name=${review.userName}&background=6366f1&color=fff`}
                    alt={review.userName}
                    className="w-10 h-10 rounded-full object-cover border border-white/30"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <span className="font-semibold text-sm text-gray-900 dark:text-white">{review.userName}</span>
                      <span className="text-xs text-gray-400">{review.date}</span>
                    </div>
                    <StarRating rating={review.rating} />
                  </div>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">{review.comment}</p>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Order modal */}
      <AnimatePresence>
        {showOrder && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 modal-backdrop">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 40 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 40 }}
              transition={{ type: 'spring', damping: 26 }}
              className="glass-card flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden"
            >
              <OrderForm car={car} onClose={() => setShowOrder(false)} />
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
