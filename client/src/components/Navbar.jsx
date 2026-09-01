import { NavLink } from 'react-router-dom';
import { Home, Camera, PlayCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import ThemeToggle from './ThemeToggle';

const navLinks = [
  { to: '/dashboard', label: 'Home', icon: Home },
  { to: '/memories', label: 'Memories', icon: Camera },
  { to: '/reels', label: 'Reels', icon: PlayCircle },
];

export default function Navbar() {
  return (
    <>
      <nav className="fixed top-6 left-1/2 -translate-x-1/2 z-50 bg-ethereal-surface-dim/80 backdrop-blur-2xl border border-ethereal-outline/50 rounded-full hidden md:block shadow-ambient w-[95%] max-w-5xl transition-all duration-500">
        <div className="px-4 lg:px-8">
          <div className="flex items-center justify-between h-16 gap-4">
            {/* Logo */}
            <NavLink to="/dashboard" className="flex items-center gap-3 group">
              <motion.div
                whileHover={{ rotate: 45, scale: 1.1 }}
                transition={{ type: "spring", stiffness: 300, damping: 15 }}
                className="w-10 h-10 bg-ethereal-primary text-white rounded-xl flex items-center justify-center shadow-lg"
              >
                <div className="w-4 h-4 rounded-full border-2 border-ethereal-surface border-t-transparent animate-spin-slow"></div>
              </motion.div>
              <span className="font-heading font-bold text-2xl text-ethereal-primary tracking-tight">Tether</span>
            </NavLink>

            {/* Desktop nav */}
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                {navLinks.map((link) => {
                  const Icon = link.icon;
                  return (
                    <NavLink
                      key={link.to}
                      to={link.to}
                      className={({ isActive }) =>
                        `relative flex items-center gap-2 px-6 py-2.5 rounded-full text-sm font-semibold uppercase tracking-widest transition-all duration-300 ${isActive
                          ? 'text-white'
                          : 'text-ethereal-tertiary/70 hover:text-ethereal-primary hover:bg-ethereal-surface/50'
                        }`
                      }
                    >
                      {({ isActive }) => (
                        <>
                          {isActive && (
                            <motion.div
                              layoutId="nav-pill"
                              className="absolute inset-0 bg-ethereal-primary shadow-lg rounded-full"
                              initial={false}
                              transition={{ type: "spring", stiffness: 400, damping: 30 }}
                            />
                          )}
                          <span className="relative z-10 flex items-center gap-2">
                            <Icon size={16} strokeWidth={isActive ? 2.5 : 2} className={isActive ? 'text-white' : ''} />
                            <span>{link.label}</span>
                          </span>
                        </>
                      )}
                    </NavLink>
                  );
                })}
              </div>
              <div className="w-px h-6 bg-ethereal-outline/30 hidden md:block"></div>
              <ThemeToggle />
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Top Bar */}
      <nav className="md:hidden fixed top-6 left-6 right-6 mx-auto max-w-[400px] z-40 bg-ethereal-surface-dim/90 backdrop-blur-xl border border-ethereal-outline h-16 rounded-full flex items-center justify-between px-5 shadow-2xl transition-colors duration-500">
        <NavLink to="/dashboard" className="flex items-center gap-3">
          <div className="w-8 h-8 bg-ethereal-primary text-white rounded-full flex items-center justify-center shadow-md">
            <div className="w-3.5 h-3.5 rounded-full border-2 border-white border-t-transparent animate-spin-slow"></div>
          </div>
          <span className="font-heading font-bold text-xl text-ethereal-primary tracking-tight">Tether</span>
        </NavLink>
        <ThemeToggle />
      </nav>
    </>
  );
}
