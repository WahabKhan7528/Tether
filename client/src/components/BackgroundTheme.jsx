import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import FallingLeaves from './FallingLeaves';
import treeDark from '../assets/tree_dark.png';
import treeLight from '../assets/tree_light.png';
import treeCherry from '../assets/tree_cherry.png';
import treeLavender from '../assets/tree_lavender.png';
import treeSadLight from '../assets/tree_sad_light_v2.png';

// Radyo background images
import radyoHappyLight from '../assets/radyo_bg_happy_light.jpg';
import radyoHappyDark from '../assets/radyo_bg_happy_dark.jpg';
import radyoSadLight from '../assets/radyo_bg_sad_light.jpg';
import radyoSadDark from '../assets/radyo_bg_sad_dark.jpg';

export default function BackgroundTheme() {
  const { user } = useAuth();
  const { theme } = useTheme();
  const location = useLocation();

  const isAuthPage = ['/login', '/signup', '/onboarding'].includes(location.pathname);

  // We default to 'sad' for the traditional bronze aesthetic unless explicitly 'happy'
  // On auth pages, we always force 'sad' mood
  const mood = isAuthPage ? 'sad' : (user?.currentStatus === 'happy' ? 'happy' : 'sad');

  // Apply the mood to the root element for CSS variables
  useEffect(() => {
    document.documentElement.setAttribute('data-mood', mood);
  }, [mood]);

  // On auth pages, we always force dark theme
  const isDark = isAuthPage ? true : theme === 'dark';
  const isHappy = mood === 'happy';

  // Determine tree image, translation classes, and opacity
  let treeSrc;
  let translateXClass = '';
  let translateYClass = '';
  let opacityClass = '';
  let heightClass = 'h-[100vh] sm:h-[120vh] md:h-[135vh]';
  
  if (isHappy) {
    if (isDark) {
      treeSrc = treeLavender;
      translateXClass = 'translate-x-[49%]'; // Adjust translation X for Happy Dark Mode here
      translateYClass = 'translate-y-[15%]'; // Adjust translation Y for Happy Dark Mode here
      opacityClass = 'opacity-30'; // Adjust opacity for Happy Dark Mode here
    } else {
      treeSrc = treeCherry;
      translateXClass = 'translate-x-[50%]'; // Adjust translation X for Happy Light Mode here
      translateYClass = 'translate-y-[20%]'; // Adjust translation Y for Happy Light Mode here
      opacityClass = 'opacity-50'; // Increased opacity for Cherry Blossom (Happy Light Mode)
    }
  } else {
    if (isDark) {
      treeSrc = treeDark;
      translateXClass = 'translate-x-[50%]'; // Adjust translation X for Sad Dark Mode here
      translateYClass = 'translate-y-[15%]'; // Adjust translation Y for Sad Dark Mode here
      opacityClass = 'opacity-30'; // Adjust opacity for Sad Dark Mode here
    } else {
      treeSrc = treeSadLight;
      translateXClass = 'translate-x-[50%] sm:translate-x-[40%]'; // Adjust translation X for smaller tree
      translateYClass = 'translate-y-[11%]'; // Adjust translation Y for smaller tree
      opacityClass = 'opacity-60'; // Adjust opacity for Sad Light Mode here
      heightClass = 'h-[75vh] sm:h-[90vh] md:h-[105vh]'; // Smaller height so it isn't overwhelming
    }
  }

  // Determine falling leaves type and color styling
  let leavesType = 'leaf';
  let leavesColorClass = '';
  
  if (isHappy) {
    if (isDark) {
      // Lavender
      leavesType = 'lavender';
      leavesColorClass = 'text-purple-400';
    } else {
      // Cherry Blossom
      leavesType = 'cherry-blossom';
      leavesColorClass = 'text-pink-300';
    }
  } else {
    // Sad Mode
    leavesType = 'leaf';
    if (isDark) {
      leavesColorClass = 'text-ethereal-primary/60';
    } else {
      // Muted greyish-brown to match the v2 tree's desaturated leaves
      leavesColorClass = 'text-[#9e958d]/50'; 
    }
  }

  const isRadyoPage = location.pathname === '/radyo';

  if (isRadyoPage) {
    let radyoBgSrc;
    if (isHappy) {
      radyoBgSrc = isDark ? radyoHappyDark : radyoHappyLight;
    } else {
      radyoBgSrc = isDark ? radyoSadDark : radyoSadLight;
    }

    return (
      <>
        <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
          <img
            key={radyoBgSrc}
            src={radyoBgSrc}
            alt="Floral Background"
            className="absolute inset-0 w-full h-full object-cover opacity-80"
          />
        </div>
      </>
    );
  }

  return (
    <>
      <FallingLeaves count={35} type={leavesType} colorClass={leavesColorClass} />
      
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <img
          key={treeSrc}
          src={treeSrc}
          alt=""
          className={`absolute bottom-0 right-0 w-auto max-w-none ${heightClass} ${translateYClass} ${opacityClass} ${translateXClass}`}
        />
      </div>
    </>
  );
}
