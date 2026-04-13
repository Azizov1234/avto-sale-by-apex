import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  Camera,
  Car,
  Lock,
  Mail,
  Phone,
  User as UserIcon,
} from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { useAuthStore } from '../../store/useAuthStore';
import { buildAvatarUrl } from '../../lib/mappers';
import { getHomePath } from '../../lib/routes';

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : 'Registration failed';
}

export function Register() {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { register } = useAuthStore();

  const fallbackAvatar = useMemo(() => buildAvatarUrl(name || email || 'User'), [email, name]);

  useEffect(() => {
    if (!avatarFile) {
      setAvatarPreview('');
      return;
    }

    const objectUrl = URL.createObjectURL(avatarFile);
    setAvatarPreview(objectUrl);

    return () => {
      URL.revokeObjectURL(objectUrl);
    };
  }, [avatarFile]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!name.trim() || !email.trim() || !password.trim() || !phone.trim()) {
      toast.error('Please fill in all fields.');
      return;
    }

    setIsLoading(true);

    try {
      const success = await register({
        name: name.trim(),
        phone: phone.trim(),
        email: email.trim(),
        password,
        avatarFile: avatarFile ?? undefined,
      });

      if (success) {
        toast.success('Account created successfully!');
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
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className="w-full max-w-md glass-card p-8 pb-10"
    >
      <div className="flex flex-col items-center mb-8">
        <div className="bg-primary text-primary-foreground p-3 rounded-xl mb-4 shadow-md">
          <Car size={28} />
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">Create Account</h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm mt-2">Join Drive.net today</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="flex flex-col items-center">
          <div className="relative">
            <img
              src={avatarPreview || fallbackAvatar}
              alt="Profile preview"
              className="w-24 h-24 rounded-3xl object-cover border-2 border-primary/20 shadow-md bg-white"
            />
            <label
              htmlFor="register-avatar"
              className="absolute -bottom-2 -right-2 flex items-center justify-center w-9 h-9 rounded-full bg-primary text-white shadow-lg cursor-pointer hover:bg-indigo-600 transition-colors"
            >
              <Camera size={16} />
            </label>
          </div>
          <input
            id="register-avatar"
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(event) => setAvatarFile(event.target.files?.[0] ?? null)}
          />
          <p className="mt-3 text-xs text-gray-500 dark:text-gray-400 text-center">
            Avatar is optional. If you skip it, a default profile avatar will be used.
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Full Name</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <UserIcon size={18} className="text-gray-400" />
            </div>
            <input
              type="text"
              value={name}
              onChange={(event) => setName(event.target.value)}
              className="input-field input-glow block w-full pl-10 px-3 py-2.5"
              placeholder="John Doe"
            />
          </div>
        </div>

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
              className="input-field input-glow block w-full pl-10 px-3 py-2.5"
              placeholder="+998901234567"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email Address</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Mail size={18} className="text-gray-400" />
            </div>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="input-field input-glow block w-full pl-10 px-3 py-2.5"
              placeholder="name@example.com"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Password</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Lock size={18} className="text-gray-400" />
            </div>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="input-field input-glow block w-full pl-10 px-3 py-2.5"
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
              Sign Up <ArrowRight size={16} />
            </>
          )}
        </button>
      </form>

      <p className="mt-8 text-center text-sm text-gray-500 dark:text-gray-400">
        Already have an account?{' '}
        <Link
          to="/login"
          className="font-semibold text-primary hover:text-gray-700 dark:hover:text-white transition-colors"
        >
          Sign In
        </Link>
      </p>
    </motion.div>
  );
}
