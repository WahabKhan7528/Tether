import { NavLink } from 'react-router-dom';
import { Home, Camera, Library, Mail, PlayCircle, UserCircle, LogOut, Radio } from 'lucide-react';
import { motion } from 'framer-motion';
import ThemeToggle from './ThemeToggle';

const sidebarLinks = [
  { to: '/dashboard', label: 'Home', icon: Home },
  { to: '/memories', label: 'Memories', icon: Camera },
  { to: '/gallery', label: 'Gallery', icon: Library },
  { to: '/letters', label: 'Letters', icon: Mail },
  { to: '/reels', label: 'Reels', icon: PlayCircle },
  { to: '/radyo', label: 'Radyo', icon: Radio },
  { to: '/profile', label: 'Profile', icon: UserCircle },
];

import { useAuthDispatch } from '../context/AuthContext';

export default function Sidebar() {
  const { logout } = useAuthDispatch();

  return (
    <motion.nav
      initial={{ opacity: 0, x: -20, y: "-50%" }}
      animate={{ opacity: 1, x: 0, y: "-50%" }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="hidden md:flex fixed left-6 top-1/2 z-50 flex-col items-center gap-3 py-5 px-3 bg-ethereal-surface-dim/80 backdrop-blur-2xl border border-ethereal-outline/50 rounded-full shadow-ambient group/sidebar transition-all duration-300"
    >

      {sidebarLinks.map((link) => {
        const Icon = link.icon;
        return (
          <NavLink
            key={link.to}
            to={link.to}
            title={link.label}
            className={({ isActive }) =>
              `relative flex items-center gap-0 group/link overflow-hidden rounded-full px-3 py-3 transition-all duration-300 ${isActive
                ? 'text-white'
                : 'text-ethereal-tertiary/60 hover:text-ethereal-primary hover:bg-ethereal-surface/50'
              }`
            }
          >
            {({ isActive }) => (
              <>
                {isActive && (
                  <motion.div
                    layoutId="sidebar-pill"
                    className="absolute inset-0 bg-ethereal-primary rounded-full shadow-lg"
                    initial={false}
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  />
                )}
                {/* Icon always shown */}
                <span className="relative z-10 flex-shrink-0">
                  <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
                </span>

                {/* Label slides in on sidebar hover */}
                <span
                  className={`relative z-10 text-label whitespace-nowrap overflow-hidden transition-all duration-300 ease-in-out max-w-0 opacity-0 group-hover/sidebar:max-w-[80px] group-hover/sidebar:opacity-100 group-hover/sidebar:ml-2 ${isActive ? '!text-white' : ''}`}
                >
                  {link.label}
                </span>
              </>
            )}
          </NavLink>
        );
      })}

      {/* Divider */}
      <div className="w-8 h-px bg-ethereal-outline/50 my-2 flex-shrink-0" />
      
      {/* Theme Toggle */}
      <div className="flex-shrink-0 scale-90 opacity-70 hover:opacity-100 transition-opacity">
        <ThemeToggle />
      </div>

      {/* Divider */}
      <div className="w-8 h-px bg-ethereal-outline/50 my-2 flex-shrink-0" />
      
      {/* Logout */}
      <button
        onClick={logout}
        title="Logout"
        className="relative flex items-center gap-0 group/link overflow-hidden rounded-full px-3 py-3 transition-all duration-300 text-ethereal-tertiary/60 hover:text-ethereal-error hover:bg-ethereal-error/10"
      >
        <span className="relative z-10 flex-shrink-0">
          <LogOut size={20} strokeWidth={2} />
        </span>
        <span className="relative z-10 text-label whitespace-nowrap overflow-hidden transition-all duration-300 ease-in-out max-w-0 opacity-0 group-hover/sidebar:max-w-[80px] group-hover/sidebar:opacity-100 group-hover/sidebar:ml-2">
          Logout
        </span>
      </button>
    </motion.nav>
  );
}
