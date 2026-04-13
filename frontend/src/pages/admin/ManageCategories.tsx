import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Edit2, Plus, Search, Trash2, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAppStore } from '../../store/useAppStore';
import type { CarCategory } from '../../types';

const MIN_CATEGORY_NAME_LENGTH = 2;

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : 'Failed to save category.';
}

export function ManageCategories() {
  const {
    addCategory,
    categories,
    deleteCategory,
    fetchCategories,
    updateCategory,
  } = useAppStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [modal, setModal] = useState<'add' | 'edit' | null>(null);
  const [editing, setEditing] = useState<CarCategory | null>(null);
  const [categoryName, setCategoryName] = useState('');

  useEffect(() => {
    void fetchCategories();
  }, [fetchCategories]);

  const filteredCategories = useMemo(
    () =>
      categories.filter((category) =>
        category.name.toLowerCase().includes(searchTerm.toLowerCase()),
      ),
    [categories, searchTerm],
  );

  const openAdd = () => {
    setModal('add');
    setEditing(null);
    setCategoryName('');
  };

  const openEdit = (category: CarCategory) => {
    setModal('edit');
    setEditing(category);
    setCategoryName(category.name);
  };

  const closeModal = () => {
    setModal(null);
  };

  const handleSave = async () => {
    const normalizedName = categoryName.trim();

    if (normalizedName.length < MIN_CATEGORY_NAME_LENGTH) {
      toast.error(`Category name must be at least ${MIN_CATEGORY_NAME_LENGTH} characters.`);
      return;
    }

    try {
      if (modal === 'edit' && editing) {
        await updateCategory(editing.id, normalizedName);
        toast.success('Category updated.');
      } else {
        await addCategory(normalizedName);
        toast.success('Category created.');
      }

      closeModal();
    } catch (error: unknown) {
      toast.error(getErrorMessage(error));
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this category?')) {
      return;
    }

    try {
      await deleteCategory(id);
      toast.success('Category deleted.');
    } catch (error: unknown) {
      toast.error(getErrorMessage(error));
    }
  };

  return (
    <div className="max-w-5xl mx-auto w-full">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">
            Car Categories
          </h1>
          <p className="text-gray-400 mt-1">
            Create and manage categories for car listings.
          </p>
        </div>
        <button
          onClick={openAdd}
          className="flex items-center gap-2 px-4 py-2.5 bg-primary text-white rounded-xl text-sm font-semibold btn-hover-scale shadow-sm shadow-primary/30"
        >
          <Plus size={17} /> Add Category
        </button>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card overflow-hidden"
      >
        <div className="p-4 border-b border-gray-100 dark:border-white/10 bg-white/20 dark:bg-white/5">
          <div className="relative w-full sm:w-72">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
            />
            <input
              type="text"
              placeholder="Search categories..."
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-white/60 dark:bg-white/10 border border-gray-200 dark:border-white/10 rounded-xl text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none input-glow transition-all-smooth"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-600 dark:text-gray-300">
            <thead className="text-xs uppercase bg-gray-50/80 dark:bg-white/5 font-semibold border-b border-gray-100 dark:border-white/10">
              <tr>
                <th className="px-6 py-4">Category</th>
                <th className="px-6 py-4">Cars</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-white/10">
              {filteredCategories.map((category, index) => (
                <motion.tr
                  key={category.id}
                  initial={{ opacity: 0, x: -16 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.04 }}
                  className="hover:bg-white/40 dark:hover:bg-white/5 transition-colors"
                >
                  <td className="px-6 py-4 font-semibold text-gray-900 dark:text-white">
                    {category.name}
                  </td>
                  <td className="px-6 py-4">{category.carCount ?? 0}</td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => openEdit(category)}
                        className="p-2 text-gray-400 hover:text-primary hover:bg-primary/10 rounded-lg btn-hover-scale"
                        title="Edit"
                      >
                        <Edit2 size={15} />
                      </button>
                      <button
                        onClick={() => handleDelete(category.id)}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg btn-hover-scale"
                        title="Delete"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>

          {filteredCategories.length === 0 && (
            <div className="p-10 text-center text-gray-400">
              No categories found for "{searchTerm}".
            </div>
          )}
        </div>
      </motion.div>

      <AnimatePresence>
        {modal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 modal-backdrop">
            <motion.div
              initial={{ opacity: 0, scale: 0.93, y: 24 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.93, y: 24 }}
              transition={{ type: 'spring', damping: 26 }}
              className="glass-card w-full max-w-md p-7"
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  {modal === 'edit' ? 'Edit Category' : 'Add Category'}
                </h2>
                <button
                  onClick={closeModal}
                  className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
                >
                  <X size={18} className="text-gray-500" />
                </button>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Category Name
                </label>
                <input
                  type="text"
                  value={categoryName}
                  onChange={(event) => setCategoryName(event.target.value)}
                  placeholder="e.g. Sedan"
                  className="w-full px-3 py-2.5 bg-white/70 dark:bg-white/10 border border-gray-200 dark:border-white/10 rounded-xl text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none input-glow"
                />
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={closeModal}
                  className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white bg-primary btn-hover-scale shadow-sm shadow-primary/30"
                >
                  {modal === 'edit' ? 'Save Changes' : 'Add Category'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
