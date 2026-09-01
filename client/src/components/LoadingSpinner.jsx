import { Sparkles, Leaf, Flower } from 'lucide-react';
import { motion } from 'framer-motion';


export default function LoadingSpinner({ size = 'md', className = '' }) {
  const sizeClass = { sm: 'w-6 h-6', md: 'w-10 h-10', lg: 'w-16 h-16' }[size];
  const iconSize = { sm: 10, md: 14, lg: 20 }[size];
  
  return (
    <div className={`relative flex items-center justify-center ${sizeClass} ${className}`}>
      {/* Trajectory Path */}
      <div className="absolute inset-0 rounded-full border border-ethereal-primary/20 border-dashed animate-[spin_10s_linear_infinite_reverse]"></div>
      <div className="absolute inset-1 rounded-full border border-ethereal-primary/5"></div>
      
      {/* Orbiting Container */}
      <div 
        className="absolute inset-0 animate-[spin_2s_linear_infinite]"
        role="status"
        aria-label="Loading"
      >
        {/* Leaf 1 */}
        <div className="absolute inset-0 flex items-start justify-center">
          <div className="transform -translate-y-1/2 text-ethereal-primary drop-shadow-sm filter">
            <Leaf size={iconSize} strokeWidth={1.5} className="rotate-45" />
          </div>
        </div>
        
        {/* Leaf 2 */}
        <div className="absolute inset-0 flex items-start justify-center rotate-[120deg]">
          <div className="transform -translate-y-1/2 text-ethereal-primary/80 drop-shadow-sm filter scale-90">
            <Leaf size={iconSize} strokeWidth={1.5} className="rotate-45" />
          </div>
        </div>

        {/* Leaf 3 */}
        <div className="absolute inset-0 flex items-start justify-center rotate-[240deg]">
          <div className="transform -translate-y-1/2 text-ethereal-primary/60 drop-shadow-sm filter scale-75">
            <Leaf size={iconSize} strokeWidth={1.5} className="rotate-45" />
          </div>
        </div>
      </div>
    </div>
  );
}

export function FullPageLoader() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-ethereal-surface">
      <div className="text-ethereal-primary mb-4">
        <NatureDotsLoader size="lg" />
      </div>
      <p className="text-ethereal-tertiary/60 font-heading italic text-xs tracking-[0.2em] uppercase animate-pulse">
        Closer, Despite The Distance
      </p>
    </div>
  );
}

export function ThreeDotsLoader({ size = 'sm' }) {
  const sizeClass = { sm: 'w-1.5 h-1.5', md: 'w-2 h-2', lg: 'w-3 h-3' }[size];
  return (
    <div className="flex space-x-1.5 justify-center items-center h-full">
      <div className={`${sizeClass} rounded-full bg-current animate-bounce`} style={{ animationDelay: '0ms' }}></div>
      <div className={`${sizeClass} rounded-full bg-current animate-bounce`} style={{ animationDelay: '150ms' }}></div>
      <div className={`${sizeClass} rounded-full bg-current animate-bounce`} style={{ animationDelay: '300ms' }}></div>
    </div>
  );
}

export function NatureDotsLoader({ size = 'sm' }) {
  const iconSize = { sm: 16, md: 24, lg: 32 }[size];
  
  const transition = {
    duration: 1.2,
    repeat: Infinity,
    ease: "easeInOut"
  };

  return (
    <div className="flex space-x-3 justify-center items-center h-full py-2">
      <motion.div animate={{ y: [0, -8, 0] }} transition={{ ...transition, delay: 0 }}>
        <Leaf size={iconSize} strokeWidth={1.5} />
      </motion.div>
      <motion.div animate={{ y: [0, -8, 0] }} transition={{ ...transition, delay: 0.2 }}>
        <Flower size={iconSize} strokeWidth={1.5} />
      </motion.div>
      <motion.div animate={{ y: [0, -8, 0] }} transition={{ ...transition, delay: 0.4 }}>
        <Leaf size={iconSize} strokeWidth={1.5} className="scale-x-[-1]" />
      </motion.div>
    </div>
  );
}
