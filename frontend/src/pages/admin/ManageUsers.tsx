import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Search,
  Shield,
  User as UserIcon,
  Trash2,
  Edit2,
  Plus,
  X,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAppStore } from '../../store/useAppStore';
import { useAuthStore } from '../../store/useAuthStore';
import type { User } from '../../types';

type ModalMode = 'create-admin' | 'edit-user' | null;

type UserFormState = {
  name: string;
  email: string;
  phone: string;
  password: string;
};

const EMPTY_FORM: UserFormState = {
  name: '',
  email: '',
  phone: '',
  password: '',
};

export function ManageUsers() {
  const { users, fetchUsers, createAdmin, updateUser, deleteUser } =
    useAppStore();
  const { user: currentUser } = useAuthStore();
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState<ModalMode>(null);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [form, setForm] = useState<UserFormState>(EMPTY_FORM);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    void fetchUsers();
  }, [fetchUsers]);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();

    return users.filter((user) => {
      if (!query) {
        return true;
      }

      return [user.name, user.email, user.phone ?? ''].some((value) =>
        value.toLowerCase().includes(query),
      );
    });
  }, [search, users]);

  const closeModal = () => {
    setModal(null);
    setEditingUser(null);
    setForm(EMPTY_FORM);
    setIsSaving(false);
  };

  const canEditUser = (targetUser: User) => {
    if (!currentUser || targetUser.id === currentUser.id) {
      return false;
    }

    if (currentUser.role === 'SUPERADMIN') {
      return true;
    }

    return currentUser.role === 'ADMIN' && targetUser.role === 'USER';
  };

  const openCreateAdminModal = () => {
    if (currentUser?.role !== 'SUPERADMIN') {
      toast.error('Only superadmin can create admin accounts.');
      return;
    }

    setEditingUser(null);
    setForm(EMPTY_FORM);
    setModal('create-admin');
  };

  const openEditModal = (targetUser: User) => {
    if (!canEditUser(targetUser)) {
      toast.error('You cannot edit this user from here.');
      return;
    }

    setEditingUser(targetUser);
    setForm({
      name: targetUser.name,
      email: targetUser.email,
      phone: targetUser.phone ?? '',
      password: '',
    });
    setModal('edit-user');
  };

  const handleSave = async () => {
    const name = form.name.trim();
    const email = form.email.trim();
    const phone = form.phone.trim();
    const password = form.password.trim();

    if (!name || !email || !phone) {
      toast.error('Name, email and phone are required.');
      return;
    }

    if (modal === 'create-admin' && password.length < 5) {
      toast.error('Admin password must be at least 5 characters.');
      return;
    }

    if (modal === 'edit-user' && password && password.length < 5) {
      toast.error('New password must be at least 5 characters.');
      return;
    }

    setIsSaving(true);

    try {
      if (modal === 'create-admin') {
        await createAdmin({
          name,
          email,
          phone,
          password,
        });
        toast.success('Admin account created.');
        closeModal();
        return;
      }

      if (modal === 'edit-user' && editingUser) {
        await updateUser(editingUser.id, {
          name,
          email,
          phone,
          ...(password ? { password } : {}),
        });
        toast.success(`${editingUser.name} updated.`);
        closeModal();
      }
    } catch (error: unknown) {
      toast.error(
        error instanceof Error ? error.message : 'Failed to save user.',
      );
      setIsSaving(false);
    }
  };

  const toggleRole = async (id: string) => {
    const targetUser = users.find((user) => user.id === id);

    if (!targetUser) {
      return;
    }

    if (targetUser.role === 'SUPERADMIN') {
      toast.error('Superadmin role cannot be changed here.');
      return;
    }

    if (currentUser?.role !== 'SUPERADMIN') {
      toast.error('Only superadmin can change user roles.');
      return;
    }

    const nextRole = targetUser.role === 'ADMIN' ? 'USER' : 'ADMIN';

    try {
      await updateUser(id, { role: nextRole });
      toast.success(`${targetUser.name} is now ${nextRole}.`);
    } catch (error: unknown) {
      toast.error(
        error instanceof Error
          ? error.message
          : 'Failed to update user role.',
      );
    }
  };

  const handleDeleteUser = async (id: string) => {
    const targetUser = users.find((user) => user.id === id);

    if (!targetUser) {
      return;
    }

    if (targetUser.id === currentUser?.id) {
      toast.error('You cannot delete your own account.');
      return;
    }

    if (targetUser.role === 'SUPERADMIN') {
      toast.error('Superadmin account cannot be deleted.');
      return;
    }

    if (currentUser?.role === 'ADMIN' && targetUser.role !== 'USER') {
      toast.error('Admin can only delete regular users.');
      return;
    }

    if (!window.confirm(`Delete ${targetUser.name}?`)) {
      return;
    }

    try {
      await deleteUser(id);
      toast.success('User removed.');
    } catch (error: unknown) {
      toast.error(
        error instanceof Error ? error.message : 'Failed to delete user.',
      );
    }
  };

  return (
    <div className="max-w-7xl mx-auto w-full">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">
            Users
          </h1>
          <p className="text-gray-400 mt-1">
            Superadmin can create admins, promote users, edit profiles and
            delete accounts.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 bg-white/60 dark:bg-white/10 border border-white/40 dark:border-white/10 rounded-xl px-4 py-2">
            <UserIcon size={16} /> {users.length} total users
          </div>
          {currentUser?.role === 'SUPERADMIN' && (
            <button
              onClick={openCreateAdminModal}
              className="flex items-center gap-2 px-4 py-2.5 bg-primary text-white rounded-xl text-sm font-semibold btn-hover-scale shadow-sm shadow-primary/30"
            >
              <Plus size={16} /> Create Admin
            </button>
          )}
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="glass-card overflow-hidden"
      >
        <div className="p-4 border-b border-gray-100 dark:border-white/10 bg-white/20 dark:bg-white/5">
          <div className="relative w-full sm:w-80">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
            />
            <input
              type="text"
              placeholder="Search by name, email or phone..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-white/60 dark:bg-white/10 border border-gray-200 dark:border-white/10 rounded-xl text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none input-glow transition-all-smooth"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-700 dark:text-gray-300">
            <thead className="text-xs uppercase bg-gray-50/80 dark:bg-white/5 font-semibold border-b border-gray-100 dark:border-white/10">
              <tr>
                <th className="px-6 py-4">User</th>
                <th className="px-6 py-4">Email</th>
                <th className="px-6 py-4">Phone</th>
                <th className="px-6 py-4">Joined</th>
                <th className="px-6 py-4">Role</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-white/10">
              {filtered.map((user, idx) => (
                <motion.tr
                  key={user.id}
                  initial={{ opacity: 0, x: -16 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="table-row-hover hover:bg-white/40 dark:hover:bg-white/5 transition-colors"
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <img
                        src={user.avatarUrl}
                        alt={user.name}
                        className="w-9 h-9 rounded-xl object-cover border border-white/30"
                      />
                      <span className="font-semibold text-gray-900 dark:text-white">
                        {user.name}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-gray-500 dark:text-gray-400">
                    {user.email}
                  </td>
                  <td className="px-6 py-4 text-gray-500 dark:text-gray-400">
                    {user.phone || '-'}
                  </td>
                  <td className="px-6 py-4 text-gray-500 dark:text-gray-400">
                    {user.createdAt}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full ${
                        user.role === 'ADMIN' || user.role === 'SUPERADMIN'
                          ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300'
                          : 'bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-gray-400'
                      }`}
                    >
                      {user.role === 'ADMIN' || user.role === 'SUPERADMIN' ? (
                        <Shield size={11} />
                      ) : (
                        <UserIcon size={11} />
                      )}
                      {user.role}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-2">
                      {canEditUser(user) ? (
                        <button
                          onClick={() => openEditModal(user)}
                          title="Edit user"
                          className="p-2 text-gray-400 hover:text-primary hover:bg-primary/10 rounded-lg btn-hover-scale"
                        >
                          <Edit2 size={15} />
                        </button>
                      ) : (
                        <span className="p-2 text-gray-300 dark:text-gray-600">
                          <Edit2 size={15} />
                        </span>
                      )}

                      {currentUser?.role === 'SUPERADMIN' &&
                      user.role !== 'SUPERADMIN' &&
                      user.id !== currentUser.id ? (
                        <button
                          onClick={() => toggleRole(user.id)}
                          title={
                            user.role === 'ADMIN'
                              ? 'Turn into user'
                              : 'Promote to admin'
                          }
                          className="p-2 text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg btn-hover-scale"
                        >
                          <Shield size={15} />
                        </button>
                      ) : (
                        <span className="p-2 text-gray-300 dark:text-gray-600">
                          <Shield size={15} />
                        </span>
                      )}

                      {user.role !== 'SUPERADMIN' &&
                      user.id !== currentUser?.id &&
                      (currentUser?.role === 'SUPERADMIN' ||
                        user.role === 'USER') ? (
                        <button
                          onClick={() => handleDeleteUser(user.id)}
                          title="Delete user"
                          className="p-2 text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg btn-hover-scale"
                        >
                          <Trash2 size={15} />
                        </button>
                      ) : (
                        <span className="p-2 text-gray-300 dark:text-gray-600">
                          <Trash2 size={15} />
                        </span>
                      )}
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>

          {filtered.length === 0 && (
            <div className="p-10 text-center text-gray-400">
              No users found for "{search}".
            </div>
          )}
        </div>
      </motion.div>

      <AnimatePresence>
        {modal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 modal-backdrop">
            <motion.div
              initial={{ opacity: 0, scale: 0.94, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94, y: 30 }}
              transition={{ type: 'spring', damping: 26 }}
              className="glass-card w-full max-w-lg p-7"
            >
              <div className="flex justify-between items-start gap-4 mb-6">
                <div>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                    {modal === 'create-admin' ? 'Create Admin' : 'Edit User'}
                  </h2>
                  <p className="text-sm text-gray-400 mt-1">
                    {modal === 'create-admin'
                      ? 'This account will be created directly with ADMIN role.'
                      : `Update ${editingUser?.name ?? 'this user'} account details.`}
                  </p>
                </div>
                <button
                  onClick={closeModal}
                  className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
                >
                  <X size={18} className="text-gray-500" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(event) =>
                      setForm((prev) => ({ ...prev, name: event.target.value }))
                    }
                    className="w-full px-4 py-2.5 bg-white/70 dark:bg-white/10 border border-gray-200 dark:border-white/10 rounded-xl text-sm text-gray-900 dark:text-white focus:outline-none input-glow"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(event) =>
                      setForm((prev) => ({
                        ...prev,
                        email: event.target.value,
                      }))
                    }
                    className="w-full px-4 py-2.5 bg-white/70 dark:bg-white/10 border border-gray-200 dark:border-white/10 rounded-xl text-sm text-gray-900 dark:text-white focus:outline-none input-glow"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Phone
                  </label>
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={(event) =>
                      setForm((prev) => ({
                        ...prev,
                        phone: event.target.value,
                      }))
                    }
                    className="w-full px-4 py-2.5 bg-white/70 dark:bg-white/10 border border-gray-200 dark:border-white/10 rounded-xl text-sm text-gray-900 dark:text-white focus:outline-none input-glow"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {modal === 'create-admin'
                      ? 'Password'
                      : 'New Password (optional)'}
                  </label>
                  <input
                    type="password"
                    value={form.password}
                    onChange={(event) =>
                      setForm((prev) => ({
                        ...prev,
                        password: event.target.value,
                      }))
                    }
                    className="w-full px-4 py-2.5 bg-white/70 dark:bg-white/10 border border-gray-200 dark:border-white/10 rounded-xl text-sm text-gray-900 dark:text-white focus:outline-none input-glow"
                    placeholder={
                      modal === 'create-admin'
                        ? 'Enter admin password'
                        : 'Leave empty to keep current password'
                    }
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={closeModal}
                  disabled={isSaving}
                  className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white bg-primary btn-hover-scale shadow-sm shadow-primary/30 disabled:opacity-50"
                >
                  {isSaving
                    ? 'Saving...'
                    : modal === 'create-admin'
                      ? 'Create Admin'
                      : 'Save Changes'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
