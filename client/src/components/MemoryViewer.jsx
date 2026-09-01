import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, MapPin, Calendar, Edit3, Trash2, ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';

function formatDate(date) {
  if (!date) return null;
  return new Date(date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}

export default function MemoryViewer({ memory, onClose, onDelete }) {
  const images = memory?.images?.sort((a, b) => a.order - b.order) || [];
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    // Reset index when memory changes
    setCurrentIndex(0);
    
    // Prevent background scrolling when modal is open
    if (memory) {
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [memory]);

  const nextImage = (e) => {
    e.stopPropagation();
    if (currentIndex < images.length - 1) setCurrentIndex((c) => c + 1);
  };

  const prevImage = (e) => {
    e.stopPropagation();
    if (currentIndex > 0) setCurrentIndex((c) => c - 1);
  };

  if (!memory) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 md:p-12">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/70 backdrop-blur-md"
        />

        {/* Modal Content */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ type: "spring", stiffness: 350, damping: 25 }}
          className="relative w-full max-w-6xl max-h-full bg-ethereal-surface-dim rounded-[2rem] shadow-2xl overflow-hidden flex flex-col md:flex-row border border-white/20 z-10"
        >
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 sm:top-6 sm:right-6 w-10 h-10 bg-black/40 backdrop-blur-md rounded-full flex items-center justify-center text-white/90 hover:bg-black/80 hover:text-white transition-colors z-50 border border-white/10"
          >
            <X size={20} strokeWidth={2} />
          </button>

          {/* Left: Image Carousel */}
          <div className="relative w-full md:w-3/5 h-[40vh] md:h-auto md:min-h-[70vh] bg-[#0a0a0a] flex items-center justify-center group overflow-hidden">
            {images.length > 0 ? (
              <AnimatePresence mode="wait">
                <motion.img
                  key={currentIndex}
                  initial={{ opacity: 0, scale: 1.05 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  src={images[currentIndex].url}
                  alt={`Memory photo ${currentIndex + 1}`}
                  className="absolute inset-0 w-full h-full object-contain"
                />
              </AnimatePresence>
            ) : (
              <div className="flex flex-col items-center justify-center opacity-50">
                <Sparkles size={48} strokeWidth={1} className="text-white mb-4" />
                <p className="text-white font-heading">No images found</p>
              </div>
            )}

            {/* Navigation Controls */}
            {images.length > 1 && (
              <>
                <button
                  onClick={prevImage}
                  disabled={currentIndex === 0}
                  className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-black/40 backdrop-blur-md rounded-full flex items-center justify-center text-white disabled:opacity-0 opacity-0 group-hover:opacity-100 transition-all border border-white/10 hover:bg-white/20 hover:scale-110 active:scale-95"
                >
                  <ChevronLeft size={28} />
                </button>
                <button
                  onClick={nextImage}
                  disabled={currentIndex === images.length - 1}
                  className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-black/40 backdrop-blur-md rounded-full flex items-center justify-center text-white disabled:opacity-0 opacity-0 group-hover:opacity-100 transition-all border border-white/10 hover:bg-white/20 hover:scale-110 active:scale-95"
                >
                  <ChevronRight size={28} />
                </button>

                {/* Dots */}
                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2 p-2 bg-black/20 backdrop-blur-md rounded-full border border-white/10">
                  {images.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => setCurrentIndex(idx)}
                      className={`w-2 h-2 rounded-full transition-all duration-300 ${idx === currentIndex ? 'bg-white w-5' : 'bg-white/40 hover:bg-white/80'}`}
                    />
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Right: Details */}
          <div className="w-full md:w-2/5 p-8 md:p-12 flex flex-col h-full max-h-[50vh] md:max-h-[80vh] overflow-y-auto hide-scrollbar bg-ethereal-surface-dim/95 backdrop-blur-xl">
            
            {memory.categoryId && (
              <div className="mb-6">
                <span className="inline-block px-4 py-1.5 bg-ethereal-primary/10 border border-ethereal-primary/20 text-ethereal-primary text-[10px] uppercase tracking-[0.2em] font-bold rounded-full">
                  {memory.categoryId.name}
                </span>
              </div>
            )}

            <h2 className="font-heading text-4xl md:text-5xl text-ethereal-tertiary tracking-tight drop-shadow-sm mb-4 leading-tight">
              {memory.title}
            </h2>

            <div className="flex flex-col gap-3 mb-8 text-ethereal-tertiary/70 font-sans text-sm border-b border-ethereal-outline/30 pb-6">
              {formatDate(memory.dateTaken) && (
                <span className="flex items-center gap-2 font-semibold uppercase tracking-wider text-[11px]">
                  <Calendar size={14} className="text-ethereal-primary" />
                  {formatDate(memory.dateTaken)}
                </span>
              )}
              {memory.location && (
                <span className="flex items-center gap-2 font-semibold uppercase tracking-wider text-[11px]">
                  <MapPin size={14} className="text-ethereal-primary" />
                  {memory.location}
                </span>
              )}
            </div>

            <div className="flex-1 min-h-[100px]">
              {memory.description ? (
                <p className="text-ethereal-tertiary/80 text-base leading-relaxed whitespace-pre-wrap font-sans">
                  {memory.description}
                </p>
              ) : (
                <p className="text-ethereal-tertiary/40 italic text-sm">No description provided.</p>
              )}
            </div>

            {/* Actions */}
            <div className="mt-8 flex items-center gap-4 pt-6 border-t border-ethereal-outline/50">
              <Link
                to={`/memories/${memory._id}/edit`}
                className="flex-1 flex items-center justify-center gap-2 px-6 py-4 bg-ethereal-primary text-white font-bold tracking-wide rounded-full hover:bg-opacity-90 active:scale-95 transition-all shadow-lg hover:shadow-xl"
              >
                <Edit3 size={18} />
                <span>Edit Memory</span>
              </Link>
              
              <button
                onClick={(e) => {
                  onDelete(memory._id, e);
                }}
                className="w-14 h-14 flex items-center justify-center text-ethereal-tertiary/60 hover:text-ethereal-error hover:bg-ethereal-error/10 rounded-full transition-colors border border-transparent hover:border-ethereal-error/20"
                title="Delete"
              >
                <Trash2 size={22} />
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
