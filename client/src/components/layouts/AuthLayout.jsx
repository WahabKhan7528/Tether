import { useMemo } from 'react';
import { Outlet } from 'react-router-dom';
import FallingLeaves from '../FallingLeaves';
import treeDark from '../../assets/tree_dark.png';

export default function AuthLayout() {
  const isMobile = useMemo(
    () => typeof window !== 'undefined' && window.matchMedia('(max-width: 767px)').matches,
    []
  );
  const prefersReducedMotion = useMemo(
    () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    []
  );
  
  const shouldRenderDecorations = !isMobile && !prefersReducedMotion;

  return (
    <div className="theme-auth min-h-[100dvh] w-full bg-ethereal-surface text-ethereal-tertiary relative overflow-hidden transition-colors duration-500">
      
      {/* Background Decor */}
      {shouldRenderDecorations && (
        <FallingLeaves count={35} type="leaf" colorClass="text-ethereal-primary/60" />
      )}
      
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <img
          src={treeDark}
          alt=""
          className="absolute bottom-0 right-0 w-auto max-w-none h-[100vh] sm:h-[120vh] md:h-[135vh] translate-y-[15%] opacity-30 translate-x-[50%] will-change-auto"
        />
      </div>

      {/* Content wrapper to allow scrolling inside the fixed full-screen layout */}
      <div className="relative z-10 h-full w-full max-h-[100dvh] overflow-y-auto">
        <Outlet />
      </div>
    </div>
  );
}
