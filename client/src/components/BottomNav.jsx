import { NavLink } from 'react-router-dom';
import { Home, Camera, PlayCircle, Library, Mail, UserCircle, Radio, Volume2, VolumeX } from 'lucide-react';
import ThemeToggle from './ThemeToggle';
import { useRadio } from '../context/RadioContext';
import { useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';

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
  const { isPlaying, togglePlay } = useRadio();
  const location = useLocation();
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);

  useEffect(() => {
    const handleFocus = (e) => {
      if (['INPUT', 'TEXTAREA'].includes(e.target.tagName)) {
        setIsKeyboardOpen(true);
      }
    };
    const handleBlur = () => {
      setIsKeyboardOpen(false);
    };
    window.addEventListener('focusin', handleFocus);
    window.addEventListener('focusout', handleBlur);
    return () => {
      window.removeEventListener('focusin', handleFocus);
      window.removeEventListener('focusout', handleBlur);
    };
  }, []);

  const isFormPage = location.pathname.endsWith('/new') || location.pathname.endsWith('/edit');
  const shouldHideNav = isFormPage || isKeyboardOpen;

  return (
    <>
      <div className="md:hidden fixed top-6 right-6 z-50 flex items-center gap-3">
        <button
          onClick={togglePlay}
          className="w-10 h-10 rounded-full bg-ethereal-surface border border-ethereal-outline flex items-center justify-center text-ethereal-tertiary hover:text-ethereal-primary shadow-[0_4px_0_rgba(0,0,0,0.3)] active:shadow-none active:translate-y-1 transition-all"
          title={isPlaying ? 'Mute' : 'Unmute'}
        >
          {isPlaying ? <Volume2 size={18} /> : <VolumeX size={18} />}
        </button>
        <ThemeToggle />
      </div>
      {!shouldHideNav && (
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
                      <div
                        className={`relative z-10 flex items-center justify-center transition-all duration-200 ${
                          isActive
                            ? 'text-ethereal-primary drop-shadow-[0_0_8px_rgba(255,255,255,0.1)] scale-110 -translate-y-1'
                            : 'text-ethereal-tertiary/50 hover:text-ethereal-tertiary scale-100 translate-y-0'
                        }`}
                      >
                        <Icon size={24} strokeWidth={isActive ? 2.5 : 2} />
                      </div>

                      {isActive && (
                        <span className="absolute bottom-1.5 w-1.5 h-1.5 rounded-full bg-ethereal-primary" />
                      )}
                    </div>
                  )}
                </NavLink>
              );
            })}
          </nav>
        </div>
      )}
    </>
  );
}
