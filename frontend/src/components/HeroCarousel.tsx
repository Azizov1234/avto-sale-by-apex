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
  exit: (dir: number) => ({ x: dir > 0 ? '-100%' : '100%', opacity: 0.3 }),
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
    setCurrent((value) => (value + 1) % featured.length);
  }, [featured.length]);

  const prev = () => {
    setDirection(-1);
    setCurrent((value) => (value - 1 + featured.length) % featured.length);
  };

  const goTo = (index: number) => {
    setDirection(index > current ? 1 : -1);
    setCurrent(index);
  };

  useEffect(() => {
    if (!featured.length) {
      return undefined;
    }

    const timer = setInterval(next, 5500);
    return () => clearInterval(timer);
  }, [featured.length, next]);

  if (!featured.length) {
    return null;
  }

  const car = featured[current];

  return (
    <div className="relative mb-12 h-[480px] w-full overflow-hidden rounded-3xl shadow-2xl md:h-[580px]">
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
          <img
            src={car.image}
            alt={car.title}
            className="h-full w-full object-cover"
          />
          <div className="hero-overlay absolute inset-0" />
          <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-black/60 to-transparent" />

          <div className="absolute inset-0 flex items-center px-8 md:px-16">
            <motion.div
              initial={{ opacity: 0, x: -40 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2, duration: 0.55, ease: 'easeOut' }}
              className="max-w-xl"
            >
              <div className="mb-3 flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-[0.2em] text-amber-400">
                  {car.condition === 'New' ? 'New Arrival' : 'Featured'}
                </span>
                {car.discount && (
                  <span className="rounded-md bg-amber-400 px-2 py-0.5 text-xs font-bold text-gray-900">
                    {car.discount}% OFF
                  </span>
                )}
              </div>

              <h2 className="mb-2 text-4xl font-extrabold leading-tight text-white drop-shadow-lg md:text-5xl">
                {car.title}
              </h2>
              <p className="mb-2 text-sm text-white/70 md:text-base">
                {car.brand} | {car.year} | {car.condition}
              </p>
              <p className="mb-6 max-w-sm text-sm text-white/60 line-clamp-2">
                {car.description}
              </p>

              <div className="mb-8 flex items-center gap-4">
                <span className="text-3xl font-bold text-white drop-shadow md:text-4xl">
                  $
                  {car.discount
                    ? Math.round(car.price * (1 - car.discount / 100)).toLocaleString()
                    : car.price.toLocaleString()}
                </span>
                {car.discount && (
                  <span className="text-lg text-white/50 line-through">${car.price.toLocaleString()}</span>
                )}
              </div>

              <button
                onClick={() => onBuy(car)}
                className="group inline-flex items-center gap-2 rounded-2xl bg-primary px-7 py-3.5 text-base font-bold text-white shadow-lg shadow-primary/40 transition-all hover:scale-105 hover:bg-indigo-500"
              >
                View & Buy
                <ChevronRight size={20} className="transition-transform group-hover:translate-x-1" />
              </button>
            </motion.div>
          </div>
        </motion.div>
      </AnimatePresence>

      <button
        onClick={prev}
        className="absolute left-4 top-1/2 z-20 -translate-y-1/2 rounded-full bg-white/15 p-3 text-white backdrop-blur-md transition-all hover:scale-110 hover:bg-white/30"
        aria-label="Previous"
      >
        <ChevronLeft size={20} />
      </button>
      <button
        onClick={next}
        className="absolute right-4 top-1/2 z-20 -translate-y-1/2 rounded-full bg-white/15 p-3 text-white backdrop-blur-md transition-all hover:scale-110 hover:bg-white/30"
        aria-label="Next"
      >
        <ChevronRight size={20} />
      </button>

      <div className="absolute bottom-5 left-1/2 z-20 flex -translate-x-1/2 items-center gap-2">
        {featured.map((_, index) => (
          <button
            key={index}
            onClick={() => goTo(index)}
            aria-label={`Slide ${index + 1}`}
            className={`rounded-full transition-all duration-300 ${
              index === current
                ? 'h-2.5 w-7 bg-white'
                : 'h-2.5 w-2.5 bg-white/40 hover:bg-white/60'
            }`}
          />
        ))}
      </div>

      <div className="absolute right-5 top-5 z-20 rounded-full bg-black/40 px-3 py-1.5 text-xs font-medium text-white backdrop-blur-sm">
        {current + 1} / {featured.length}
      </div>
    </div>
  );
}
