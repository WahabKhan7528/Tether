import { useRadio } from '../context/RadioContext';
import { useLocation } from 'react-router-dom';
import RadyoPlayer from './RadyoPlayer';

export default function GlobalRadioWidget() {
  const { currentTrack } = useRadio();
  const location = useLocation();

  if (location.pathname === '/radyo' || location.pathname === '/login' || location.pathname === '/signup') {
    return null;
  }

  return (
    <div className="fixed bottom-24 md:bottom-6 right-4 md:right-6 z-50 group origin-bottom-right transition-transform duration-300 scale-[0.35] hover:scale-100 md:hover:scale-[0.95] opacity-80 hover:opacity-100 drop-shadow-2xl">
      <div className="w-[85vw] sm:w-[400px] md:w-[450px]">
        <RadyoPlayer />
      </div>
    </div>
  );
}
