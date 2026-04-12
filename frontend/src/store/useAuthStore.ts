import { create } from 'zustand';
import { apiClient } from '../api/client';
import { mapUser } from '../lib/mappers';
import type { User } from '../types';

interface LoginPayload {
  phone: string;
  password: string;
}

interface RegisterPayload {
  name: string;
  phone: string;
  email: string;
  password: string;
  avatarFile?: File;
}

interface UpdateProfilePayload {
  name?: string;
  phone?: string;
  email?: string;
  password?: string;
  avatarFile?: File;
}

interface AuthState {
  user: User | null;
  login: (credentials: LoginPayload) => Promise<boolean>;
  register: (payload: RegisterPayload) => Promise<boolean>;
  updateProfile: (payload: UpdateProfilePayload) => Promise<User>;
  setUser: (user: User | null) => void;
  logout: () => void;
}

function getStoredUser() {
  try {
    const rawUser = localStorage.getItem('auth_user');
    return rawUser ? (JSON.parse(rawUser) as User) : null;
  } catch {
    return null;
  }
}

function persistSession(user: User | null, token?: string) {
  if (token) {
    localStorage.setItem('auth_token', token);
  }

  if (user) {
    localStorage.setItem('auth_user', JSON.stringify(user));
  } else {
    localStorage.removeItem('auth_user');
  }
}

export const useAuthStore = create<AuthState>((set) => ({
  user: getStoredUser(),
  async login(credentials) {
    const data = await apiClient<{
      accessToken: string;
      user: Record<string, any>;
    }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });

    const user = mapUser(data.user);
    persistSession(user, data.accessToken);
    set({ user });
    return true;
  },
  async register(payload) {
    const formData = new FormData();
    formData.append('name', payload.name);
    formData.append('phone', payload.phone);
    formData.append('email', payload.email);
    formData.append('password', payload.password);

    if (payload.avatarFile) {
      formData.append('avatarUrl', payload.avatarFile);
    }

    const data = await apiClient<{
      accessToken: string;
      user: Record<string, any>;
    }>('/auth/register', {
      method: 'POST',
      body: formData,
    });

    const user = mapUser(data.user);
    persistSession(user, data.accessToken);
    set({ user });
    return true;
  },
  async updateProfile(payload) {
    const formData = new FormData();

    if (payload.name) {
      formData.append('name', payload.name);
    }

    if (payload.phone) {
      formData.append('phone', payload.phone);
    }

    if (payload.email) {
      formData.append('email', payload.email);
    }

    if (payload.password) {
      formData.append('password', payload.password);
    }

    if (payload.avatarFile) {
      formData.append('avatarUrl', payload.avatarFile);
    }

    const response = await apiClient<{ data: Record<string, any> }>('/user/update', {
      method: 'PATCH',
      body: formData,
    });

    const updatedUser = mapUser(response.data);
    persistSession(updatedUser);
    set({ user: updatedUser });
    return updatedUser;
  },
  setUser(user) {
    persistSession(user);
    set({ user });
  },
  logout() {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
    set({ user: null });
  },
}));
