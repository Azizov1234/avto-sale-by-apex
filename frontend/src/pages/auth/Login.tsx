import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Phone, Lock, Car, ArrowRight } from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';

export function Login() {
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuthStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone || !password) {
      toast.error('Please enter both phone and password.');
      return;
    }

    setIsLoading(true);

    try {
      // Connect to the ready backend using useAuthStore action (we will add it soon)
      const success = await login({ phone, password });
      if (success) {
        toast.success('Logged in successfully!');
        navigate('/');
      } else {
        toast.error('Invalid credentials. Please try again.');
      }
    } catch (err: any) {
      toast.error(err.message || 'Login failed');
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
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">Welcome Back</h1>
        <p className="text-gray-500 text-sm mt-2">Sign in to your account to continue</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Phone size={18} className="text-gray-400" />
            </div>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="block w-full pl-10 px-3 py-2.5 bg-white/50 border border-gray-200 rounded-xl text-sm focus:bg-white input-glow transition-all-smooth"
              placeholder="+998901234567"
            />
          </div>
        </div>

        <div>
          <div className="flex justify-between items-center mb-1">
            <label className="block text-sm font-medium text-gray-700">Password</label>
            <a href="#" className="text-xs font-medium text-accent hover:text-blue-600 transition-colors">Forgot password?</a>
          </div>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Lock size={18} className="text-gray-400" />
            </div>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="block w-full pl-10 px-3 py-2.5 bg-white/50 border border-gray-200 rounded-xl text-sm focus:bg-white input-glow transition-all-smooth"
              placeholder="••••••••"
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

      <p className="mt-8 text-center text-sm text-gray-500">
        Don't have an account?{' '}
        <Link to="/register" className="font-semibold text-primary hover:text-gray-700 transition-colors">
          Create one now
        </Link>
      </p>
    </motion.div>
  );
}
