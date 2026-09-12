import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import Sidebar from '../components/Sidebar';
import BottomNav from '../components/BottomNav';
import ThemeToggle from '../components/ThemeToggle';
import { 
  Home, 
  ArrowLeft, 
  Compass, 
  Camera, 
  Library, 
  Mail, 
  Radio, 
  ArrowRight,
  Heart
} from 'lucide-react';

export default function NotFound() {
  const navigate = useNavigate();
  const { isAuthenticated, onboardingComplete } = useAuth();
  const showNav = Boolean(isAuthenticated && onboardingComplete);

  const quickLinks = [
    {
      to: showNav ? '/dashboard' : '/login',
      title: 'Home Dashboard',
      description: 'Your couple sanctuary, daily widgets, and partner connection.',
      icon: Home,
    },
    {
      to: showNav ? '/memories' : '/login',
      title: 'Memories',
      description: 'Preserved milestones and curated moments saved together.',
      icon: Camera,
    },
    {
      to: showNav ? '/letters' : '/login',
      title: 'Love Letters',
      description: 'Handwritten thoughts and intimate messages over time.',
      icon: Mail,
    },
    {
      to: showNav ? '/gallery' : '/login',
      title: 'Photo Gallery',
      description: 'A shared visual scrapbook of every moment captured.',
      icon: Library,
    },
  ];

  return (
    <div className="min-h-screen pb-24 md:pb-16 transition-colors duration-500 relative">
      {/* App Navigation for Authenticated Users */}
      {showNav ? (
        <>
          <Sidebar />
          <BottomNav />
        </>
      ) : (
        /* Top Navigation for Guests / Unauthenticated Visitors */
        <header className="fixed top-0 left-0 right-0 z-40 px-6 sm:px-12 py-5 flex items-center justify-between backdrop-blur-md bg-ethereal-surface-dim/40 border-b border-ethereal-outline/30">
          <Link to="/login" className="flex items-center gap-2 group">
            
            <span className="font-heading text-xl font-bold tracking-tight text-ethereal-tertiary">
              Tether<span className="text-ethereal-primary">.</span>
            </span>
          </Link>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Link
              to="/login"
              className="text-sm font-semibold px-4 py-2 rounded-full border border-ethereal-outline text-ethereal-tertiary hover:border-ethereal-primary/40 hover:text-ethereal-primary transition-all duration-300"
            >
              Sign In
            </Link>
          </div>
        </header>
      )}

      {/* Hero Section — Styled to match Memories, Gallery, and Letters pages */}
      <div className="relative pt-32 sm:pt-40 md:pt-48 pb-12 pl-6 pr-6 sm:pl-12 sm:pr-12 md:pl-28 md:pr-16 overflow-hidden">
        {/* Ambient atmospheric glows */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-ethereal-primary/5 rounded-full blur-[100px] -z-10 translate-x-1/3 -translate-y-1/4 pointer-events-none" />
        <div className="absolute top-40 left-0 w-[300px] h-[300px] bg-ethereal-primary/5 rounded-full blur-[80px] -z-10 -translate-x-1/2 pointer-events-none" />

        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-end justify-between gap-8 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-col max-w-2xl"
          >
            <div className="flex items-center gap-2 mb-3">
              <span className="p-1.5 rounded-lg bg-ethereal-primary/10 text-ethereal-primary">
                <Compass size={16} strokeWidth={2.5} />
              </span>
              <span className="text-label text-ethereal-primary font-bold tracking-widest uppercase">
                Error 404 • Page Not Found
              </span>
            </div>

            <h1 className="text-display drop-shadow-sm leading-[0.9] -ml-1 lg:-ml-2">
              Lost in the Tether<span className="text-ethereal-primary/70">.</span>
            </h1>

            <p className="text-ethereal-tertiary/60 font-sans text-xl md:text-2xl font-light tracking-wide max-w-xl mt-6 leading-relaxed">
              The memory or trail you followed seems to have drifted away. Let's guide you back to where love lives.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="flex flex-wrap items-center gap-3"
          >
            <Link
              to={showNav ? '/dashboard' : '/login'}
              className="group relative flex items-center justify-center gap-3 px-8 py-4 bg-ethereal-primary text-ethereal-surface font-bold tracking-wide rounded-full overflow-hidden shadow-[0_8px_30px_rgba(var(--color-primary),0.25)] hover:shadow-[0_12px_40px_rgba(var(--color-primary),0.35)] hover:-translate-y-1 transition-all duration-400"
            >
              <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-400 ease-out rounded-full" />
              <Home size={18} className="relative z-10" />
              <span className="relative z-10 text-sm sm:text-base">
                {showNav ? 'Return to Dashboard' : 'Go to Login'}
              </span>
            </Link>

            <button
              onClick={() => navigate(-1)}
              className="flex items-center gap-2 px-6 py-4 rounded-full border border-ethereal-outline text-ethereal-tertiary hover:border-ethereal-primary/40 hover:text-ethereal-primary hover:-translate-y-1 transition-all duration-300 text-sm font-semibold"
            >
              <ArrowLeft size={16} />
              <span>Go Back</span>
            </button>
          </motion.div>
        </div>
      </div>

      {/* Main Content Area: Quick Pathways */}
      <div className="max-w-7xl mx-auto pl-6 pr-6 sm:pl-12 sm:pr-12 md:pl-28 md:pr-16 relative z-10">
        <div className="mb-6">
          <h2 className="text-h3 text-ethereal-tertiary">
            Looking for something specific?
          </h2>
          <p className="text-body-sm text-ethereal-tertiary/60">
            Jump directly back to any of your shared spaces below:
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {quickLinks.map((item, index) => {
            const Icon = item.icon;
            return (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 * index + 0.3, duration: 0.5 }}
              >
                <Link
                  to={item.to}
                  className="group card-hover p-6 flex flex-col justify-between h-48 relative overflow-hidden"
                >
                  <div className="flex items-center justify-between">
                    <div className="p-3.5 rounded-2xl bg-ethereal-primary/10 text-ethereal-primary group-hover:scale-110 group-hover:bg-ethereal-primary group-hover:text-white transition-all duration-300">
                      <Icon size={22} strokeWidth={1.75} />
                    </div>
                    <ArrowRight
                      size={18}
                      className="text-ethereal-tertiary/40 group-hover:text-ethereal-primary group-hover:translate-x-1 transition-all duration-300"
                    />
                  </div>

                  <div>
                    <h3 className="text-h3 font-medium text-ethereal-tertiary group-hover:text-ethereal-primary transition-colors">
                      {item.title}
                    </h3>
                    <p className="text-body-sm text-ethereal-tertiary/60 mt-1 line-clamp-2">
                      {item.description}
                    </p>
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
