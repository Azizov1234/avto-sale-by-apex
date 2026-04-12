import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Search, Shield, User as UserIcon, Trash2, Edit2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAppStore } from '../../store/useAppStore';

export function ManageUsers() {
  const { users, fetchUsers, updateUser, deleteUser } = useAppStore();
  const [search, setSearch] = useState('');

  useEffect(() => {
    void fetchUsers();
  }, [fetchUsers]);

  const filtered = useMemo(
    () =>
      users.filter((user) =>
        user.name.toLowerCase().includes(search.toLowerCase()) ||
        user.email.toLowerCase().includes(search.toLowerCase()),
      ),
    [search, users],
  );

  const toggleRole = async (id: string) => {
    const currentUser = users.find((user) => user.id === id);

    if (!currentUser) {
      return;
    }

    if (currentUser.role === 'SUPERADMIN') {
      toast.error('Superadmin role cannot be changed here.');
      return;
    }

    const nextRole = currentUser.role === 'ADMIN' ? 'USER' : 'ADMIN';

    try {
      await updateUser(id, { role: nextRole });
      toast.success(`${currentUser.name} is now ${nextRole}.`);
    } catch (error: any) {
      toast.error(error.message || 'Failed to update user role.');
    }
  };

  const handleDeleteUser = async (id: string) => {
    const currentUser = users.find((user) => user.id === id);

    if (!currentUser) {
      return;
    }

    if (!window.confirm(`Delete ${currentUser.name}?`)) {
      return;
    }

    try {
      await deleteUser(id);
      toast.success('User removed.');
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete user.');
    }
  };

  return (
    <div className="max-w-7xl mx-auto w-full">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">Users</h1>
          <p className="text-gray-400 mt-1">Manage user accounts and roles.</p>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 bg-white/60 dark:bg-white/10 border border-white/40 dark:border-white/10 rounded-xl px-4 py-2">
          <UserIcon size={16} /> {users.length} total users
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
        className="glass-card overflow-hidden"
      >
        <div className="p-4 border-b border-gray-100 dark:border-white/10 bg-white/20 dark:bg-white/5">
          <div className="relative w-72">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Search users..."
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
                      <img src={user.avatarUrl} alt={user.name} className="w-9 h-9 rounded-xl object-cover border border-white/30" />
                      <span className="font-semibold text-gray-900 dark:text-white">{user.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-gray-500 dark:text-gray-400">{user.email}</td>
                  <td className="px-6 py-4 text-gray-500 dark:text-gray-400">{user.createdAt}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full ${
                      user.role === 'ADMIN' || user.role === 'SUPERADMIN'
                        ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300'
                        : 'bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-gray-400'
                    }`}>
                      {user.role === 'ADMIN' || user.role === 'SUPERADMIN' ? <Shield size={11} /> : <UserIcon size={11} />}
                      {user.role}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => toggleRole(user.id)}
                        title="Toggle role"
                        className="p-2 text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg btn-hover-scale"
                      >
                        <Edit2 size={15} />
                      </button>
                      <button
                        onClick={() => handleDeleteUser(user.id)}
                        title="Delete user"
                        className="p-2 text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg btn-hover-scale"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>

          {filtered.length === 0 && (
            <div className="p-10 text-center text-gray-400">No users found for "{search}".</div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
