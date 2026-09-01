import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { getMemories, deleteMemory } from '../api/memories';
import { getCategories, createCategory, updateCategory, deleteCategory } from '../api/categories';
import MemoryCard from '../components/MemoryCard';
import MemoryViewer from '../components/MemoryViewer';
import LoadingSpinner from '../components/LoadingSpinner';
import ConfirmationModal from '../components/ui/ConfirmationModal';
import { toast } from 'react-hot-toast';
import { useSocket } from '../context/SocketContext';


import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, Trash2, FolderHeart, Images, Sparkles, ChevronLeft, ChevronRight,
  Folder, Globe, Pizza, Plane, Heart, Film, Mountain, Palette, Flower2, 
  BookOpen, Home, Star, Coffee, Wine, Palmtree, X, Settings2 
} from 'lucide-react';

const ICON_MAP = {
  Folder: <Folder size={24} strokeWidth={1.5} />,
  Globe: <Globe size={24} strokeWidth={1.5} />,
  Pizza: <Pizza size={24} strokeWidth={1.5} />,
  Plane: <Plane size={24} strokeWidth={1.5} />,
  Heart: <Heart size={24} strokeWidth={1.5} />,
  Film: <Film size={24} strokeWidth={1.5} />,
  Mountain: <Mountain size={24} strokeWidth={1.5} />,
  Palette: <Palette size={24} strokeWidth={1.5} />,
  Flower2: <Flower2 size={24} strokeWidth={1.5} />,
  BookOpen: <BookOpen size={24} strokeWidth={1.5} />,
  Home: <Home size={24} strokeWidth={1.5} />,
  Star: <Star size={24} strokeWidth={1.5} />,
  Coffee: <Coffee size={24} strokeWidth={1.5} />,
  Wine: <Wine size={24} strokeWidth={1.5} />,
  Palmtree: <Palmtree size={24} strokeWidth={1.5} />
};

const ICON_OPTIONS = Object.keys(ICON_MAP);

export default function Memories() {
  const queryClient = useQueryClient();
  const socket = useSocket();
  const [selectedCategory, setSelectedCategory] = useState('');
  const [page, setPage] = useState(1);
  const [viewingMemory, setViewingMemory] = useState(null);
  const [memoryToDelete, setMemoryToDelete] = useState(null);
  const [categoryToDelete, setCategoryToDelete] = useState(null);

  // Collections form state
  const [showForm, setShowForm] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [form, setForm] = useState({ name: '', icon: 'Folder' });

  // ─── QUERIES ─────────────────────────────────────────────────────────────
  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: () => getCategories().then(r => r.data.data),
  });

  const {
    data: memoriesData,
    isLoading: loading,
    isError,
  } = useQuery({
    queryKey: ['memories', { page, selectedCategory }],
    queryFn: () => {
      const params = { page, limit: 12 };
      if (selectedCategory) params.categoryId = selectedCategory;
      return getMemories(params).then(r => r.data);
    },
    keepPreviousData: true,
  });

  const memories = memoriesData?.data || [];
  const pagination = memoriesData?.pagination || null;
  const error = isError ? 'Could not load memories. Please try again.' : '';

  // ─── MUTATIONS ───────────────────────────────────────────────────────────
  const saveCategoryMutation = useMutation({
    mutationFn: (data) => editTarget ? updateCategory(editTarget._id, data) : createCategory(data),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      if (!editTarget) {
        handleCategoryChange(res.data.data._id);
      }
      if (socket) socket.emit('content_updated');
      closeForm();
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Could not save collection.');
    }
  });

  const deleteCategoryMutation = useMutation({
    mutationFn: (id) => deleteCategory(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      if (selectedCategory === id) {
        handleCategoryChange('');
      }
      if (socket) socket.emit('content_updated');
      closeForm();
      toast.success('Collection removed successfully');
      setCategoryToDelete(null);
    },
    onError: () => {
      toast.error('Failed to remove collection');
      setCategoryToDelete(null);
    }
  });

  const deleteMemoryMutation = useMutation({
    mutationFn: (id) => deleteMemory(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['memories'] });
      if (socket) socket.emit('content_updated');
      toast.success('Memory removed successfully');
      setMemoryToDelete(null);
      if (viewingMemory && viewingMemory._id === id) {
        setViewingMemory(null);
      }
    },
    onError: () => {
      toast.error('Failed to remove memory');
      setMemoryToDelete(null);
    }
  });

  // ─── HANDLERS ────────────────────────────────────────────────────────────
  const handleCategoryChange = (catId) => {
    setSelectedCategory(catId);
    setPage(1);
  };

  const openCreate = () => { setEditTarget(null); setForm({ name: '', icon: 'Folder' }); setShowForm(true); };
  const openEdit = (cat) => { setEditTarget(cat); setForm({ name: cat.name, icon: cat.icon || 'Folder' }); setShowForm(true); };
  const closeForm = () => { setShowForm(false); setEditTarget(null); };

  const handleSaveCategory = (e) => {
    e.preventDefault();
    saveCategoryMutation.mutate(form);
  };

  const handleDeleteCategory = (id) => {
    setCategoryToDelete(id);
  };

  const confirmDeleteCategory = () => {
    if (categoryToDelete) deleteCategoryMutation.mutate(categoryToDelete);
  };

  const handleDelete = (id, e) => {
    if (e) e.preventDefault();
    setMemoryToDelete(id);
  };

  const confirmDeleteMemory = () => {
    if (memoryToDelete) deleteMemoryMutation.mutate(memoryToDelete);
  };

  const isFeatured = (index) => {
    // Make every 1st and 8th item large for a dynamic magazine-like layout
    return index % 7 === 0 || index % 7 === 4;
  };

  return (
    <div className="min-h-screen bg-ethereal-surface pb-16">


      
      {/* Premium Hero Section */}
      <div className="relative pt-32 sm:pt-40 md:pt-48 pb-16 pl-6 pr-6 sm:pl-12 sm:pr-12 md:pl-28 md:pr-16 overflow-hidden">
        {/* Subtle background glow/decoration */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-ethereal-primary/5 rounded-full blur-[100px] -z-10 translate-x-1/3 -translate-y-1/4"></div>
        <div className="absolute top-40 left-0 w-[300px] h-[300px] bg-ethereal-primary/5 rounded-full blur-[80px] -z-10 -translate-x-1/2"></div>
        
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-end justify-between gap-10 relative z-10">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }} className="flex flex-col max-w-3xl">
            <h1 className="text-display drop-shadow-sm leading-[0.9] -ml-1 lg:-ml-2">
              Memories<span className="text-ethereal-primary/70">.</span>
            </h1>
            <p className="text-ethereal-tertiary/60 font-sans text-xl md:text-2xl font-light tracking-wide max-w-xl mt-6 leading-relaxed">
              A curated collection of your most timeless moments, beautifully preserved forever.
            </p>
          </motion.div>
          
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2, duration: 0.5 }}>
            <Link to="/memories/new" className="group relative hidden sm:flex items-center justify-center gap-3 px-8 py-4 bg-ethereal-primary text-ethereal-surface font-bold tracking-wide rounded-full overflow-hidden shadow-[0_8px_30px_rgba(var(--color-primary),0.25)] hover:shadow-[0_12px_40px_rgba(var(--color-primary),0.35)] hover:-translate-y-1 transition-all duration-400">
              <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-400 ease-out rounded-full"></div>
              <Sparkles size={18} className="relative z-10" />
              <span className="relative z-10 text-sm sm:text-base">Save memory</span>
            </Link>
          </motion.div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto pl-6 pr-6 sm:pl-12 sm:pr-12 md:pl-28 md:pr-16">
        {/* Mobile Add Button */}
        <div className="flex sm:hidden mb-6">
          <Link to="/memories/new" className="btn-primary w-full py-3.5 flex items-center justify-center gap-2">
            <Sparkles size={18} />
            Save Memory
          </Link>
        </div>

        {/* Categories (Framer Motion Pill Dock) */}
        <div className="flex flex-col mb-12">
          <motion.div 
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className="flex overflow-x-auto hide-scrollbar gap-2 sm:gap-4 pb-4 -mx-6 px-6 sm:mx-0 sm:px-0 relative"
          >
            <button
              onClick={() => handleCategoryChange('')}
              className={`relative px-6 py-2.5 rounded-full text-sm font-semibold tracking-wide transition-all duration-300 z-10 flex-shrink-0 ${
                selectedCategory === '' ? 'text-white' : 'text-ethereal-tertiary/70 hover:text-ethereal-primary bg-ethereal-surface-dim/40 hover:bg-ethereal-surface-dim/80'
              }`}
            >
              {selectedCategory === '' && (
                <motion.div layoutId="activeCategory" className="absolute inset-0 bg-ethereal-primary rounded-full -z-10 shadow-lg" transition={{ type: "spring", stiffness: 400, damping: 30 }} />
              )}
              <span>All</span>
            </button>
            {categories.map((cat) => (
              <button
                key={cat._id}
                onClick={() => handleCategoryChange(cat._id)}
                className={`group relative flex items-center gap-2 px-6 py-2.5 rounded-full text-sm font-semibold tracking-wide transition-all duration-300 z-10 flex-shrink-0 ${
                  selectedCategory === cat._id ? 'text-white' : 'text-ethereal-tertiary/70 hover:text-ethereal-primary bg-ethereal-surface-dim/40 hover:bg-ethereal-surface-dim/80'
                }`}
              >
                {selectedCategory === cat._id && (
                  <motion.div layoutId="activeCategory" className="absolute inset-0 bg-ethereal-primary rounded-full -z-10 shadow-lg" transition={{ type: "spring", stiffness: 400, damping: 30 }} />
                )}
                <FolderHeart size={16} strokeWidth={selectedCategory === cat._id ? 2.5 : 2} className={selectedCategory === cat._id ? 'text-white' : 'text-ethereal-tertiary/50 group-hover:text-ethereal-primary'} />
                <span>{cat.name}</span>
              </button>
            ))}
            <button
              onClick={openCreate}
              className="relative flex items-center gap-2 px-6 py-2.5 rounded-full text-sm font-semibold tracking-wide transition-all duration-300 z-10 flex-shrink-0 text-ethereal-primary border border-ethereal-primary/30 hover:bg-ethereal-primary/10 hover:border-ethereal-primary"
            >
              <Plus size={16} strokeWidth={2.5} />
              <span>New Collection</span>
            </button>
          </motion.div>

          {/* Manage Collection Button */}
          <AnimatePresence>
            {selectedCategory && (
              <motion.div
                initial={{ opacity: 0, height: 0, marginTop: 0 }}
                animate={{ opacity: 1, height: 'auto', marginTop: 8 }}
                exit={{ opacity: 0, height: 0, marginTop: 0 }}
                className="flex items-center overflow-hidden"
              >
                <button
                  onClick={() => openEdit(categories.find(c => c._id === selectedCategory))}
                  className="flex items-center gap-2 text-sm text-ethereal-tertiary/60 hover:text-ethereal-primary transition-colors py-1 px-3 rounded-lg hover:bg-ethereal-surface-dim/50 border border-ethereal-outline/30 shadow-sm"
                >
                  <Settings2 size={14} />
                  <span>Manage Collection</span>
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {error && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-4 bg-ethereal-error/10 text-ethereal-error rounded-2xl mb-8 text-sm font-medium border border-ethereal-error/20">
            {error}
          </motion.div>
        )}

        {/* Collection Modal */}
        <AnimatePresence>
          {showForm && (
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ethereal-surface/80 backdrop-blur-md"
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                transition={{ duration: 0.3 }}
                className="w-full max-w-lg bg-ethereal-surface-dim rounded-[2rem] shadow-2xl p-5 sm:p-8 md:p-12 relative max-h-[90vh] overflow-y-auto border border-ethereal-outline/50"
              >
                <button onClick={closeForm} className="absolute top-6 right-6 w-10 h-10 flex items-center justify-center text-ethereal-tertiary/40 hover:bg-ethereal-surface-dim hover:text-ethereal-tertiary rounded-full transition-all">
                  <X size={20} />
                </button>

                <h2 className="font-heading text-4xl text-ethereal-tertiary mb-8 tracking-tight">{editTarget ? 'Edit Collection' : 'New Collection'}</h2>

                <form onSubmit={handleSaveCategory} className="space-y-8">
                  <div>
                    <label className="block text-sm font-medium text-ethereal-tertiary/70 mb-2">Name</label>
                    <input
                      type="text"
                      className="w-full bg-ethereal-surface border border-ethereal-outline rounded-2xl px-5 py-4 text-ethereal-tertiary placeholder:text-ethereal-tertiary/30 focus:outline-none focus:border-ethereal-primary focus:ring-1 focus:ring-ethereal-primary transition-all"
                      placeholder="E.g., Places to visit"
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      required
                      maxLength={50}
                      autoFocus
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-ethereal-tertiary/70 mb-4">Choose an Icon</label>
                    <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
                      {ICON_OPTIONS.map((iconKey) => {
                        const isSelected = form.icon === iconKey || (!ICON_MAP[form.icon] && iconKey === 'Folder');
                        return (
                          <button
                            key={iconKey}
                            type="button"
                            onClick={() => setForm({ ...form, icon: iconKey })}
                            className={`aspect-square rounded-2xl flex items-center justify-center transition-all duration-300 ${isSelected
                                ? 'bg-ethereal-primary/10 text-ethereal-primary border border-ethereal-primary shadow-sm scale-105'
                                : 'bg-ethereal-surface border border-ethereal-outline text-ethereal-tertiary/40 hover:border-ethereal-primary/30 hover:text-ethereal-tertiary'
                              }`}
                          >
                            {ICON_MAP[iconKey]}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="pt-8 border-t border-ethereal-outline/30 flex flex-col gap-4">
                    <button type="submit" disabled={saveCategoryMutation.isPending} className="btn-primary w-full py-4 text-base shadow-lg">
                      {saveCategoryMutation.isPending ? <LoadingSpinner size="sm" /> : editTarget ? 'Save Changes' : 'Create Collection'}
                    </button>
                    {editTarget && (
                      <button type="button" onClick={() => handleDeleteCategory(editTarget._id)} className="w-full py-3 text-ethereal-error/70 font-medium hover:bg-ethereal-error/10 hover:text-ethereal-error rounded-2xl transition-colors text-sm">
                        Delete Collection
                      </button>
                    )}
                  </div>
                </form>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6 auto-rows-[300px]">
            {[...Array(6)].map((_, i) => (
              <div key={i} className={`rounded-[2rem] bg-ethereal-surface-dim/30 animate-pulse ${isFeatured(i) ? 'sm:col-span-2 sm:row-span-2' : 'col-span-1 row-span-1'}`}></div>
            ))}
          </div>
        ) : memories.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
            className="w-full rounded-[2rem] flex flex-col items-center justify-center text-center bg-gradient-to-b from-ethereal-surface-dim/60 to-ethereal-surface-dim/20 border border-ethereal-outline/50 shadow-ambient p-16 md:p-24 mt-4"
          >
            <div className="w-24 h-24 bg-ethereal-surface-dim rounded-full flex items-center justify-center mb-6 shadow-inner border border-white/40">
              <Images size={40} strokeWidth={1.5} className="text-ethereal-primary/50" />
            </div>
            <h3 className="text-3xl font-heading text-ethereal-tertiary mb-3 tracking-tight">Your collection is empty</h3>
            <p className="text-ethereal-tertiary/60 mb-8 max-w-md text-lg leading-relaxed">
              {selectedCategory ? 'No moments have been added to this collection yet.' : 'Begin curating the moments you never want to forget.'}
            </p>
            <Link to="/memories/new" className="btn-primary shadow-xl hover:shadow-2xl">
              <Sparkles size={18} />
              Save your first memory
            </Link>
          </motion.div>
        ) : (
          <>
            <motion.div 
              layout
              className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6 auto-rows-min md:auto-rows-[300px] grid-flow-row-dense"
            >
              <AnimatePresence mode="popLayout">
                {memories.map((m, index) => {
                  const featured = isFeatured(index);
                  return (
                    <motion.div 
                      layout
                      initial={{ opacity: 0, scale: 0.9, y: 20 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
                      transition={{ duration: 0.5, delay: index * 0.05 }}
                      key={m._id} 
                      className={`relative group h-[350px] sm:h-auto ${featured ? 'md:col-span-2 md:row-span-2' : 'col-span-1 row-span-1'}`}
                    >
                      <MemoryCard memory={m} featured={featured} onClick={() => setViewingMemory(m)} />
                      
                      <button
                        onClick={(e) => handleDelete(m._id, e)}
                        className="absolute top-5 right-5 w-11 h-11 rounded-full bg-black/20 backdrop-blur-md text-white/80 flex items-center justify-center opacity-0 group-hover:opacity-100 hover:bg-ethereal-error hover:text-white transition-all duration-300 z-30 border border-white/20 shadow-xl transform translate-y-2 group-hover:translate-y-0"
                        aria-label="Remove memory"
                      >
                        <Trash2 size={18} />
                      </button>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </motion.div>

            {/* Premium Pagination */}
            {pagination && pagination.totalPages > 1 && (
              <div className="flex justify-center items-center gap-4 mt-20 mb-8">
                <button
                  onClick={() => { setPage(p => p - 1); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                  disabled={page === 1}
                  className="w-12 h-12 flex items-center justify-center rounded-full bg-ethereal-surface-dim/50 border border-ethereal-outline text-ethereal-tertiary hover:bg-ethereal-primary hover:text-white hover:border-ethereal-primary transition-all disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-ethereal-tertiary disabled:hover:border-ethereal-outline"
                >
                  <ChevronLeft size={20} />
                </button>
                
                <div className="px-6 py-3 rounded-full bg-ethereal-surface-dim/30 border border-ethereal-outline/50 flex items-center gap-2">
                  <span className="text-label text-ethereal-tertiary">
                    Page {page} <span className="text-ethereal-tertiary/40 mx-1">of</span> {pagination.totalPages}
                  </span>
                </div>
                
                <button
                  onClick={() => { setPage(p => p + 1); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                  disabled={page === pagination.totalPages}
                  className="w-12 h-12 flex items-center justify-center rounded-full bg-ethereal-surface-dim/50 border border-ethereal-outline text-ethereal-tertiary hover:bg-ethereal-primary hover:text-white hover:border-ethereal-primary transition-all disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-ethereal-tertiary disabled:hover:border-ethereal-outline"
                >
                  <ChevronRight size={20} />
                </button>
              </div>
            )}
          </>
        )}
      </div>

      <MemoryViewer 
        memory={viewingMemory} 
        onClose={() => setViewingMemory(null)} 
        onDelete={handleDelete}
      />
      
      <ConfirmationModal
        isOpen={!!memoryToDelete}
        onClose={() => setMemoryToDelete(null)}
        onConfirm={confirmDeleteMemory}
        title="Remove Memory"
        message="Are you sure you want to remove this memory? This action cannot be undone."
        confirmText="Remove"
      />

      <ConfirmationModal
        isOpen={!!categoryToDelete}
        onClose={() => setCategoryToDelete(null)}
        onConfirm={confirmDeleteCategory}
        title="Remove Collection"
        message="Are you sure you want to remove this collection? Memories inside will become uncategorized."
        confirmText="Remove Collection"
      />
    </div>
  );
}
