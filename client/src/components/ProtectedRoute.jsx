import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * Requires the user to be authenticated (valid session cookie).
 * Also gates on onboarding: if logged in but onboarding incomplete,
 * redirects to /onboarding UNLESS we're already on that route.
 */
export default function ProtectedRoute({ children, skipOnboardingCheck = false }) {
  const { isAuthenticated, loading, onboardingComplete } = useAuth();
  if (loading) return null;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (!skipOnboardingCheck && !onboardingComplete) return <Navigate to="/onboarding" replace />;
  return children;
}
