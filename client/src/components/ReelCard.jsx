import { useState } from 'react';
import { updateReel } from '../api/reels';
import { Camera, Music2, Link2, Trash2, Check, FolderHeart, ExternalLink } from 'lucide-react';
import { motion } from 'framer-motion';

const PLATFORM_ICONS = { 
  instagram: <Camera size={18} strokeWidth={1.5} />, 
  tiktok: <Music2 size={18} strokeWidth={1.5} />, 
  other: <Link2 size={18} strokeWidth={1.5} /> 
};

export default function ReelCard({ reel, onUpdate, onDelete, compact = false }) {
  const [toggling, setToggling] = useState(false);

  const handleToggleDone = async (e) => {
    e.preventDefault();
    setToggling(true);
    try {
      const res = await updateReel(reel._id, { isDone: !reel.isDone });
      onUpdate?.(res.data.data);
    } catch (_) {}
    setToggling(false);
  };

  return (
    <div 
      className={`relative flex flex-col overflow-hidden rounded-[1.5rem] transition-all duration-300 border group ${compact ? '' : 'h-full'} ${
        reel.isDone 
          ? 'bg-ethereal-surface-dim/30 border-ethereal-outline/50 opacity-70' 
          : 'bg-ethereal-surface border-ethereal-outline hover:shadow-xl hover:border-ethereal-primary/30 hover:-translate-y-1'
      }`}
    >
      {/* Header */}
      <div className={`px-5 ${compact ? 'pt-3 pb-2' : 'pt-5 pb-3'} flex items-center justify-between border-b border-ethereal-outline/40 bg-ethereal-surface-dim/20`}>
        <div className="flex items-center gap-2.5">
          <div className={`text-ethereal-tertiary/70 ${reel.isDone ? 'opacity-50' : ''}`}>
            {PLATFORM_ICONS[reel.platform] || PLATFORM_ICONS.other}
          </div>
          <span className={`text-sm font-medium capitalize ${reel.isDone ? 'text-ethereal-tertiary/50' : 'text-ethereal-tertiary/80'}`}>
            {reel.platform}
          </span>
        </div>
        
        {onDelete && (
          <button
            onClick={() => onDelete(reel._id)}
            className="text-ethereal-tertiary/40 hover:text-ethereal-error transition-colors p-1 opacity-0 group-hover:opacity-100"
          >
            <Trash2 size={16} />
          </button>
        )}
      </div>

      {/* Content */}
      <div className={`${compact ? 'p-4' : 'p-5 flex-1'} flex flex-col bg-ethereal-surface`}>
        <a
          href={reel.url}
          target="_blank"
          rel="noopener noreferrer"
          className={`${compact ? 'text-base mb-1' : 'text-lg mb-3'} font-medium leading-snug transition-colors flex items-start gap-2 ${
            reel.isDone 
              ? 'text-ethereal-tertiary/40 line-through' 
              : 'text-ethereal-tertiary hover:text-ethereal-primary'
          }`}
        >
          <span className="line-clamp-3">{reel.caption || reel.url}</span>
          {!reel.isDone && <ExternalLink size={14} className="text-ethereal-tertiary/40 flex-shrink-0 mt-1" />}
        </a>
        
        {reel.note && (
          <div className={compact ? 'mb-2' : 'mb-4'}>
            <p className={`text-sm font-normal leading-relaxed ${reel.isDone ? 'text-ethereal-tertiary/40' : 'text-ethereal-tertiary/70'}`}>
              {reel.note}
            </p>
          </div>
        )}

        <div className={`mt-auto ${compact ? 'pt-2' : 'pt-4'} flex items-center justify-between gap-4`}>
          <div className="flex items-center">
            {reel.categoryId && (
              <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium ${
                reel.isDone 
                  ? 'bg-ethereal-surface-dim/50 text-ethereal-tertiary/50' 
                  : 'bg-ethereal-surface-dim text-ethereal-tertiary/80'
              }`}>
                <FolderHeart size={12} className={reel.isDone ? 'opacity-50' : 'text-ethereal-tertiary/60'} /> 
                {reel.categoryId.name}
              </div>
            )}
          </div>
          
          <button
            onClick={handleToggleDone}
            disabled={toggling}
            className={`flex items-center justify-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-medium transition-all duration-200 ${
              reel.isDone
                ? 'bg-ethereal-surface-dim/80 text-ethereal-tertiary/60 hover:bg-ethereal-surface-dim hover:text-ethereal-tertiary/80'
                : 'bg-ethereal-primary/10 text-ethereal-primary hover:bg-ethereal-primary hover:text-white border border-ethereal-primary/20 hover:border-transparent'
            }`}
          >
            {toggling ? (
              <span className="opacity-50">...</span>
            ) : reel.isDone ? (
              <>Undo</>
            ) : (
              <><Check size={14} /> Mark Done</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
