import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { Car } from '../types';

interface HeroCarouselProps {
  cars: Car[];
  onBuy: (car: Car) => void;
}

const variants = {
  enter: (dir: number) => ({ x: dir > 0 ? '100%' : '-100%', opacity: 0.3 }),
  center: { x: 0, opacity: 1 },
  exit:  (dir: number) => ({ x: dir > 0 ? '-100%' : '100%', opacity: 0.3 }),
};

export function HeroCarousel({ cars, onBuy }: HeroCarouselProps) {
  const featured = cars.slice(0, 6);
  const [current, setCurrent] = useState(0);
  const [direction, setDirection] = useState(1);

  const next = useCallback(() => {
    if (!featured.length) {
      return;
    }
    setDirection(1);
    setCurrent(c => (c + 1) % featured.length);
  }, [featured.length]);

  const prev = () => {
    setDirection(-1);
    setCurrent(c => (c - 1 + featured.length) % featured.length);
  };

  const goTo = (i: number) => {
    setDirection(i > current ? 1 : -1);
    setCurrent(i);
  };

  useEffect(() => {
    if (!featured.length) {
      return undefined;
    }

    const timer = setInterval(next, 5500);
    return () => clearInterval(timer);
  }, [next]);

  if (!featured.length) {
    return null;
  }

  const car = featured[current];

  return (
    <div className="relative w-full h-[480px] md:h-[580px] rounded-3xl overflow-hidden mb-12 shadow-2xl">
      <AnimatePresence initial={false} custom={direction} mode="popLayout">
        <motion.div
          key={current}
          custom={direction}
          variants={variants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{ type: 'tween', duration: 0.55, ease: [0.76, 0, 0.24, 1] }}
          className="absolute inset-0"
        >
          {/* Background image */}
          <img
            src={car.image}
            alt={car.title}
            className="w-full h-full object-cover"
          />
          {/* Gradient overlay */}
          <div className="absolute inset-0 hero-overlay" />
          {/* Subtle bottom fade */}
          <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-black/60 to-transparent" />

          {/* Content */}
          <div className="absolute inset-0 flex items-center px-8 md:px-16">
            <motion.div
              initial={{ opacity: 0, x: -40 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2, duration: 0.55, ease: 'easeOut' }}
              className="max-w-xl"
            >
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xs font-bold uppercase tracking-[0.2em] text-amber-400">
                  {car.condition === 'New' ? '⚡ Just Arrived' : '✨ Featured'}
                </span>
                {car.discount && (
                  <span className="bg-amber-400 text-gray-900 text-xs font-bold px-2 py-0.5 rounded-md">
                    {car.discount}% OFF
                  </span>
                )}
              </div>

              <h2 className="text-4xl md:text-5xl font-extrabold text-white mb-2 leading-tight drop-shadow-lg">
                {car.title}
              </h2>
              <p className="text-white/70 mb-2 text-sm md:text-base">{car.brand} · {car.year} · {car.condition}</p>
              <p className="text-white/60 text-sm mb-6 line-clamp-2 max-w-sm">{car.description}</p>

              <div className="flex items-center gap-4 mb-8">
                <span className="text-3xl md:text-4xl font-bold text-white drop-shadow">
                  ${car.discount
                    ? Math.round(car.price * (1 - car.discount / 100)).toLocaleString()
                    : car.price.toLocaleString()}
                </span>
                {car.discount && (
                  <span className="text-lg text-white/50 line-through">${car.price.toLocaleString()}</span>
                )}
              </div>

              <button
                onClick={() => onBuy(car)}
                className="group inline-flex items-center gap-2 px-7 py-3.5 bg-primary text-white rounded-2xl font-bold text-base
                  hover:bg-indigo-500 transition-all hover:scale-105 shadow-lg shadow-primary/40"
              >
                View & Buy
                <ChevronRight size={20} className="group-hover:translate-x-1 transition-transform" />
              </button>
            </motion.div>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Prev / Next arrows */}
      <button
        onClick={prev}
        className="absolute left-4 top-1/2 -translate-y-1/2 z-20 bg-white/15 hover:bg-white/30
          backdrop-blur-md text-white p-3 rounded-full transition-all hover:scale-110"
        aria-label="Previous"
      >
        <ChevronLeft size={20} />
      </button>
      <button
        onClick={next}
        className="absolute right-4 top-1/2 -translate-y-1/2 z-20 bg-white/15 hover:bg-white/30
          backdrop-blur-md text-white p-3 rounded-full transition-all hover:scale-110"
        aria-label="Next"
      >
        <ChevronRight size={20} />
      </button>

      {/* Dot indicators */}
      <div className="absolute bottom-5 left-1/2 -translate-x-1/2 z-20 flex gap-2 items-center">
        {featured.map((_, i) => (
          <button
            key={i}
            onClick={() => goTo(i)}
            aria-label={`Slide ${i + 1}`}
            className={`rounded-full transition-all duration-300 ${
              i === current
                ? 'bg-white w-7 h-2.5'
                : 'bg-white/40 hover:bg-white/60 w-2.5 h-2.5'
            }`}
          />
        ))}
      </div>

      {/* Slide counter */}
      <div className="absolute top-5 right-5 z-20 bg-black/40 backdrop-blur-sm text-white text-xs font-medium px-3 py-1.5 rounded-full">
        {current + 1} / {featured.length}
      </div>
    </div>
  );
}
