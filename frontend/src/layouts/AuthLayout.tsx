import { Outlet, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

export function AuthLayout() {
  const location = useLocation();
  return (
    <div className="min-h-screen bg-background flex flex-col justify-center items-center p-4 sm:p-8">
      <AnimatePresence mode="wait">
        <motion.div
          key={location.pathname}
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.98 }}
          transition={{ duration: 0.4 }}
          className="w-full max-w-md"
        >
          <Outlet />
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
