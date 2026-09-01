import { motion } from 'framer-motion';
import { Smile, Frown } from 'lucide-react';

export default function PartnerStatusWidget({ partnerName, status }) {
  const currentStatus = status || 'happy';
  const isHappy = currentStatus === 'happy';

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
      className="flex flex-col items-center justify-center gap-3 mt-4"
    >
      <div className="flex items-center gap-4">
        <div className="w-8 h-[1px] bg-ethereal-primary/40"></div>
        
        <div className="flex items-center gap-2.5">
          {isHappy ? (
            <Smile size={16} strokeWidth={2} className="text-green-600 dark:text-green-500" />
          ) : (
            <Frown size={16} strokeWidth={2} className="text-red-600 dark:text-red-500" />
          )}
          <span className="text-xs sm:text-sm font-sans font-medium tracking-[0.2em] uppercase text-ethereal-tertiary/80">
            {partnerName} IS FEELING {currentStatus}
          </span>
        </div>
        
        <div className="w-8 h-[1px] bg-ethereal-primary/40"></div>
      </div>
      
      <p className="text-xs font-heading italic text-ethereal-tertiary/50 mt-1">
        Connected in this moment
      </p>
    </motion.div>
  );
}
