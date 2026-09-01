import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';

export default function CustomColorPicker({ value, onChange, palette }) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative w-full" ref={containerRef}>
      <div 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full bg-ethereal-surface-dim/20 hover:bg-ethereal-surface-dim border border-ethereal-outline rounded-2xl px-5 py-4 flex items-center justify-between cursor-pointer transition-all focus:outline-none focus:ring-1 focus:ring-ethereal-primary"
      >
        <div className="flex items-center gap-3">
           <div className="w-5 h-5 rounded-full border border-ethereal-outline" style={{ backgroundColor: value || 'transparent' }} />
           <span className={value ? "text-ethereal-tertiary" : "text-ethereal-tertiary/40"}>
             {value || 'Select a colour'}
           </span>
        </div>
        <ChevronDown size={18} className={`text-ethereal-tertiary/40 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="absolute z-50 bottom-full left-0 mb-2 p-5 bg-ethereal-surface-dim/95 backdrop-blur-xl border border-ethereal-outline rounded-[1.5rem] shadow-2xl w-72"
          >
            <div className="flex flex-wrap gap-3">
              {palette.map((colour) => (
                <button
                  key={colour}
                  type="button"
                  onClick={() => { onChange(colour); setIsOpen(false); }}
                  className={`w-9 h-9 rounded-full transition-all duration-200 ${
                    value === colour
                      ? 'ring-2 ring-offset-2 ring-ethereal-primary scale-110'
                      : 'hover:scale-110 border border-ethereal-outline/50'
                  }`}
                  style={{ backgroundColor: colour }}
                  title={colour}
                />
              ))}
            </div>
            <div className="mt-4 pt-4 border-t border-ethereal-outline flex items-center gap-3">
              <div className="relative w-9 h-9 rounded-full overflow-hidden border border-ethereal-outline cursor-pointer flex-shrink-0 transition-transform hover:scale-110">
                <input
                  type="color"
                  value={value || '#ffffff'}
                  onChange={(e) => onChange(e.target.value)}
                  className="absolute inset-[-50%] w-[200%] h-[200%] cursor-pointer bg-transparent border-none p-0 outline-none"
                  title="Custom colour"
                />
              </div>
              <span className="text-sm text-ethereal-tertiary/60 font-sans">Custom hex</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
