import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';

export default function GalleryLightbox({ images, currentIndex, onClose, setIndex }) {
  const currentImage = images[currentIndex];

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') handleNext();
      if (e.key === 'ArrowLeft') handlePrev();
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex]);

  const handleNext = (e) => {
    if (e) e.stopPropagation();
    setIndex((currentIndex + 1) % images.length);
  };

  const handlePrev = (e) => {
    if (e) e.stopPropagation();
    setIndex((currentIndex - 1 + images.length) % images.length);
  };

  if (!currentImage) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-sm flex items-center justify-center"
        onClick={onClose}
      >
        <button 
          onClick={onClose}
          className="absolute top-6 right-6 z-10 w-12 h-12 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
        >
          <X size={24} />
        </button>

        {images.length > 1 && (
          <button 
            onClick={handlePrev}
            className="absolute left-4 sm:left-8 z-10 w-12 h-12 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
          >
            <ChevronLeft size={24} />
          </button>
        )}

        {images.length > 1 && (
          <button 
            onClick={handleNext}
            className="absolute right-4 sm:right-8 z-10 w-12 h-12 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
          >
            <ChevronRight size={24} />
          </button>
        )}

        <div className="relative w-full max-w-5xl max-h-[85vh] flex flex-col items-center justify-center p-4">
          <motion.img 
            key={currentImage._id}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            src={currentImage.url} 
            alt={currentImage.memoryTitle}
            className="max-w-full max-h-[75vh] object-contain rounded-sm"
            onClick={(e) => e.stopPropagation()}
          />
          
          <div className="mt-6 text-center text-white" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-xl font-medium">{currentImage.memoryTitle}</h3>
            {currentImage.dateTaken && (
              <p className="text-white/60 text-sm mt-1">
                {new Date(currentImage.dateTaken).toLocaleDateString()}
                {currentImage.location ? ` · ${currentImage.location}` : ''}
              </p>
            )}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
