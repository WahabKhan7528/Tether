import { Outlet } from 'react-router-dom';
import BackgroundTheme from '../BackgroundTheme';
import GlobalRadioWidget from '../GlobalRadioWidget';
import { useLocationTracker } from '../../hooks/useLocationTracker';

function LocationTracker() {
  useLocationTracker();
  return null;
}

export default function MainLayout() {
  return (
    <>
      <LocationTracker />
      <BackgroundTheme />
      <Outlet />
      <GlobalRadioWidget />
    </>
  );
}
