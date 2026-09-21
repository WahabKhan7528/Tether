import { useState, useMemo } from 'react';
import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import BottomNav from '../components/BottomNav';
import GalleryGrid from '../components/gallery/GalleryGrid';
import GalleryLightbox from '../components/gallery/GalleryLightbox';
import GalleryUploadModal from '../components/gallery/GalleryUploadModal';
import { Plus, Sparkles, Images, Camera } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ConfirmationModal from '../components/ui/ConfirmationModal';
import { toast } from 'react-hot-toast';
import { useSocket } from '../context/SocketContext';

import api from '../api/axios';

export default function Gallery() {
  const queryClient = useQueryClient();
  const [lightboxIndex, setLightboxIndex] = useState(null);
  const [showUpload, setShowUpload] = useState(false);
  const [photoToDelete, setPhotoToDelete] = useState(null);

  const fetchGalleryPage = async ({ pageParam = 1 }) => {
    const res = await api.get(`/gallery?page=${pageParam}&limit=30`);
    if (!res.data.success) throw new Error(res.data.message);
    return res.data;
  };

  const {
    data,
    error,
    fetchNextPage,
    hasNextPage,
    isFetching,
    isFetchingNextPage,
    status,
  } = useInfiniteQuery({
    queryKey: ['gallery'],
    queryFn: fetchGalleryPage,
    getNextPageParam: (lastPage) => {
      if (!lastPage.pagination) return undefined;
      const { page, totalPages } = lastPage.pagination;
      return page < totalPages ? page + 1 : undefined;
    },
  });

  const images = useMemo(() => {
    return data?.pages.flatMap((page) => page.data) || [];
  }, [data]);

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/gallery/${id}`),
    onSuccess: () => {
      toast.success('Photo removed successfully');
      queryClient.invalidateQueries({ queryKey: ['gallery'] });
      if (socket) socket.emit('content_updated');
      setPhotoToDelete(null);
    },
    onError: () => {
      toast.error('Failed to remove photo');
      setPhotoToDelete(null);
    }
  });

  const handleUploadSuccess = () => {
    setShowUpload(false);
    queryClient.invalidateQueries({ queryKey: ['gallery'] });
    queryClient.invalidateQueries({ queryKey: ['gallery-map'] });
  };

  const handleDeleteGalleryPhoto = (imageId) => {
    setPhotoToDelete(imageId);
  };

  const confirmDeleteGalleryPhoto = () => {
    if (photoToDelete) deleteMutation.mutate(photoToDelete);
  };

  const openLightbox = (index) => setLightboxIndex(index);
  const closeLightbox = () => setLightboxIndex(null);

  return (
    <div className="min-h-screen pb-24 md:pb-8 bg-ethereal-surface">

      {/* Premium Hero Section — offset right to clear sidebar */}
      <div className="relative pt-32 sm:pt-40 md:pt-48 pb-16 pl-6 pr-6 sm:pl-12 sm:pr-12 md:pl-28 md:pr-16 overflow-hidden">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-ethereal-primary/5 rounded-full blur-[100px] -z-10 translate-x-1/3 -translate-y-1/4"></div>
        <div className="absolute top-40 left-0 w-[300px] h-[300px] bg-ethereal-primary/5 rounded-full blur-[80px] -z-10 -translate-x-1/2"></div>

        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-end justify-between gap-10 relative z-10">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }} className="flex flex-col max-w-3xl">
            <h1 className="text-display drop-shadow-sm leading-[0.9] -ml-1 lg:-ml-2">
              Gallery<span className="text-ethereal-primary/70">.</span>
            </h1>
            <p className="text-ethereal-tertiary/60 font-sans text-xl md:text-2xl font-light tracking-wide max-w-xl mt-6 leading-relaxed">
              A collection of all the moments you've shared.
            </p>
          </motion.div>

          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2, duration: 0.5 }} className="flex items-center gap-3">
            {/* Upload to gallery directly */}
            <button
              onClick={() => setShowUpload(true)}
              className="group relative hidden sm:flex items-center justify-center gap-3 px-8 py-4 bg-ethereal-primary text-white font-bold tracking-wide rounded-full overflow-hidden shadow-[0_8px_30px_rgba(var(--color-primary),0.25)] hover:shadow-[0_12px_40px_rgba(var(--color-primary),0.35)] hover:-translate-y-1 transition-all duration-400"
            >
              <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-400 ease-out rounded-full"></div>
              <Camera size={18} className="relative z-10" />
              <span className="relative z-10 text-sm sm:text-base">Upload Photo</span>
            </button>
            {/* Save to memories */}
            <Link
              to="/memories/new"
              className="hidden sm:flex items-center gap-2 px-6 py-4 rounded-full border border-ethereal-outline text-ethereal-tertiary hover:border-ethereal-primary/40 hover:text-ethereal-primary hover:-translate-y-1 transition-all duration-300 text-sm font-semibold"
            >
              <Sparkles size={16} />
              Save Memory
            </Link>
          </motion.div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto pl-6 pr-6 sm:pl-12 sm:pr-12 md:pl-28 md:pr-16">
        {/* Mobile Add Button */}
        <div className="flex sm:hidden mb-6 gap-3">
          <button onClick={() => setShowUpload(true)} className="btn-primary flex-1 py-3.5 flex items-center justify-center gap-2">
            <Camera size={18} />
            Upload Photo
          </button>
          <Link to="/memories/new" className="flex-1 py-3.5 flex items-center justify-center gap-2 rounded-full border border-ethereal-outline text-ethereal-tertiary font-semibold text-sm">
            <Sparkles size={16} />
            Save Memory
          </Link>
        </div>

        {status === 'pending' ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="aspect-square rounded-[1.5rem] bg-ethereal-surface-dim/30 animate-pulse"></div>
            ))}
          </div>
        ) : status === 'error' ? (
          <div className="p-4 bg-ethereal-error/10 text-ethereal-error rounded-2xl mb-8 text-sm font-medium border border-ethereal-error/20">
            {error?.message || 'Failed to load gallery'}
          </div>
        ) : images.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
            className="w-full rounded-[2rem] flex flex-col items-center justify-center text-center bg-gradient-to-b from-ethereal-surface-dim/60 to-ethereal-surface-dim/20 border border-ethereal-outline/50 shadow-ambient p-16 md:p-24 mt-4"
          >
            <div className="w-24 h-24 bg-ethereal-surface-dim rounded-full flex items-center justify-center mb-6 shadow-inner border border-white/40">
              <Images size={40} strokeWidth={1.5} className="text-ethereal-primary/50" />
            </div>
            <h3 className="text-3xl font-heading text-ethereal-tertiary mb-3 tracking-tight">Your gallery is waiting for its first moment</h3>
            <p className="text-ethereal-tertiary/60 mb-8 max-w-md text-lg leading-relaxed">
              Upload photos directly, or add photos to your memories and they'll appear here automatically.
            </p>
            <div className="flex gap-3 flex-wrap justify-center">
              <button onClick={() => setShowUpload(true)} className="btn-primary shadow-xl hover:shadow-2xl">
                <Camera size={18} />
                Upload a Photo
              </button>
              <Link to="/memories/new" className="flex items-center gap-2 px-6 py-3 rounded-full border border-ethereal-outline text-ethereal-tertiary hover:border-ethereal-primary/40 hover:text-ethereal-primary transition-all font-semibold text-sm">
                <Sparkles size={16} />
                Save Memory
              </Link>
            </div>
          </motion.div>
        ) : (
          <>
            <GalleryGrid
              images={images}
              onImageClick={openLightbox}
              onDeleteGalleryPhoto={handleDeleteGalleryPhoto}
            />
            
            {hasNextPage && (
              <div className="mt-12 flex justify-center">
                <button
                  onClick={() => fetchNextPage()}
                  disabled={isFetchingNextPage}
                  className="px-8 py-3 rounded-full border border-ethereal-outline text-ethereal-tertiary hover:border-ethereal-primary/50 hover:bg-ethereal-surface-dim transition-all font-semibold disabled:opacity-50"
                >
                  {isFetchingNextPage ? 'Loading...' : 'Load More'}
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {lightboxIndex !== null && (
        <GalleryLightbox
          images={images}
          currentIndex={lightboxIndex}
          onClose={closeLightbox}
          setIndex={setLightboxIndex}
        />
      )}

      {showUpload && (
        <GalleryUploadModal
          onSuccess={handleUploadSuccess}
          onCancel={() => setShowUpload(false)}
        />
      )}

      <ConfirmationModal
        isOpen={!!photoToDelete}
        onClose={() => setPhotoToDelete(null)}
        onConfirm={confirmDeleteGalleryPhoto}
        title="Remove Photo"
        message="Are you sure you want to remove this photo from your gallery? This action cannot be undone."
        confirmText="Remove"
      />

      <BottomNav />
    </div>
  );
}
