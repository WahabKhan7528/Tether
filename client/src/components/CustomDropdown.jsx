import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Check } from 'lucide-react';

export default function CustomDropdown({ value, onChange, options, placeholder, className = '' }) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedOption = options.find(o => o.value === value);

  return (
    <div className={`relative ${className || 'w-full'}`} ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between bg-ethereal-surface-dim/20 hover:bg-ethereal-surface-dim border border-ethereal-outline rounded-2xl px-5 py-4 text-ethereal-tertiary transition-all focus:outline-none focus:ring-1 focus:ring-ethereal-primary"
      >
        <span className={!selectedOption || !selectedOption.value ? 'text-ethereal-tertiary/40' : 'text-ethereal-tertiary'}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown size={18} className={`text-ethereal-tertiary/40 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.98 }}
            transition={{ duration: 0.2 }}
            className="absolute z-50 w-full mt-2 bg-ethereal-surface-dim/95 border border-ethereal-outline rounded-2xl shadow-2xl overflow-hidden py-2 backdrop-blur-xl max-h-60 overflow-y-auto hide-scrollbar"
          >
            {options.map((opt) => (
              <button
                type="button"
                key={opt.value}
                onClick={() => {
                  onChange(opt.value);
                  setIsOpen(false);
                }}
                className={`w-full flex items-center justify-between px-5 py-3 text-left hover:bg-ethereal-surface transition-colors ${
                  value === opt.value ? 'text-ethereal-primary font-semibold bg-ethereal-primary/5' : 'text-ethereal-tertiary'
                }`}
              >
                {opt.label}
                {value === opt.value && <Check size={16} className="text-ethereal-primary" />}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
