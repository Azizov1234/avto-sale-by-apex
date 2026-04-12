import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, CarFront, ShoppingCart, LogOut, Car,
  Users, CreditCard, BarChart2, ScrollText, Tag, X, Menu,
} from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const navItems = [
  { to: '/admin',              icon: LayoutDashboard, label: 'Dashboard',          end: true  },
  { to: '/admin/cars',         icon: CarFront,         label: 'Manage Cars'                   },
  { to: '/admin/orders',       icon: ShoppingCart,     label: 'Manage Orders'                 },
  { to: '/admin/users',        icon: Users,            label: 'Manage Users'                  },
  { to: '/admin/installments', icon: CreditCard,       label: 'Installment Plans'             },
  { to: '/admin/campaigns',    icon: Tag,              label: 'Discount Campaigns'            },
  { to: '/admin/analytics',    icon: BarChart2,         label: 'Analytics'                    },
  { to: '/admin/logs',         icon: ScrollText,        label: 'Action Logs'                  },
];

function SidebarContent({ onClose }: { onClose?: () => void }) {
  const { logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="flex flex-col h-full sidebar-bg border-r border-gray-200 dark:border-white/10">
      {/* Header */}
      <div className="h-16 flex items-center justify-between px-5 border-b border-gray-200 dark:border-white/10 flex-shrink-0">
        <NavLink to="/" className="flex items-center gap-2 group">
          <div className="bg-primary text-white p-1.5 rounded-lg group-hover:scale-105 transition-transform shadow-sm">
            <Car size={17} />
          </div>
          <span className="font-extrabold text-base tracking-tight text-gray-900 dark:text-white">
            Drive<span className="text-primary">.net</span> <span className="text-gray-400 dark:text-gray-500 font-normal text-xs">CRM</span>
          </span>
        </NavLink>
        {onClose && (
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-white/10 transition-colors lg:hidden">
            <X size={18} className="text-gray-500" />
          </button>
        )}
      </div>

      {/* Nav */}
      <div className="flex-1 py-4 px-3 flex flex-col gap-0.5 overflow-y-auto">
        <p className="text-[10px] font-bold text-gray-400 dark:text-gray-600 uppercase tracking-widest px-3 mb-2">Navigation</p>
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            onClick={onClose}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-all text-sm font-medium ${
                isActive
                  ? 'bg-primary text-white shadow-md shadow-primary/25'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5 hover:text-primary dark:hover:text-primary'
              }`
            }
          >
            <item.icon size={17} />
            {item.label}
          </NavLink>
        ))}
      </div>

      {/* Logout */}
      <div className="p-3 border-t border-gray-200 dark:border-white/10">
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
        >
          <LogOut size={17} /> Logout
        </button>
      </div>
    </div>
  );
}

export function AdminSidebar() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      {/* Desktop sidebar */}
      <div className="fixed inset-y-0 left-0 w-64 hidden lg:block z-40">
        <SidebarContent />
      </div>

      {/* Mobile hamburger button */}
      <button
        onClick={() => setMobileOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-white/10 rounded-xl shadow-md"
        aria-label="Open menu"
      >
        <Menu size={20} className="text-gray-700 dark:text-gray-300" />
      </button>

      {/* Mobile overlay + drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
              onClick={() => setMobileOpen(false)}
            />
            <motion.div
              initial={{ x: '-100%' }} animate={{ x: 0 }} exit={{ x: '-100%' }}
              transition={{ type: 'tween', duration: 0.28 }}
              className="fixed inset-y-0 left-0 w-72 z-50 lg:hidden"
            >
              <SidebarContent onClose={() => setMobileOpen(false)} />
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
