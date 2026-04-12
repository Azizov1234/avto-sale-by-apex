import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Car, ArrowRight, ArrowLeft, CheckCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

type Step = 'email' | 'sent';

export function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [step, setStep] = useState<Step>('email');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const validateEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateEmail(email)) {
      toast.error('Please enter a valid email address.');
      return;
    }
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      setStep('sent');
      toast.success('Reset link sent! Check your inbox.');
    }, 1400);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className="w-full max-w-md glass-card p-8 pb-10"
    >
      {/* Logo */}
      <div className="flex flex-col items-center mb-8">
        <div className="bg-primary text-white p-3 rounded-xl mb-4 shadow-md">
          <Car size={28} />
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
          {step === 'email' ? 'Forgot Password?' : 'Check Your Email'}
        </h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm mt-2 text-center">
          {step === 'email'
            ? "Enter your registered email and we'll send you a reset link."
            : `We've sent a password reset link to ${email}`}
        </p>
      </div>

      <AnimatePresence mode="wait">
        {step === 'email' ? (
          <motion.form
            key="email-form"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.3 }}
            onSubmit={handleSubmit}
            className="space-y-5"
          >
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail size={18} className="text-gray-400" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="block w-full pl-10 px-3 py-2.5 bg-white/50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl text-sm text-gray-900 dark:text-white focus:bg-white dark:focus:bg-white/10 input-glow transition-all-smooth"
                  placeholder="you@example.com"
                  autoFocus
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex justify-center items-center gap-2 py-3 px-4 rounded-xl text-sm font-semibold text-white bg-primary disabled:opacity-60 btn-hover-scale shadow-sm"
            >
              {isLoading ? (
                <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <> Send Reset Link <ArrowRight size={16} /> </>
              )}
            </button>
          </motion.form>
        ) : (
          <motion.div
            key="sent-state"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="flex flex-col items-center gap-5"
          >
            <div className="w-20 h-20 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center">
              <CheckCircle size={40} className="text-emerald-500" />
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
              Didn't receive it? Check your spam folder or{' '}
              <button
                onClick={() => setStep('email')}
                className="text-primary font-semibold hover:underline"
              >
                try another email
              </button>
            </p>
            <button
              onClick={() => navigate('/login')}
              className="w-full flex justify-center items-center gap-2 py-3 px-4 rounded-xl text-sm font-semibold text-white bg-primary btn-hover-scale shadow-sm"
            >
              Back to Sign In
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="mt-8 text-center">
        <Link
          to="/login"
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 hover:text-primary transition-colors"
        >
          <ArrowLeft size={14} /> Back to Login
        </Link>
      </div>
    </motion.div>
  );
}
