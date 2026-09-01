import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react';

export default function CustomDatePicker({ value, onChange, placement = 'bottom' }) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  // Parse current value or use today. Add time to prevent timezone shift issues.
  const initialDate = value ? new Date(value + 'T12:00:00Z') : new Date();
  const [currentMonth, setCurrentMonth] = useState(initialDate);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const daysInMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1).getDay();

  const handlePrevMonth = (e) => {
    e.preventDefault();
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  const handleNextMonth = (e) => {
    e.preventDefault();
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  const handleSelectDate = (day) => {
    // Format YYYY-MM-DD
    const y = currentMonth.getFullYear();
    const m = String(currentMonth.getMonth() + 1).padStart(2, '0');
    const d = String(day).padStart(2, '0');
    onChange(`${y}-${m}-${d}`);
    setIsOpen(false);
  };

  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const dayNames = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

  // display value format (e.g. Oct 12, 2023)
  const displayValue = value ? new Date(value + 'T12:00:00Z').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '';

  return (
    <div className="relative w-full" ref={containerRef}>
      <div
        onClick={() => setIsOpen(!isOpen)}
        className="w-full bg-ethereal-surface border border-ethereal-outline rounded-2xl px-5 py-4 flex items-center justify-between cursor-pointer hover:border-ethereal-primary/50 transition-all focus:outline-none focus:ring-1 focus:ring-ethereal-primary"
      >
        <span className={value ? "text-ethereal-tertiary" : "text-ethereal-tertiary/30"}>
          {displayValue || 'Select a date'}
        </span>
        <CalendarIcon size={18} className="text-ethereal-tertiary/30" />
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: placement === 'top' ? 10 : placement === 'bottom' ? -10 : 0, x: placement === 'right' ? -10 : 0, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, x: 0, scale: 1 }}
            exit={{ opacity: 0, y: placement === 'top' ? 10 : placement === 'bottom' ? -10 : 0, x: placement === 'right' ? -10 : 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className={`absolute z-50 p-5 bg-ethereal-surface-dim/95 backdrop-blur-xl border border-ethereal-outline rounded-[1.5rem] shadow-2xl w-72 ${
              placement === 'top' ? 'bottom-full left-0 mb-2 origin-bottom' : 
              placement === 'right' ? 'top-0 left-full ml-4 origin-left' :
              'top-full left-0 mt-2 origin-top'
            }`}
          >
            <div className="flex items-center justify-between mb-4">
              <button onClick={handlePrevMonth} type="button" className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-ethereal-surface text-ethereal-tertiary/70 transition-colors">
                <ChevronLeft size={18} />
              </button>
              <div className="flex items-center gap-1 font-heading font-medium text-lg text-ethereal-tertiary">
                <select
                  value={currentMonth.getMonth()}
                  onChange={(e) => setCurrentMonth(new Date(currentMonth.getFullYear(), parseInt(e.target.value), 1))}
                  className="bg-transparent focus:outline-none cursor-pointer hover:text-ethereal-primary transition-colors appearance-none text-right"
                >
                  {monthNames.map((m, i) => (
                    <option key={m} value={i} className="text-black dark:text-white bg-white dark:bg-black">{m}</option>
                  ))}
                </select>
                <select
                  value={currentMonth.getFullYear()}
                  onChange={(e) => setCurrentMonth(new Date(parseInt(e.target.value), currentMonth.getMonth(), 1))}
                  className="bg-transparent focus:outline-none cursor-pointer hover:text-ethereal-primary transition-colors appearance-none text-left"
                >
                  {Array.from({ length: 120 }, (_, i) => new Date().getFullYear() - 100 + i).reverse().map(y => (
                    <option key={y} value={y} className="text-black dark:text-white bg-white dark:bg-black">{y}</option>
                  ))}
                </select>
              </div>
              <button onClick={handleNextMonth} type="button" className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-ethereal-surface text-ethereal-tertiary/70 transition-colors">
                <ChevronRight size={18} />
              </button>
            </div>

            <div className="grid grid-cols-7 gap-1 mb-2">
              {dayNames.map(day => (
                <div key={day} className="text-center text-xs font-semibold text-ethereal-tertiary/30 uppercase">
                  {day}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-1">
              {Array.from({ length: firstDayOfMonth }).map((_, i) => (
                <div key={`empty-${i}`} />
              ))}
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const day = i + 1;
                // Format YYYY-MM-DD
                const y = currentMonth.getFullYear();
                const m = String(currentMonth.getMonth() + 1).padStart(2, '0');
                const d = String(day).padStart(2, '0');
                const dateString = `${y}-${m}-${d}`;

                const isSelected = value === dateString;

                // Need to use correct local date for "today"
                const today = new Date();
                const todayString = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
                const isToday = todayString === dateString;

                return (
                  <button
                    key={day}
                    type="button"
                    onClick={(e) => { e.preventDefault(); handleSelectDate(day); }}
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm transition-colors mx-auto ${isSelected
                        ? 'bg-ethereal-primary text-white font-bold shadow-md'
                        : isToday
                          ? 'border border-ethereal-primary/50 text-ethereal-primary font-bold hover:bg-ethereal-primary/10'
                          : 'text-ethereal-tertiary/80 hover:bg-ethereal-surface hover:text-ethereal-tertiary'
                      }`}
                  >
                    {day}
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
