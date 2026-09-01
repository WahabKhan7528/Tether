import { useState } from 'react';
import { Link, useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner, { ThreeDotsLoader } from '../components/LoadingSpinner';
import PasswordInput from '../components/ui/PasswordInput';
import { motion } from 'framer-motion';

export default function Login() {
  const { user, loading, login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Already authenticated
  if (!loading && user) return <Navigate to={user.onboardingComplete ? '/dashboard' : '/onboarding'} replace />;
  if (loading) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const u = await login(form);
      // Route based on onboarding state
      navigate(u.onboardingComplete ? '/dashboard' : '/onboarding');
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 relative overflow-hidden bg-ethereal-bg">
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-[0.03] pointer-events-none mix-blend-overlay"></div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="w-full max-w-md z-10"
      >
        <div className="bg-ethereal-surface-dim/40 backdrop-blur-xl border border-white/10 p-8 sm:p-12 rounded-[2.5rem] shadow-[0_8px_40px_0_rgba(0,0,0,0.4)] relative overflow-hidden">

          <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>

          <div className="text-center mb-10 relative z-10">
            <h1 className="text-3xl sm:text-4xl font-heading font-bold text-white tracking-tight mb-2">Welcome back</h1>
            <p className="text-ethereal-tertiary/60 font-medium font-sans">Sign in to your shared space</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="email" className="label">Email</label>
              <input
                id="email"
                type="email"
                className="input"
                placeholder="you@example.com"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
                autoComplete="email"
              />
            </div>

            <PasswordInput
              id="password"
              label="Password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              autoComplete="current-password"
            />

            {error && <div className="p-4 bg-ethereal-error/10 text-ethereal-error rounded-2xl text-sm">{error}</div>}

            <div className="pt-4">
              <button type="submit" disabled={submitting} className="btn-primary w-full py-4 text-lg">
                {submitting ? <ThreeDotsLoader size="md" /> : 'Sign in'}
              </button>
            </div>
          </form>

          <p className="text-center mt-10 text-ethereal-tertiary/50 text-sm font-sans">
            New to Tether?{' '}
            <Link to="/signup" className="text-ethereal-primary font-bold hover:underline tracking-wide">
              Create an account
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
