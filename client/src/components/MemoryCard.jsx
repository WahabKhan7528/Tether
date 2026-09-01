import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Sparkles, MapPin } from 'lucide-react';

function formatDate(date) {
  if (!date) return null;
  return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function MemoryCard({ memory, featured = false, className = "", onClick }) {
  const primaryImage = memory.images?.sort((a, b) => a.order - b.order)[0];
  
  // Dynamic minimum height based on featured status
  const heightClass = featured ? 'min-h-[400px] sm:min-h-[500px]' : 'min-h-[300px] sm:min-h-[350px]';

  return (
    <div onClick={onClick} className={`block w-full h-full ${className}`}>
      <motion.div 
        whileHover={{ y: -6, scale: 0.98 }}
        transition={{ type: "spring", stiffness: 350, damping: 25 }}
        className="group relative overflow-hidden rounded-[2rem] cursor-pointer w-full h-full bg-ethereal-surface-dim/20 shadow-ambient border border-white/10 hover:border-white/30 hover:shadow-2xl transition-all duration-500"
      >
        {/* Inner Border for depth */}
        <div className="absolute inset-0 border-[1.5px] border-white/20 rounded-[2rem] pointer-events-none z-20 mix-blend-overlay"></div>
        
        {/* Image Background */}
        <div className={`w-full h-full ${heightClass} flex items-center justify-center bg-[#111]`}>
          {primaryImage ? (
            <img
              src={primaryImage.url}
              alt={memory.title}
              className="absolute inset-0 w-full h-full object-cover opacity-90 transition-all duration-700 ease-out group-hover:scale-110 group-hover:opacity-100"
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-ethereal-surface-dim/30 to-ethereal-surface-dim/10">
              <Sparkles size={40} strokeWidth={1} className="text-ethereal-primary/40 mb-2" />
            </div>
          )}
        </div>

        {/* Overlay Text */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/40 to-transparent flex flex-col justify-end p-6 sm:p-8 z-10 transition-all duration-500 group-hover:from-black/100">
          
          {/* Subtle blurred backdrop behind text */}
          <div className="absolute inset-x-0 bottom-0 h-2/3 backdrop-blur-[2px] -z-10 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

          <div className="transform transition-transform duration-500 translate-y-2 group-hover:translate-y-0">
            {memory.categoryId && (
              <span className="inline-block px-3.5 py-1.5 bg-white/10 backdrop-blur-md text-white/95 text-[10px] uppercase tracking-[0.25em] font-semibold rounded-full mb-4 border border-white/20 shadow-sm">
                {memory.categoryId.name}
              </span>
            )}
            
            <h3 className={`font-heading text-white leading-tight tracking-wide drop-shadow-xl ${featured ? 'text-4xl sm:text-5xl mb-3' : 'text-2xl sm:text-3xl line-clamp-2 mb-2'}`}>
              {memory.title}
            </h3>
            
            <div className={`flex items-center gap-4 text-white/80 ${featured ? 'text-sm mt-3' : 'text-xs truncate mt-2'}`}>
              {formatDate(memory.dateTaken) && (
                <span className="font-sans font-medium tracking-wider uppercase text-[10px] sm:text-xs opacity-90">
                  {formatDate(memory.dateTaken)}
                </span>
              )}
              {memory.location && (
                <span className="flex items-center gap-1.5 font-sans font-medium tracking-wider uppercase text-[10px] sm:text-xs opacity-90">
                  <MapPin size={12} strokeWidth={2} className="text-white/80" />
                  {memory.location}
                </span>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
