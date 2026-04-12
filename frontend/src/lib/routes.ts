import type { UserRole } from '../types';

export function getAdminBasePath(role?: UserRole | null) {
  return role === 'SUPERADMIN' ? '/superadmin' : '/admin';
}

export function getHomePath(role?: UserRole | null) {
  if (role === 'ADMIN' || role === 'SUPERADMIN') {
    return getAdminBasePath(role);
  }

  return '/';
}
