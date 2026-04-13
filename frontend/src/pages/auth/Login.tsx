import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, Car, Lock, Phone } from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { useAuthStore } from '../../store/useAuthStore';
import { getHomePath } from '../../lib/routes';

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : 'Login failed';
}

export function Login() {
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuthStore();

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!phone.trim() || !password.trim()) {
      toast.error('Please enter both phone and password.');
      return;
    }

    setIsLoading(true);

    try {
      const success = await login({ phone: phone.trim(), password });
      if (success) {
        toast.success('Logged in successfully!');
        navigate(getHomePath(useAuthStore.getState().user?.role), { replace: true });
      }
    } catch (error: unknown) {
      toast.error(getErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="w-full max-w-md glass-card p-8 pb-10"
    >
      <div className="flex flex-col items-center mb-8">
        <div className="bg-primary text-primary-foreground p-3 rounded-xl mb-4 shadow-md">
          <Car size={28} />
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">Welcome Back</h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm mt-2">Sign in to your account to continue</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Phone Number</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Phone size={18} className="text-gray-400" />
            </div>
            <input
              type="tel"
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              className="input-field input-glow block w-full pl-10 pr-3 py-2.5"
              placeholder="+998901234567"
            />
          </div>
        </div>

        <div>
          <div className="flex justify-between items-center mb-1">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Password</label>
          </div>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Lock size={18} className="text-gray-400" />
            </div>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="input-field input-glow block w-full pl-10 pr-3 py-2.5"
              placeholder="Enter your password"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full flex justify-center items-center gap-2 py-2.5 px-4 rounded-xl text-sm font-semibold text-white bg-primary disabled:bg-gray-400 btn-hover-scale shadow-sm"
        >
          {isLoading ? (
            <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <>
              Sign In <ArrowRight size={16} />
            </>
          )}
        </button>
      </form>

      <p className="mt-8 text-center text-sm text-gray-500 dark:text-gray-400">
        Do not have an account?{' '}
        <Link
          to="/register"
          className="font-semibold text-primary hover:text-gray-700 dark:hover:text-white transition-colors"
        >
          Create one now
        </Link>
      </p>
    </motion.div>
  );
}
