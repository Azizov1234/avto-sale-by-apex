import { Outlet, useLocation } from 'react-router-dom';
import { Navbar } from '../components/Navbar';
import { motion, AnimatePresence } from 'framer-motion';

export function MainLayout() {
  const location = useLocation();
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 mt-16">
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
            className="w-full h-full"
          >
            <Outlet />
          </motion.div>
        </AnimatePresence>
      </main>
      <footer className="w-full glass border-t border-border mt-auto py-8 text-center text-sm text-gray-500">
        &copy; {new Date().getFullYear()} Drive.net - Premium Car Marketplace
      </footer>
    </div>
  );
}
