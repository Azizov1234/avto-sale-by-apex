import { motion } from 'framer-motion';
import { ChevronRight, Tag, Gauge, Calendar } from 'lucide-react';
import type { Car } from '../types';

interface CarCardProps {
  car: Car;
  onBuy: (car: Car) => void;
  index?: number;
}

export function CarCard({ car, onBuy, index = 0 }: CarCardProps) {
  const discountedPrice = car.discount
    ? Math.round(car.price * (1 - car.discount / 100))
    : car.price;

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.4 }}
      className="glass-card overflow-hidden group flex flex-col"
    >
      {/* Image */}
      <div className="relative aspect-[4/3] overflow-hidden">
        <img
          src={car.image}
          alt={car.title}
          loading="lazy"
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out bg-gray-200 dark:bg-gray-700"
        />
        {/* Condition badge */}
        <div className={`absolute top-3 right-3 text-xs font-bold px-2.5 py-1 rounded-md shadow-sm ${
          car.condition === 'New'
            ? 'bg-emerald-500 text-white'
            : 'bg-white/90 dark:bg-gray-800/90 text-gray-900 dark:text-white'
        }`}>
          {car.condition}
        </div>
        {/* Discount badge */}
        {car.discount && (
          <div className="absolute top-3 left-3 bg-accent text-white text-xs font-bold px-2.5 py-1 rounded-md shadow-md flex items-center gap-1 discount-glow">
            <Tag size={11} />
            {car.discount}% OFF
          </div>
        )}
        {/* Category chip */}
        {car.category && (
          <div className="absolute bottom-3 left-3 bg-black/50 backdrop-blur-sm text-white text-[10px] font-semibold px-2 py-0.5 rounded-md">
            {car.category}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-5 flex flex-col flex-1">
        <div className="text-xs font-semibold text-primary mb-1 uppercase tracking-wider">{car.brand}</div>
        <h3 className="text-base font-bold text-gray-900 dark:text-white mb-2 truncate">{car.title}</h3>

        {/* Stats row */}
        <div className="flex gap-3 mb-3 text-xs text-gray-500 dark:text-gray-400">
          <span className="flex items-center gap-1"><Calendar size={11} />{car.year}</span>
          <span className="flex items-center gap-1"><Gauge size={11} />{car.mileage.toLocaleString()} mi</span>
        </div>

        <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2 mb-4 flex-1">
          {car.description}
        </p>

        {/* Price + Buy */}
        <div className="flex justify-between items-end mt-auto pt-4 border-t border-gray-100 dark:border-gray-700/50">
          <div>
            <div className="text-xs text-gray-400 dark:text-gray-500 mb-0.5">Price</div>
            {car.discount ? (
              <div className="flex items-baseline gap-1.5">
                <span className="text-sm line-through text-gray-400">${car.price.toLocaleString()}</span>
                <span className="text-xl font-bold text-primary">${discountedPrice.toLocaleString()}</span>
              </div>
            ) : (
              <div className="text-xl font-bold text-gray-900 dark:text-white">${car.price.toLocaleString()}</div>
            )}
          </div>
          <button
            onClick={() => onBuy(car)}
            className="flex items-center gap-1.5 px-4 py-2 bg-primary text-white rounded-xl btn-hover-scale text-xs font-semibold shadow-sm shadow-primary/30"
          >
            Buy Now <ChevronRight size={14} />
          </button>
        </div>
      </div>
    </motion.div>
  );
}
