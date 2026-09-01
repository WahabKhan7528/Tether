import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect, lazy, Suspense } from 'react';
import LocomotiveScroll from 'locomotive-scroll';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { RadioProvider } from './context/RadioContext';
import { Toaster } from 'react-hot-toast';
import ProtectedRoute from './components/ProtectedRoute';
import PairedRoute from './components/PairedRoute';
import BackgroundTheme from './components/BackgroundTheme';
import GlobalRadioWidget from './components/GlobalRadioWidget';
import LoadingSpinner, { FullPageLoader } from './components/LoadingSpinner';

// ─── Code-Split Pages ─────────────────────────────────────────────────────────
const Login = lazy(() => import('./pages/Login'));
const Signup = lazy(() => import('./pages/Signup'));
const Onboarding = lazy(() => import('./pages/Onboarding'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Memories = lazy(() => import('./pages/Memories'));
const NewMemory = lazy(() => import('./pages/NewMemory'));
const EditMemory = lazy(() => import('./pages/EditMemory'));
const Reels = lazy(() => import('./pages/Reels'));
const NewReel = lazy(() => import('./pages/NewReel'));
const Letters = lazy(() => import('./pages/Letters'));
const LetterEditor = lazy(() => import('./pages/LetterEditor'));
const LetterDetail = lazy(() => import('./pages/LetterDetail'));
const Gallery = lazy(() => import('./pages/Gallery'));
const Profile = lazy(() => import('./pages/Profile'));
const Radyo = lazy(() => import('./pages/Radyo'));

export default function App() {
  useEffect(() => {
    const locomotiveScroll = new LocomotiveScroll();
    return () => {
      if (locomotiveScroll) locomotiveScroll.destroy();
    };
  }, []);

  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          {/* Global Background Theme based on mood/dark mode */}
          <BackgroundTheme />

          {/* Toast notifications */}
          <Toaster
            position="bottom-center"
            toastOptions={{
              duration: 3000,
              style: {
                background: 'rgba(var(--color-surface), 0.7)',
                color: 'inherit',
                backdropFilter: 'blur(16px)',
                WebkitBackdropFilter: 'blur(16px)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '16px',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
                padding: '12px 24px',
                fontSize: '0.875rem',
              },
              success: {
                iconTheme: {
                  primary: '#10B981',
                  secondary: 'rgba(var(--color-surface), 1)',
                },
              },
              error: {
                iconTheme: {
                  primary: '#EF4444',
                  secondary: 'rgba(var(--color-surface), 1)',
                },
              },
            }}
          />

          <RadioProvider>
            <Suspense fallback={<FullPageLoader />}>
              <Routes>
                {/* Root redirect */}
                <Route path="/" element={<Navigate to="/dashboard" replace />} />

                {/* Public auth pages */}
                <Route path="/login" element={<Login />} />
                <Route path="/signup" element={<Signup />} />

                {/* Authenticated — onboarding (skip onboarding check to avoid redirect loop) */}
                <Route
                  path="/onboarding"
                  element={
                    <ProtectedRoute skipOnboardingCheck>
                      <Onboarding />
                    </ProtectedRoute>
                  }
                />

                {/* Authenticated + Onboarded + Paired */}
                <Route path="/dashboard" element={<PairedRoute><Dashboard /></PairedRoute>} />
                <Route path="/memories" element={<PairedRoute><Memories /></PairedRoute>} />
                <Route path="/memories/new" element={<PairedRoute><NewMemory /></PairedRoute>} />
                <Route path="/memories/:id/edit" element={<PairedRoute><EditMemory /></PairedRoute>} />
                <Route path="/reels" element={<PairedRoute><Reels /></PairedRoute>} />
                <Route path="/reels/new" element={<PairedRoute><NewReel /></PairedRoute>} />
                <Route path="/letters" element={<PairedRoute><Letters /></PairedRoute>} />
                <Route path="/letters/new" element={<PairedRoute><LetterEditor /></PairedRoute>} />
                <Route path="/letters/:id/edit" element={<PairedRoute><LetterEditor /></PairedRoute>} />
                <Route path="/letters/:id" element={<PairedRoute><LetterDetail /></PairedRoute>} />
                <Route path="/gallery" element={<PairedRoute><Gallery /></PairedRoute>} />
                <Route path="/profile" element={<PairedRoute><Profile /></PairedRoute>} />
                <Route path="/radyo" element={<PairedRoute><Radyo /></PairedRoute>} />

                {/* Catch-all */}
                <Route path="*" element={<Navigate to="/dashboard" replace />} />
              </Routes>
            </Suspense>
            <GlobalRadioWidget />
          </RadioProvider>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}
