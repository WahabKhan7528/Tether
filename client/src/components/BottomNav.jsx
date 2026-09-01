import { NavLink } from 'react-router-dom';
import { Home, Camera, PlayCircle, Library, Mail, UserCircle, Radio } from 'lucide-react';
import { motion } from 'framer-motion';
import ThemeToggle from './ThemeToggle';

const navLinks = [
  { to: '/dashboard', label: 'Home', icon: Home },
  { to: '/memories', label: 'Memories', icon: Camera },
  { to: '/gallery', label: 'Gallery', icon: Library },
  { to: '/letters', label: 'Letters', icon: Mail },
  { to: '/reels', label: 'Reels', icon: PlayCircle },
  { to: '/radyo', label: 'Radyo', icon: Radio },
  { to: '/profile', label: 'Profile', icon: UserCircle },
];

export default function BottomNav() {
  return (
    <>
      <div className="md:hidden fixed top-6 right-6 z-50">
        <ThemeToggle />
      </div>
      <div className="md:hidden fixed bottom-6 left-6 right-6 mx-auto max-w-[400px] bg-ethereal-surface-dim/90 backdrop-blur-xl border border-ethereal-outline z-50 rounded-full shadow-2xl">
        <nav className="flex justify-around items-center h-16 px-2">
        {navLinks.map((link) => {
          const Icon = link.icon;
          return (
            <NavLink
              key={link.to}
              to={link.to}
              className="relative flex items-center justify-center w-full h-full"
            >
              {({ isActive }) => (
                <div className="relative flex flex-col items-center justify-center w-full h-full">
                  <motion.div
                    animate={isActive ? { y: -4, scale: 1.1 } : { y: 0, scale: 1 }}
                    transition={{ type: "spring", stiffness: 300, damping: 20 }}
                    className={`relative z-10 flex items-center justify-center ${
                      isActive ? 'text-ethereal-primary drop-shadow-[0_0_8px_rgba(255,255,255,0.1)]' : 'text-ethereal-tertiary/50 hover:text-ethereal-tertiary'
                    }`}
                  >
                    <Icon size={24} strokeWidth={isActive ? 2.5 : 2} />
                  </motion.div>
                  
                  {isActive && (
                    <motion.div
                      layoutId="bottom-nav-indicator"
                      className="absolute bottom-1.5 w-1.5 h-1.5 rounded-full bg-ethereal-primary"
                      initial={false}
                      transition={{ type: "spring", stiffness: 400, damping: 30 }}
                    />
                  )}
                </div>
              )}
            </NavLink>
          );
        })}
      </nav>
      </div>
    </>
  );
}
