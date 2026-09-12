import { useRadio } from '../context/RadioContext';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import RadyoPlayer from './RadyoPlayer';

export default function GlobalRadioWidget() {
  const { currentTrack } = useRadio();
  const { user } = useAuth();
  const location = useLocation();

  // Only show for authenticated users, and not on the radyo page itself
  if (!user || location.pathname === '/radyo') {
    return null;
  }

  return (
    <div className="hidden md:block fixed bottom-6 right-6 z-50 group origin-bottom-right transition-transform duration-300 scale-[0.35] hover:scale-[0.95] opacity-80 hover:opacity-100 drop-shadow-2xl">
      <div className="w-[450px]">
        <RadyoPlayer />
      </div>
    </div>
  );
}
