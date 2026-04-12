import { Outlet, useLocation } from 'react-router-dom';
import { AdminSidebar } from '../components/AdminSidebar';
import { motion, AnimatePresence } from 'framer-motion';

export function AdminLayout() {
  const location = useLocation();
  return (
    <div className="flex min-h-screen bg-background">
      <AdminSidebar />
      <main className="flex-1 lg:ml-64 p-4 sm:p-8 md:p-10 min-h-screen overflow-x-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="w-full h-full"
          >
            <Outlet />
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}
