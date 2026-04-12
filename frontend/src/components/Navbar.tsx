import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import { useLanguageStore } from '../store/useLanguageStore';
import { Car, LogOut, ChevronDown, Globe, LayoutDashboard, ShieldCheck } from 'lucide-react';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ThemeToggle } from './ThemeToggle';
import toast from 'react-hot-toast';

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

  const languages = [
    { code: 'uz', label: "O'zbekcha", flag: '🇺🇿' },
    { code: 'ru', label: 'Русский',   flag: '🇷🇺' },
    { code: 'en', label: 'English',   flag: '🇬🇧' },
  ];

  const dropDown = {
    hidden: { opacity: 0, y: 8, scale: 0.96 },
    visible: { opacity: 1, y: 0, scale: 1 },
    exit:    { opacity: 0, y: 8, scale: 0.96 },
  };

  return (
    <nav className="fixed top-0 w-full z-50 glass h-16 flex items-center shadow-sm border-b border-white/30 dark:border-white/5">
      <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 flex justify-between items-center">

        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 group flex-shrink-0">
          <div className="bg-primary text-white p-2 rounded-xl group-hover:scale-110 transition-transform duration-300 shadow-sm shadow-primary/30">
            <Car size={19} />
          </div>
          <span className="font-extrabold text-xl tracking-tight hidden sm:block text-gray-900 dark:text-white">
            Drive<span className="text-primary">.net</span>
          </span>
        </Link>

        {/* Right controls */}
        <div className="flex items-center gap-1 sm:gap-2">

          {/* Language */}
          <div className="relative">
            <button
              id="lang-toggle"
              onClick={() => { setLangOpen(v => !v); setDropdownOpen(false); }}
              className="flex items-center gap-1.5 px-2.5 py-2 rounded-xl hover:bg-gray-100 dark:hover:bg-white/10 transition-colors text-sm font-medium focus:outline-none"
            >
              <Globe size={17} className="text-gray-500 dark:text-gray-400" />
              <span className="uppercase text-gray-700 dark:text-gray-300 text-xs font-semibold">{language}</span>
              <ChevronDown size={13} className={`text-gray-400 transition-transform ${langOpen ? 'rotate-180' : ''}`} />
            </button>

            <AnimatePresence>
              {langOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setLangOpen(false)} />
                  <motion.div
                    variants={dropDown} initial="hidden" animate="visible" exit="exit"
                    transition={{ duration: 0.18 }}
                    className="absolute right-0 mt-2 w-44 bg-white dark:bg-gray-800 border border-gray-100 dark:border-white/10 rounded-2xl shadow-xl py-1.5 z-20 overflow-hidden"
                  >
                    {languages.map(lang => (
                      <button
                        key={lang.code}
                        onClick={() => { setLanguage(lang.code as 'uz'|'ru'|'en'); setLangOpen(false); }}
                        className={`w-full text-left px-4 py-2.5 text-sm transition-colors flex items-center gap-2.5 ${
                          language === lang.code
                            ? 'bg-indigo-50 dark:bg-indigo-900/30 text-primary font-semibold'
                            : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5'
                        }`}
                      >
                        <span>{lang.flag}</span>{lang.label}
                      </button>
                    ))}
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>

          {/* Theme toggle */}
          <ThemeToggle />

          {/* User menu or login links */}
          {user ? (
            <div className="relative">
              <button
                id="user-menu"
                onClick={() => { setDropdownOpen(v => !v); setLangOpen(false); }}
                className="flex items-center gap-2 focus:outline-none hover:bg-gray-100 dark:hover:bg-white/10 pl-1 pr-2.5 py-1.5 rounded-full sm:rounded-xl transition-colors"
              >
                <img
                  src={user.avatarUrl}
                  alt="avatar"
                  className="w-8 h-8 rounded-full border-2 border-primary/30 object-cover"
                />
                <div className="hidden sm:flex flex-col items-start">
                  <span className="text-sm font-semibold leading-tight text-gray-900 dark:text-white">{user.name}</span>
                  <span className="text-xs text-gray-500 dark:text-gray-400 capitalize leading-tight">{user.role}</span>
                </div>
                <ChevronDown size={15} className={`text-gray-400 transition-transform hidden sm:block ${dropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              <AnimatePresence>
                {dropdownOpen && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setDropdownOpen(false)} />
                    <motion.div
                      variants={dropDown} initial="hidden" animate="visible" exit="exit"
                      transition={{ duration: 0.18 }}
                      className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-800 border border-gray-100 dark:border-white/10 rounded-2xl shadow-xl py-1.5 z-20 overflow-hidden"
                    >
                      {/* Header */}
                      <div className="px-4 py-3 border-b border-gray-100 dark:border-white/10">
                        <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">{user.role}</p>
                        <p className="text-sm font-semibold text-gray-800 dark:text-white truncate mt-0.5">{user.email}</p>
                      </div>

                      <Link
                        to="/dashboard"
                        onClick={() => setDropdownOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5"
                      >
                        <LayoutDashboard size={15} className="text-gray-400" /> My Dashboard
                      </Link>

                      {['ADMIN', 'SUPERADMIN'].includes(user.role) && (
                        <Link
                          to="/admin"
                          onClick={() => setDropdownOpen(false)}
                          className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 hover:text-primary"
                        >
                          <ShieldCheck size={15} className="text-primary" /> {t('adminDashboard')}
                        </Link>
                      )}

                      <div className="border-t border-gray-100 dark:border-white/10 mt-1 pt-1">
                        <button
                          onClick={() => { handleLogout(); setDropdownOpen(false); }}
                          className="w-full text-left flex items-center gap-2.5 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
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
              <Link to="/login" className="px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-primary transition-colors">
                {t('login')}
              </Link>
              <Link
                to="/register"
                className="px-4 py-2 text-sm font-semibold text-white bg-primary rounded-xl hover:bg-indigo-600 transition-all shadow-sm shadow-primary/30"
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
