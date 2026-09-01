import React, { useMemo } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { Leaf } from 'lucide-react';

const LavenderIcon = ({ size = 24, className = '', fill = 'currentColor', strokeWidth = 1 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={fill} stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M12 22v-7" fill="none" />
    <path d="M12 15a3 3 0 0 0-3-3 3 3 0 0 1 3-3" />
    <path d="M12 15a3 3 0 0 1 3-3 3 3 0 0 0-3-3" />
    <path d="M12 9a3 3 0 0 0-3-3 3 3 0 0 1 3-3" />
    <path d="M12 9a3 3 0 0 1 3-3 3 3 0 0 0-3-3" />
  </svg>
);

const CherryBlossomIcon = ({ size = 24, className = '', fill = 'currentColor', strokeWidth = 1 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={fill} stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" className={className}>
    {/* A beautifully shaped Sakura petal with a cleft at the top */}
    <path d="M12 22 C 4 15, 6 4, 9 4 C 10.5 4, 11.5 6, 12 7.5 C 12.5 6, 13.5 4, 15 4 C 18 4, 20 15, 12 22 Z" />
  </svg>
);

export default function FallingLeaves({ count = 15, type = 'leaf', colorClass = 'text-ethereal-surface-dim dark:text-ethereal-primary' }) {
  const reduceMotion = useReducedMotion();

  if (reduceMotion) return null;

  // Generate a memoized array of random properties for our leaves
  const leaves = useMemo(() => {
    return Array.from({ length: count }).map((_, i) => ({
      id: i,
      // Random starting X position between 0% and 100% of the container width
      left: `${Math.random() * 100}%`,
      // Random fall duration between 8 and 15 seconds
      duration: Math.random() * 7 + 8,
      // Random delay to stagger the initial drop
      delay: Math.random() * 10,
      // Random scale to simulate different leaf sizes
      scale: Math.random() * 0.6 + 0.4,
      // Random rotation
      rotationStart: Math.random() * 360,
      rotationEnd: Math.random() * 360 + (Math.random() > 0.5 ? 360 : -360),
    }));
  }, [count]);
  
  // Choose the correct icon based on type
  let Icon = Leaf;
  if (type === 'cherry-blossom') Icon = CherryBlossomIcon;
  if (type === 'lavender') Icon = LavenderIcon;

  return (
    <div className="fixed top-0 bottom-0 left-0 w-1/3 z-0 pointer-events-none overflow-hidden">
      {leaves.map((leaf) => (
        <motion.div
          key={leaf.id}
          initial={{
            y: -100,
            x: 0,
            rotate: leaf.rotationStart,
            opacity: 0,
          }}
          animate={{
            y: '110vh',
            x: [0, -40, 30, -20, 50, 0], // Gentle swaying motion
            rotate: leaf.rotationEnd,
            opacity: [0, 1, 1, 0.8, 0], // Fade in at top, fade out at bottom
          }}
          transition={{
            duration: leaf.duration,
            delay: leaf.delay,
            repeat: Infinity,
            ease: "linear",
            x: {
              duration: leaf.duration,
              repeat: Infinity,
              ease: "easeInOut",
            },
          }}
          className={`absolute drop-shadow-md ${colorClass}`}
          style={{
            left: leaf.left,
            transform: `scale(${leaf.scale})`,
          }}
        >
          {/* We use fill to make them solid like the stencil tree */}
          <Icon size={24} fill="currentColor" strokeWidth={1} className="opacity-40 dark:opacity-50" />
        </motion.div>
      ))}
    </div>
  );
}
