import { useState, useLayoutEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { NatureDotsLoader } from './LoadingSpinner';

export default function PageChangeLoader() {
  const location = useLocation();
  const [isLoading, setIsLoading] = useState(false);

  useLayoutEffect(() => {
    setIsLoading(true);
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 600); // 600ms loader duration

    return () => clearTimeout(timer);
  }, [location.pathname]);

  return (
    <AnimatePresence>
      {isLoading && (
        <motion.div
          key="page-loader"
          initial={{ opacity: 1 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-ethereal-surface"
        >
          <div className="text-ethereal-primary mb-4">
            <NatureDotsLoader size="lg" />
          </div>
          <p className="text-ethereal-tertiary/60 font-heading italic text-xs tracking-[0.2em] uppercase animate-pulse">
            Closer, Despite The Distance
          </p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
