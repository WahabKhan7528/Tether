import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { getReels, deleteReel } from '../api/reels';
import { getCategories } from '../api/categories';
import ReelCard from '../components/ReelCard';
import LoadingSpinner from '../components/LoadingSpinner';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Film, ChevronDown, Check, Sparkles, ChevronLeft, ChevronRight } from 'lucide-react';

import CustomDropdown from '../components/CustomDropdown';
import ConfirmationModal from '../components/ui/ConfirmationModal';
import { toast } from 'react-hot-toast';
import { useSocket } from '../context/SocketContext';

export default function Reels() {
  const queryClient = useQueryClient();
  const socket = useSocket();
  const [filters, setFilters] = useState({ categoryId: '', isDone: '' });
  const [page, setPage] = useState(1);
  const [reelToDelete, setReelToDelete] = useState(null);

  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: () => getCategories().then(r => r.data.data),
  });

  const {
    data: reelsData,
    isLoading: loading,
    isError
  } = useQuery({
    queryKey: ['reels', { page, filters }],
    queryFn: () => {
      const params = { page, limit: 20 };
      if (filters.categoryId) params.categoryId = filters.categoryId;
      if (filters.isDone !== '') params.isDone = filters.isDone;
      return getReels(params).then(r => r.data);
    },
    keepPreviousData: true,
  });

  const reels = reelsData?.data || [];
  const pagination = reelsData?.pagination || null;
  const error = isError ? 'Could not load reels. Please try again.' : '';

  const deleteMutation = useMutation({
    mutationFn: (id) => deleteReel(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reels'] });
      if (socket) socket.emit('content_updated');
      toast.success('Reel removed successfully');
      setReelToDelete(null);
    },
    onError: () => {
      toast.error('Failed to remove reel');
      setReelToDelete(null);
    }
  });

  const handleFilter = (key, val) => {
    setFilters((prev) => ({ ...prev, [key]: val }));
    setPage(1);
  };

  const handleUpdate = async (updated) => {
    await queryClient.invalidateQueries({ queryKey: ['reels'] });
  };

  const handleDelete = (id) => {
    setReelToDelete(id);
  };

  const confirmDelete = () => {
    if (reelToDelete) deleteMutation.mutate(reelToDelete);
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
              Reels<span className="text-ethereal-primary/70">.</span>
            </h1>
            <p className="text-ethereal-tertiary/60 font-sans text-xl md:text-2xl font-light tracking-wide max-w-xl mt-6 leading-relaxed">
              Ideas, inspiration, and moments you want to recreate together.
            </p>
          </motion.div>
          
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2, duration: 0.5 }}>
            <Link to="/reels/new" className="group relative hidden sm:flex items-center justify-center gap-3 px-8 py-4 bg-ethereal-primary text-ethereal-surface font-bold tracking-wide rounded-full overflow-hidden shadow-[0_8px_30px_rgba(var(--color-primary),0.25)] hover:shadow-[0_12px_40px_rgba(var(--color-primary),0.35)] hover:-translate-y-1 transition-all duration-400">
              <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-400 ease-out rounded-full"></div>
              <Sparkles size={18} className="relative z-10" />
              <span className="relative z-10 text-sm sm:text-base">Save reel</span>
            </Link>
            <Link to="/reels/new" className="w-14 h-14 bg-ethereal-primary text-white rounded-full flex items-center justify-center shadow-ambient sm:hidden active:scale-95 transition-transform z-50 fixed bottom-24 right-6">
              <Plus size={24} />
            </Link>
          </motion.div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto pl-6 pr-6 sm:pl-12 sm:pr-12 md:pl-28 md:pr-16">
        <motion.div 
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="flex flex-col sm:flex-row gap-4 mb-12"
        >
          <CustomDropdown 
            className="sm:w-64"
            value={filters.categoryId}
            onChange={(val) => handleFilter('categoryId', val)}
            options={[
              { value: '', label: 'All Collections' },
              ...categories.map((c) => ({ value: c._id, label: c.name }))
            ]}
            placeholder="All Collections"
          />
          
          <CustomDropdown 
            className="sm:w-64"
            value={filters.isDone}
            onChange={(val) => handleFilter('isDone', val)}
            options={[
              { value: '', label: 'Any Status' },
              { value: 'false', label: 'Still to do' },
              { value: 'true', label: 'Completed' }
            ]}
            placeholder="Any Status"
          />
        </motion.div>

        {error && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-4 bg-ethereal-error/10 text-ethereal-error rounded-2xl mb-8 text-sm font-medium border border-ethereal-error/20">
            {error}
          </motion.div>
        )}

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-48 rounded-[1.5rem] bg-ethereal-surface-dim/30 animate-pulse"></div>
            ))}
          </div>
        ) : reels.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
            className="w-full rounded-[2rem] flex flex-col items-center justify-center text-center bg-gradient-to-b from-ethereal-surface-dim/60 to-ethereal-surface-dim/20 border border-ethereal-outline/50 shadow-ambient p-16 md:p-24 mt-4"
          >
            <div className="w-24 h-24 bg-ethereal-surface-dim rounded-full flex items-center justify-center mb-6 shadow-inner border border-white/40">
              <Film size={40} strokeWidth={1.5} className="text-ethereal-primary/50" />
            </div>
            <h3 className="text-3xl font-heading text-ethereal-tertiary mb-3 tracking-tight">Nothing saved yet</h3>
            <p className="text-ethereal-tertiary/60 mb-8 max-w-md text-lg leading-relaxed">
              {filters.categoryId || filters.isDone !== '' ? 'No reels found with these filters.' : 'Find something you want to recreate together.'}
            </p>
            <Link to="/reels/new" className="btn-primary shadow-xl hover:shadow-2xl">
              <Sparkles size={18} />
              Save your first reel
            </Link>
          </motion.div>
        ) : (
          <>
            <motion.div layout className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <AnimatePresence mode="popLayout">
                {reels.map((r, index) => (
                  <motion.div
                    key={r._id}
                    layout
                    initial={{ opacity: 0, scale: 0.9, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
                    transition={{ duration: 0.5, delay: index * 0.05 }}
                  >
                    <ReelCard reel={r} onUpdate={handleUpdate} onDelete={handleDelete} />
                  </motion.div>
                ))}
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

      <ConfirmationModal
        isOpen={!!reelToDelete}
        onClose={() => setReelToDelete(null)}
        onConfirm={confirmDelete}
        title="Remove Reel"
        message="Are you sure you want to remove this reel from your collections? This action cannot be undone."
        confirmText="Remove"
      />
    </div>
  );
}
