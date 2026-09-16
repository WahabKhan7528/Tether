import { Outlet } from 'react-router-dom';
import BackgroundTheme from '../BackgroundTheme';
import GlobalRadioWidget from '../GlobalRadioWidget';

export default function MainLayout() {
  return (
    <>
      <BackgroundTheme />
      <Outlet />
      <GlobalRadioWidget />
    </>
  );
}
