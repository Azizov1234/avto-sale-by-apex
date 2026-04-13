import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import { useLanguageStore } from '../store/useLanguageStore';
import {
  Car,
  LogOut,
  ChevronDown,
  Globe,
  LayoutDashboard,
  ShieldCheck,
  Search,
} from 'lucide-react';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ThemeToggle } from './ThemeToggle';
import toast from 'react-hot-toast';
import { getAdminBasePath } from '../lib/routes';

export function Navbar() {
  const { user, logout } = useAuthStore();
  const { language, setLanguage, t } = useLanguageStore();
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);

  const handleLogout = () => {
    logout();
    toast.success('Logged out successfully.');
    navigate('/login');
  };

  const adminBasePath = getAdminBasePath(user?.role);

  const languages = [
    { code: 'uz', label: "O'zbek", short: 'UZ' },
    { code: 'ru', label: 'Русский', short: 'RU' },
    { code: 'en', label: 'English', short: 'EN' },
  ];

  const dropDown = {
    hidden: { opacity: 0, y: 8, scale: 0.96 },
    visible: { opacity: 1, y: 0, scale: 1 },
    exit: { opacity: 0, y: 8, scale: 0.96 },
  };

  return (
    <nav className="glass fixed top-0 z-50 flex h-16 w-full items-center border-b border-white/30 shadow-sm dark:border-white/5">
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link to="/" className="group flex flex-shrink-0 items-center gap-2">
          <div className="rounded-xl bg-primary p-2 text-white shadow-sm shadow-primary/30 transition-transform duration-300 group-hover:scale-110">
            <Car size={19} />
          </div>
          <span className="hidden text-xl font-extrabold tracking-tight text-gray-900 dark:text-white sm:block">
            Drive<span className="text-primary">.net</span>
          </span>
        </Link>

        <div className="flex items-center gap-1 sm:gap-2">
          <Link
            to="/"
            className="hidden items-center gap-2 rounded-xl bg-primary/10 px-3 py-2 text-sm font-semibold text-primary transition-colors hover:bg-primary/20 md:inline-flex"
          >
            <Search size={15} />
            Buy Cars
          </Link>

          <Link
            to="/"
            className="inline-flex rounded-xl p-2 text-primary transition-colors hover:bg-primary/10 md:hidden"
            aria-label="Go to cars page"
          >
            <Search size={17} />
          </Link>

          <div className="relative">
            <button
              id="lang-toggle"
              onClick={() => {
                setLangOpen((value) => !value);
                setDropdownOpen(false);
              }}
              className="flex items-center gap-1.5 rounded-xl px-2.5 py-2 text-sm font-medium transition-colors hover:bg-gray-100 focus:outline-none dark:hover:bg-white/10"
            >
              <Globe size={17} className="text-gray-500 dark:text-gray-400" />
              <span className="text-xs font-semibold uppercase text-gray-700 dark:text-gray-300">
                {language}
              </span>
              <ChevronDown
                size={13}
                className={`text-gray-400 transition-transform ${langOpen ? 'rotate-180' : ''}`}
              />
            </button>

            <AnimatePresence>
              {langOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setLangOpen(false)} />
                  <motion.div
                    variants={dropDown}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    transition={{ duration: 0.18 }}
                    className="absolute right-0 z-20 mt-2 w-44 overflow-hidden rounded-2xl border border-gray-100 bg-white py-1.5 shadow-xl dark:border-white/10 dark:bg-gray-800"
                  >
                    {languages.map((lang) => (
                      <button
                        key={lang.code}
                        onClick={() => {
                          setLanguage(lang.code as 'uz' | 'ru' | 'en');
                          setLangOpen(false);
                        }}
                        className={`flex w-full items-center gap-2.5 px-4 py-2.5 text-left text-sm transition-colors ${
                          language === lang.code
                            ? 'bg-indigo-50 font-semibold text-primary dark:bg-indigo-900/30'
                            : 'text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-white/5'
                        }`}
                      >
                        <span className="w-6 rounded-md bg-gray-100 px-1.5 py-0.5 text-center text-[10px] font-bold text-gray-600 dark:bg-white/10 dark:text-gray-300">
                          {lang.short}
                        </span>
                        {lang.label}
                      </button>
                    ))}
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>

          <ThemeToggle />

          {user ? (
            <div className="relative">
              <button
                id="user-menu"
                onClick={() => {
                  setDropdownOpen((value) => !value);
                  setLangOpen(false);
                }}
                className="flex items-center gap-2 rounded-full py-1.5 pl-1 pr-2.5 transition-colors hover:bg-gray-100 focus:outline-none sm:rounded-xl dark:hover:bg-white/10"
              >
                <img
                  src={user.avatarUrl}
                  alt="avatar"
                  className="h-8 w-8 rounded-full border-2 border-primary/30 object-cover"
                />
                <div className="hidden flex-col items-start sm:flex">
                  <span className="text-sm font-semibold leading-tight text-gray-900 dark:text-white">
                    {user.name}
                  </span>
                  <span className="text-xs capitalize leading-tight text-gray-500 dark:text-gray-400">
                    {user.role}
                  </span>
                </div>
                <ChevronDown
                  size={15}
                  className={`hidden text-gray-400 transition-transform sm:block ${dropdownOpen ? 'rotate-180' : ''}`}
                />
              </button>

              <AnimatePresence>
                {dropdownOpen && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setDropdownOpen(false)} />
                    <motion.div
                      variants={dropDown}
                      initial="hidden"
                      animate="visible"
                      exit="exit"
                      transition={{ duration: 0.18 }}
                      className="absolute right-0 z-20 mt-2 w-56 overflow-hidden rounded-2xl border border-gray-100 bg-white py-1.5 shadow-xl dark:border-white/10 dark:bg-gray-800"
                    >
                      <div className="border-b border-gray-100 px-4 py-3 dark:border-white/10">
                        <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
                          {user.role}
                        </p>
                        <p className="mt-0.5 truncate text-sm font-semibold text-gray-800 dark:text-white">
                          {user.email}
                        </p>
                      </div>

                      <Link
                        to="/"
                        onClick={() => setDropdownOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-white/5"
                      >
                        <Car size={15} className="text-primary" /> Browse Cars
                      </Link>

                      <Link
                        to="/dashboard"
                        onClick={() => setDropdownOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-white/5"
                      >
                        <LayoutDashboard size={15} className="text-gray-400" /> My Dashboard
                      </Link>

                      {['ADMIN', 'SUPERADMIN'].includes(user.role) && (
                        <Link
                          to={adminBasePath}
                          onClick={() => setDropdownOpen(false)}
                          className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-indigo-50 hover:text-primary dark:text-gray-300 dark:hover:bg-indigo-900/20"
                        >
                          <ShieldCheck size={15} className="text-primary" />
                          {user.role === 'SUPERADMIN' ? 'Superadmin Panel' : t('adminDashboard')}
                        </Link>
                      )}

                      <div className="mt-1 border-t border-gray-100 pt-1 dark:border-white/10">
                        <button
                          onClick={() => {
                            handleLogout();
                            setDropdownOpen(false);
                          }}
                          className="flex w-full items-center gap-2.5 px-4 py-2.5 text-left text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                        >
                          <LogOut size={15} /> {t('logout')}
                        </button>
                      </div>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
          ) : (
            <div className="flex gap-2">
              <Link
                to="/login"
                className="px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:text-primary dark:text-gray-300"
              >
                {t('login')}
              </Link>
              <Link
                to="/register"
                className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white shadow-sm shadow-primary/30 transition-all hover:bg-indigo-600"
              >
                {t('register')}
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
