import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import BottomNav from './BottomNav';
import Sidebar from './Sidebar';

/**
 * Requires: authenticated + onboarding complete + paired.
 * The sidebar and bottom nav are rendered here so all paired pages get them automatically.
 */
export default function PairedRoute({ children }) {
  const { isAuthenticated, isPaired, loading, onboardingComplete } = useAuth();
  if (loading) return null;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (!onboardingComplete) return <Navigate to="/onboarding" replace />;
  // We now allow unpaired users to enter the Dashboard to see their invite widget.
  return (
    <>
      <Sidebar />
      {children}
      <BottomNav />
    </>
  );
}
