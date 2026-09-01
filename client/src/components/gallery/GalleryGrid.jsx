import { motion } from 'framer-motion';
import { Trash2 } from 'lucide-react';

export default function GalleryGrid({ images, onImageClick, selectable = false, selectedIds = [], onToggleSelect = null, onDeleteGalleryPhoto = null }) {
  const getSpanClasses = (index) => {
    const layoutPattern = index % 10;
    if (layoutPattern === 0) return "col-span-2 row-span-2 sm:col-span-2 sm:row-span-2 md:col-span-2 md:row-span-2";
    if (layoutPattern === 3 || layoutPattern === 6) return "col-span-2 row-span-1 sm:col-span-1 sm:row-span-2 md:col-span-2 md:row-span-1";
    return "col-span-1 row-span-1 sm:col-span-1 sm:row-span-1";
  };

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 sm:gap-4 auto-rows-[150px] sm:auto-rows-[200px]">
      {images.map((img, i) => {
        const isSelected = selectedIds.includes(img._id);
        const isGallerySource = img.source === 'gallery';
        const displayTitle = img.title || img.memoryTitle || '';

        return (
          <motion.div
            key={img._id}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.03 }}
            className={`relative rounded-xl sm:rounded-2xl overflow-hidden group cursor-pointer ${getSpanClasses(i)} ${isSelected ? 'ring-4 ring-ethereal-primary' : ''}`}
            onClick={() => selectable ? onToggleSelect(img._id) : onImageClick(i)}
          >
            <img
              src={img.url}
              alt={displayTitle || 'Gallery photo'}
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              loading="lazy"
            />

            {!selectable && (
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end justify-between">
                <div className="p-4 flex-1 min-w-0">
                  {displayTitle && (
                    <p className="text-white font-medium truncate drop-shadow-md text-sm">
                      {displayTitle}
                    </p>
                  )}
                  {img.location && (
                    <p className="text-white/70 text-xs drop-shadow-md truncate">{img.location}</p>
                  )}
                  {img.dateTaken && (
                    <p className="text-white/60 text-xs drop-shadow-md">
                      {new Date(img.dateTaken).toLocaleDateString()}
                    </p>
                  )}
                </div>

                {/* Delete button — only for gallery-source photos */}
                {isGallerySource && onDeleteGalleryPhoto && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteGalleryPhoto(img._id);
                    }}
                    className="m-3 w-9 h-9 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center text-white/80 hover:bg-red-500 hover:text-white transition-all flex-shrink-0 border border-white/20"
                    title="Delete photo"
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            )}

            {selectable && (
              <div className={`absolute top-3 right-3 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${isSelected ? 'bg-ethereal-primary border-ethereal-primary' : 'bg-black/20 border-white/80 backdrop-blur-sm'}`}>
                {isSelected && (
                  <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </div>
            )}
          </motion.div>
        );
      })}
    </div>
  );
}
