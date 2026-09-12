import { createContext, useContext, useState, useEffect, useCallback, useRef, useMemo } from 'react';
import toast from 'react-hot-toast';
import { getMe } from '../api/auth';
import * as authApi from '../api/auth';
import { useQueryClient } from '@tanstack/react-query';

const AuthContext = createContext(null);
const AuthDispatchContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const queryClient = useQueryClient();

  // ── Listen for forced logout events from the Axios interceptor ────────────
  useEffect(() => {
    const handleLogout = () => {
      setUser(null);
      queryClient.clear();
      localStorage.removeItem('lastPlayedTrackId');
    };
    window.addEventListener('auth:logout', handleLogout);
    return () => window.removeEventListener('auth:logout', handleLogout);
  }, [queryClient]);

  // ── Bootstrap — attempt to restore session from HttpOnly cookies ──────────
  // We call /api/auth/me on mount. If the accessToken cookie is valid (or the
  // refreshToken cookie allows silent rotation), we get the user back.
  // No localStorage needed — cookies are browser-managed.
  useEffect(() => {
    getMe()
      .then((res) => setUser(res.data.data.user))
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  // ── Login ──────────────────────────────────────────────────────────────────
  const login = useCallback(async (credentials) => {
    const res = await authApi.login(credentials);
    const { user: u } = res.data.data;
    setUser(u);
    return u;
  }, []);

  // ── Signup ─────────────────────────────────────────────────────────────────
  const signup = useCallback(async (data) => {
    const res = await authApi.signup(data);
    const { user: u } = res.data.data;
    setUser(u);
    return u;
  }, []);

  // ── Logout ─────────────────────────────────────────────────────────────────
  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } catch (_) {
      // best effort — cookies will expire naturally
    }
    setUser(null);
    queryClient.clear();
    localStorage.removeItem('lastPlayedTrackId');
  }, [queryClient]);

  // ── Refresh user data from server ─────────────────────────────────────────
  const refreshUser = useCallback(async () => {
    try {
      const res = await getMe();
      setUser(res.data.data.user);
    } catch (_) {}
  }, []);

  // ── Update local user state after profile edits ───────────────────────────
  const updateUser = useCallback((updates) => {
    setUser((prev) => (prev ? { ...prev, ...updates } : prev));
  }, []);

  const isAuthenticated = !!user;
  const isPaired = isAuthenticated && user.isPaired;
  const onboardingComplete = isAuthenticated && user.onboardingComplete;

  // Polling was removed in favor of Socket.IO 'partner_joined' events in SocketContext.

  // ── Toast Notification when Partner Connects ───────────────────────────────
  const prevAuth = useRef({ isAuthenticated: false, isPaired: false });
  useEffect(() => {
    const wasAuthenticatedAndUnpaired = prevAuth.current.isAuthenticated && !prevAuth.current.isPaired;
    const isNowPaired = isAuthenticated && isPaired;

    if (wasAuthenticatedAndUnpaired && isNowPaired) {
      toast.success('Your partner is connected!');
    }
    
    prevAuth.current = { isAuthenticated, isPaired };
  }, [isAuthenticated, isPaired]);

  const dispatchValue = useMemo(() => ({
    login,
    signup,
    logout,
    refreshUser,
    updateUser,
    setUser,
  }), [login, signup, logout, refreshUser, updateUser, setUser]);

  const authValue = useMemo(() => ({
    user,
    loading,
    isAuthenticated,
    isPaired,
    onboardingComplete,
    login,
    signup,
    logout,
    refreshUser,
    updateUser,
    setUser,
  }), [user, loading, isAuthenticated, isPaired, onboardingComplete, login, signup, logout, refreshUser, updateUser, setUser]);

  return (
    <AuthDispatchContext.Provider value={dispatchValue}>
      <AuthContext.Provider value={authValue}>
        {children}
      </AuthContext.Provider>
    </AuthDispatchContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}

export function useAuthDispatch() {
  const ctx = useContext(AuthDispatchContext);
  if (!ctx) throw new Error('useAuthDispatch must be used inside AuthProvider');
  return ctx;
}
