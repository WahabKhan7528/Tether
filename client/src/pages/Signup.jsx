import { useState } from 'react';
import { Link, useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner, { ThreeDotsLoader } from '../components/LoadingSpinner';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Link as LinkIcon } from 'lucide-react';
import PasswordInput from '../components/ui/PasswordInput';

export default function Signup() {
  const { user, loading, signup } = useAuth();
  const navigate = useNavigate();

  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [hasInviteCode, setHasInviteCode] = useState(false);

  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    inviteCode: '',
  });

  if (!loading && user) return <Navigate to="/onboarding" replace />;
  if (loading) return null;

  const update = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!form.name.trim() || !form.email.trim() || form.password.length < 8) {
      setError('Please fill in all required fields. Password must be at least 8 characters.');
      return;
    }
    
    if (hasInviteCode && !form.inviteCode.trim()) {
      setError('Please enter your invitation code, or uncheck the box if you don\'t have one.');
      return;
    }

    setSubmitting(true);
    try {
      await signup({
        name: form.name.trim(),
        email: form.email.trim(),
        password: form.password,
        ...(hasInviteCode && form.inviteCode.trim() ? { inviteCode: form.inviteCode.trim() } : {}),
      });
      navigate('/onboarding');
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 relative overflow-hidden bg-ethereal-bg">
      {/* Subtle texture overlay for natural feel */}
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-[0.03] pointer-events-none mix-blend-overlay"></div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="w-full max-w-md z-10 my-8"
      >
        <div className="bg-ethereal-surface-dim/40 backdrop-blur-xl border border-white/10 p-8 sm:p-12 rounded-[2.5rem] shadow-[0_8px_40px_0_rgba(0,0,0,0.4)] relative overflow-hidden">
          
          <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
          
          {/* SVG Decorations */}
          {/* Top-Left */}
          <div className="absolute top-0 left-0 -mt-6 -ml-6 text-ethereal-primary/20 pointer-events-none -rotate-90">
            <motion.svg width="150" height="150" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
              <motion.path 
                d="M20 80C20 40 50 20 80 20C70 50 50 70 20 80Z" 
                stroke="currentColor" 
                strokeWidth="1.5"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 1 }}
                transition={{ duration: 2.2, ease: "easeInOut", delay: 0.1 }}
              />
              <motion.path 
                d="M20 80C35 65 50 50 80 20" 
                stroke="currentColor" 
                strokeWidth="1"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 1 }}
                transition={{ duration: 2.2, ease: "easeInOut", delay: 0.4 }}
              />
              <motion.path 
                d="M40 70C50 60 60 40 70 30" 
                stroke="currentColor" 
                strokeWidth="0.5"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 0.6 }}
                transition={{ duration: 2.2, ease: "easeInOut", delay: 0.6 }}
              />
            </motion.svg>
          </div>

          {/* Top-Right */}
          <div className="absolute top-0 right-0 -mt-4 -mr-4 text-ethereal-primary/20 pointer-events-none">
            <motion.svg width="130" height="130" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
              <motion.path 
                d="M20 80C20 40 50 20 80 20C70 50 50 70 20 80Z" 
                stroke="currentColor" 
                strokeWidth="1.5"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 1 }}
                transition={{ duration: 2.4, ease: "easeInOut", delay: 0.2 }}
              />
              <motion.path 
                d="M20 80C35 65 50 50 80 20" 
                stroke="currentColor" 
                strokeWidth="1"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 1 }}
                transition={{ duration: 2.4, ease: "easeInOut", delay: 0.5 }}
              />
              <motion.path 
                d="M40 70C50 60 60 40 70 30" 
                stroke="currentColor" 
                strokeWidth="0.5"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 0.6 }}
                transition={{ duration: 2.4, ease: "easeInOut", delay: 0.7 }}
              />
            </motion.svg>
          </div>
          
          {/* Bottom-Right */}
          <div className="absolute bottom-0 right-0 -mb-8 -mr-8 text-ethereal-primary/20 pointer-events-none rotate-90">
            <motion.svg width="180" height="180" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
              <motion.path 
                d="M20 80C20 40 50 20 80 20C70 50 50 70 20 80Z" 
                stroke="currentColor" 
                strokeWidth="1.5"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 1 }}
                transition={{ duration: 2.8, ease: "easeInOut", delay: 0.3 }}
              />
              <motion.path 
                d="M20 80C35 65 50 50 80 20" 
                stroke="currentColor" 
                strokeWidth="1"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 1 }}
                transition={{ duration: 2.8, ease: "easeInOut", delay: 0.6 }}
              />
              <motion.path 
                d="M40 70C50 60 60 40 70 30" 
                stroke="currentColor" 
                strokeWidth="0.5"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 0.6 }}
                transition={{ duration: 2.8, ease: "easeInOut", delay: 0.8 }}
              />
            </motion.svg>
          </div>

          {/* Bottom-Left */}
          <div className="absolute bottom-0 left-0 -mb-6 -ml-6 text-ethereal-primary/20 pointer-events-none rotate-180">
            <motion.svg width="160" height="160" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
              <motion.path 
                d="M20 80C20 40 50 20 80 20C70 50 50 70 20 80Z" 
                stroke="currentColor" 
                strokeWidth="1.5"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 1 }}
                transition={{ duration: 2.5, ease: "easeInOut", delay: 0.4 }}
              />
              <motion.path 
                d="M20 80C35 65 50 50 80 20" 
                stroke="currentColor" 
                strokeWidth="1"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 1 }}
                transition={{ duration: 2.5, ease: "easeInOut", delay: 0.7 }}
              />
              <motion.path 
                d="M40 70C50 60 60 40 70 30" 
                stroke="currentColor" 
                strokeWidth="0.5"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 0.6 }}
                transition={{ duration: 2.5, ease: "easeInOut", delay: 0.9 }}
              />
            </motion.svg>
          </div>

          {/* Header */}
          <div className="text-center mb-8 relative z-10">
            <h1 className="text-3xl sm:text-4xl font-heading font-bold text-white tracking-tight mb-2">
              Create your account
            </h1>
            <p className="text-ethereal-tertiary/60 font-medium font-sans">
              Set up your space in seconds.
            </p>
          </div>

          <div className="relative z-10">
            <form onSubmit={handleSubmit} className="space-y-6">
              
              {/* Premium Invite Code Toggle */}
              <div className={`transition-all duration-300 rounded-[2rem] border ${hasInviteCode ? 'bg-ethereal-primary/5 border-ethereal-primary/30 p-5' : 'bg-white/5 border-white/10 p-2'}`}>
                <button
                  type="button"
                  onClick={() => setHasInviteCode(!hasInviteCode)}
                  className={`flex items-center justify-between w-full group ${hasInviteCode ? 'mb-4' : 'p-3'}`}
                >
                  <div className="flex items-center gap-4">
                    <div className={`p-2.5 rounded-2xl transition-colors duration-300 ${hasInviteCode ? 'bg-ethereal-primary/20 text-ethereal-primary shadow-[0_0_15px_rgba(var(--color-primary),0.3)]' : 'bg-white/5 text-white/50 group-hover:bg-white/10 group-hover:text-white/80'}`}>
                      <LinkIcon size={18} />
                    </div>
                    <div className="text-left">
                      <span className="block text-sm font-bold text-white/90 tracking-wide">Have an invite code?</span>
                      {!hasInviteCode && <span className="block text-xs text-white/40 font-sans mt-0.5">Join your partner's space</span>}
                    </div>
                  </div>
                  
                  {/* Toggle Switch */}
                  <div className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors duration-300 shadow-inner ${hasInviteCode ? 'bg-ethereal-primary' : 'bg-white/10 group-hover:bg-white/20'}`}>
                    <span className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform duration-300 shadow-md ${hasInviteCode ? 'translate-x-6' : 'translate-x-1'}`} />
                  </div>
                </button>
                
                <AnimatePresence>
                  {hasInviteCode && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="pt-2">
                        <input
                          id="inviteCode"
                          type="text"
                          className="w-full bg-black/20 border border-ethereal-primary/30 rounded-2xl px-5 py-4 text-center font-mono text-xl tracking-[0.2em] uppercase text-ethereal-primary placeholder-ethereal-primary/20 focus:outline-none focus:border-ethereal-primary focus:bg-ethereal-primary/10 transition-all shadow-inner"
                          placeholder="ENTER CODE"
                          value={form.inviteCode}
                          onChange={update('inviteCode')}
                          required={hasInviteCode}
                          maxLength={12}
                          autoComplete="off"
                        />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <div>
                <label htmlFor="name" className="label flex items-center gap-2">
                  <User size={14} className="text-ethereal-tertiary/50" />
                  Your name
                </label>
                <input
                  id="name"
                  type="text"
                  className="input"
                  placeholder="Alex"
                  value={form.name}
                  onChange={update('name')}
                  required
                  maxLength={60}
                  autoComplete="name"
                />
              </div>

              <div>
                <label htmlFor="email" className="label">Your email</label>
                <input
                  id="email"
                  type="email"
                  className="input"
                  placeholder="alex@example.com"
                  value={form.email}
                  onChange={update('email')}
                  required
                  autoComplete="email"
                />
              </div>

              <PasswordInput
                id="password"
                label="Your password"
                value={form.password}
                onChange={update('password')}
                autoComplete="new-password"
                placeholder="At least 8 characters"
                minLength={8}
              />

              {error && (
                <div className="p-4 bg-ethereal-error/10 text-ethereal-error rounded-2xl text-sm">
                  {error}
                </div>
              )}

              <div className="pt-2">
                <button type="submit" disabled={submitting} className="btn-primary w-full py-4 text-base font-semibold gap-2 flex items-center justify-center">
                  {submitting ? <ThreeDotsLoader size="md" /> : (hasInviteCode ? 'Join Partner' : 'Create Account')}
                </button>
              </div>
            </form>
          </div>

          <p className="text-center mt-10 text-ethereal-tertiary/50 text-sm font-sans relative z-10">
            Already have an account?{' '}
            <Link to="/login" className="text-ethereal-primary font-bold hover:underline tracking-wide">
              Sign in
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
