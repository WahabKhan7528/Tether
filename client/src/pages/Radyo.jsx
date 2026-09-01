import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import RadyoPlayer from '../components/RadyoPlayer';
import { Music, X, Menu, Trash2 } from 'lucide-react';
import { useRadio } from '../context/RadioContext';

export default function Radyo() {
  const { tracks, currentTrack, handleTrackSelect, removeTrack } = useRadio();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  return (
    <div className="min-h-screen pb-6 px-4 md:px-8 max-w-5xl mx-auto flex flex-col items-center justify-end relative z-10">
      
      {/* Drawer Toggle Button */}
      <button 
        onClick={() => setIsDrawerOpen(true)}
        className="fixed right-6 top-24 z-40 bg-ethereal-surface-dim/90 backdrop-blur-md border border-ethereal-outline rounded-full p-3 shadow-ambient text-ethereal-tertiary hover:text-ethereal-primary transition-colors"
      >
        <Music size={24} />
      </button>

      {/* Right Drawer */}
      <AnimatePresence>
        {isDrawerOpen && (
          <>
            {/* Backdrop */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsDrawerOpen(false)}
              className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm"
            />
            
            {/* Drawer Panel */}
            <motion.div
              initial={{ x: '100%', opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: '100%', opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed right-6 top-6 bottom-6 z-50 w-80 bg-ethereal-surface-dim/95 backdrop-blur-2xl border border-ethereal-outline/50 shadow-2xl flex flex-col p-6 rounded-[2.5rem]"
            >
              <div className="flex items-center justify-between mb-8 px-2">
                <span className="text-label text-ethereal-tertiary">Library</span>
                <button 
                  onClick={() => setIsDrawerOpen(false)}
                  className="text-ethereal-tertiary hover:text-ethereal-error transition-colors p-2 -mr-2 rounded-full hover:bg-ethereal-surface"
                >
                  <X size={20} />
                </button>
              </div>
              
              <div className="flex-1 overflow-y-auto scrollbar-hide flex flex-col gap-2">
                {tracks.length === 0 && (
                  <div className="text-center py-8 text-ethereal-tertiary/50">
                    <Music size={32} className="mx-auto mb-2 opacity-50" />
                    <span className="text-sm">No tapes loaded</span>
                  </div>
                )}
                {tracks.map(track => (
                  <div key={track._id} className="relative group w-full flex-shrink-0">
                    <button
                      onClick={() => handleTrackSelect(track)}
                      className={`text-sm w-full text-left truncate px-4 py-3 pr-10 rounded-xl transition-all duration-200 ${currentTrack?._id === track._id ? 'bg-ethereal-primary text-ethereal-surface shadow-md scale-[1.02]' : 'text-ethereal-tertiary hover:bg-ethereal-surface/50 border border-transparent hover:border-ethereal-outline/30'}`}
                      title={track.name}
                    >
                      <div className="truncate font-medium">{track.name}</div>
                      <div className={`text-[10px] truncate mt-0.5 ${currentTrack?._id === track._id ? 'text-ethereal-surface/80' : 'text-ethereal-tertiary/60'}`}>
                        Uploaded by {track.uploadedBy?.displayName || 'Unknown'}
                      </div>
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); removeTrack(track._id); }}
                      className={`absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity ${currentTrack?._id === track._id ? 'text-ethereal-surface hover:bg-black/20' : 'text-ethereal-tertiary hover:bg-ethereal-error/20 hover:text-ethereal-error'}`}
                      title="Delete Track"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.2 }}
        className="w-full"
      >
        <RadyoPlayer />
      </motion.div>
    </div>
  );
}
