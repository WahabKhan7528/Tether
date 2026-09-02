import { useState, useRef } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { completeOnboarding, uploadAvatar } from '../api/profile';
import LoadingSpinner, { ThreeDotsLoader } from '../components/LoadingSpinner';
import CustomDatePicker from '../components/CustomDatePicker';
import CustomColorPicker from '../components/CustomColorPicker';
import {
  Smile, Info, Cake, Camera, ChevronRight, ChevronLeft,
  Check, User, Sparkles
} from 'lucide-react';

const slideVariants = {
  enter: (dir) => ({ opacity: 0, x: dir > 0 ? 50 : -50 }),
  center: { opacity: 1, x: 0 },
  exit: (dir) => ({ opacity: 0, x: dir > 0 ? -50 : 50 }),
};

const GENDER_OPTIONS = [
  { value: 'boy', label: 'Boy' },
  { value: 'girl', label: 'Girl' },
];

const COLOUR_PALETTE = [
  '#E8A598', '#F4C2A1', '#E8C9B0', '#D4A5A5',
  '#A8C5B5', '#87ABBE', '#B5A8C5', '#C5A8B5',
  '#7D9E8C', '#6B7FA8', '#8C6B7D', '#A89C6B',
];

export default function Onboarding() {
  const { user, loading, refreshUser, onboardingComplete } = useAuth();
  const navigate = useNavigate();

  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [avatarFile, setAvatarFile] = useState(null);
  const fileInputRef = useRef(null);

  const [form, setForm] = useState({
    nickname: '',
    gender: null,
    bio: '',
    favouriteColour: '',
    dateOfBirth: '',
  });

  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  if (onboardingComplete) return <Navigate to="/dashboard" replace />;

  const update = (field) => (val) =>
    setForm((f) => ({ ...f, [field]: val }));

  const goNext = () => {
    setDirection(1);
    setStep((s) => s + 1);
    setError('');
  };

  const goBack = () => {
    setDirection(-1);
    setStep((s) => s - 1);
    setError('');
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setError('Avatar must be smaller than 5MB.');
      return;
    }
    setAvatarFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => setAvatarPreview(ev.target.result);
    reader.readAsDataURL(file);
  };

  const handleFinish = async () => {
    setSubmitting(true);
    setError('');
    try {
      // Upload avatar first if provided
      if (avatarFile) {
        await uploadAvatar(avatarFile);
      }
      // Save all profile data + mark onboarding complete
      await completeOnboarding({
        nickname: form.nickname.trim() || undefined,
        gender: form.gender || undefined,
        dateOfBirth: form.dateOfBirth || undefined,
        bio: form.bio.trim() || undefined,
        favouriteColour: form.favouriteColour || undefined,
      });
      await refreshUser();
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSkip = async () => {
    setSubmitting(true);
    try {
      await completeOnboarding({});
      await refreshUser();
      navigate('/dashboard');
    } catch (_) {
      navigate('/dashboard');
    }
  };

  const STEPS = [
    {
      title: 'Hello! What should we call you?',
      subtitle: 'Your nickname and how you identify.',
      content: (
        <div className="space-y-6">
          <div>
            <label className="label text-white/80">Nickname</label>
            <input
              type="text"
              className="input bg-white/5 border-white/10 text-white placeholder-white/30 focus:border-ethereal-primary"
              placeholder={`e.g. ${user.name.split(' ')[0]}`}
              value={form.nickname}
              onChange={(e) => update('nickname')(e.target.value)}
              maxLength={40}
            />
            <p className="text-xs text-white/40 mt-2 font-sans">
              How your partner might call you — optional.
            </p>
          </div>
          <div>
            <label className="label text-white/80">I am a…</label>
            <div className="flex gap-3 flex-wrap mt-2">
              {GENDER_OPTIONS.map((g) => (
                <button
                  key={g.value}
                  type="button"
                  onClick={() => update('gender')(g.value)}
                  className={`flex items-center gap-2 px-5 py-3 rounded-full text-sm font-semibold transition-all duration-200 border ${
                    form.gender === g.value
                      ? 'bg-ethereal-primary text-white border-ethereal-primary shadow-md scale-105'
                      : 'bg-white/5 text-white/80 border-white/10 hover:border-white/30 hover:bg-white/10'
                  }`}
                >
                  {g.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      ),
    },
    {
      title: 'A bit about you',
      subtitle: 'Share something with your partner.',
      content: (
        <div className="space-y-6">
          <div>
            <label className="label flex items-center justify-between text-white/80">
              <span>Bio</span>
              <span className={`text-xs font-mono ${form.bio.length > 140 ? 'text-ethereal-error' : 'text-white/40'}`}>
                {form.bio.length}/160
              </span>
            </label>
            <textarea
              className="input bg-white/5 border-white/10 text-white placeholder-white/30 focus:border-ethereal-primary min-h-[100px] resize-none"
              placeholder="Something sweet about yourself…"
              value={form.bio}
              onChange={(e) => update('bio')(e.target.value)}
              maxLength={160}
            />
          </div>
          <div>
            <label className="label text-white/80">Favourite colour</label>
            <div className="mt-2">
              <CustomColorPicker
                value={form.favouriteColour}
                onChange={(val) => update('favouriteColour')(val)}
                palette={COLOUR_PALETTE}
              />
            </div>
          </div>
        </div>
      ),
    },
    {
      title: 'When is your birthday?',
      subtitle: "We'll remember it — your partner might too.",
      content: (
        <div className="space-y-4 min-h-[250px]">
          <div>
            <label htmlFor="dob" className="label text-white/80">Date of birth</label>
            <div className="date-picker-wrapper-dark">
              <CustomDatePicker
                value={form.dateOfBirth}
                onChange={(val) => update('dateOfBirth')(val)}
                placement="bottom"
              />
            </div>
          </div>
          <p className="text-xs text-white/40 font-sans mt-2">
            This stays private — your partner will only see your birth month and day, not the year.
          </p>
        </div>
      ),
    },
    {
      title: 'Add your photo',
      subtitle: 'Put a face to your space.',
      content: (
        <div className="space-y-6">
          <div className="flex flex-col items-center gap-5">
            {/* Avatar preview */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="relative group"
            >
              <div className="w-28 h-28 rounded-full overflow-hidden border-2 border-white/20 bg-white/5 flex items-center justify-center transition-all duration-300 group-hover:border-ethereal-primary shadow-[0_4px_20px_rgba(0,0,0,0.3)]">
                {avatarPreview ? (
                  <img src={avatarPreview} alt="Avatar preview" className="w-full h-full object-cover" />
                ) : (
                  <User size={40} className="text-white/30" />
                )}
              </div>
              <div className="absolute bottom-1 right-1 w-8 h-8 bg-ethereal-primary text-white rounded-full flex items-center justify-center shadow-md group-hover:scale-110 transition-transform">
                <Camera size={14} />
              </div>
            </button>
            <p className="text-xs text-white/40 font-sans text-center">
              Click to upload · JPEG, PNG, or WebP · Max 5MB
            </p>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleAvatarChange}
              className="hidden"
              aria-label="Upload avatar"
            />
            {avatarFile && (
              <div className="flex items-center gap-2 text-sm text-emerald-400 font-medium">
                <Check size={16} />
                <span>{avatarFile.name}</span>
              </div>
            )}
          </div>
        </div>
      ),
    },
  ];

  const currentStep = STEPS[step];
  const isLastStep = step === STEPS.length - 1;

  return (
    <div className="min-h-screen flex items-center justify-center p-6 relative overflow-hidden bg-ethereal-bg">
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-[0.03] pointer-events-none mix-blend-overlay"></div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="w-full max-w-md z-10 my-8"
      >
        {/* Header */}
        <div className="text-center mb-8 relative z-10">
          <h1 className="text-3xl sm:text-4xl font-heading font-bold text-white tracking-tight mb-2">
            Set up your profile
          </h1>
          <p className="text-ethereal-tertiary/60 font-medium font-sans">
            Welcome, {user.name.split(' ')[0]}! Tell us a bit about yourself.
          </p>
        </div>

        {/* Progress bar */}
        <div className="flex gap-1.5 mb-8 relative z-10">
          {STEPS.map((_, i) => (
            <div
              key={i}
              className={`h-1 flex-1 rounded-full transition-all duration-500 ${
                i <= step ? 'bg-ethereal-primary' : 'bg-white/10'
              }`}
            />
          ))}
        </div>

        {/* Step card */}
        <div className="bg-ethereal-surface-dim/40 backdrop-blur-xl border border-white/10 p-8 sm:p-12 rounded-[2.5rem] shadow-[0_8px_40px_0_rgba(0,0,0,0.4)] relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
          
          {/* SVG Decorations */}
          {/* Top-Right */}
          <div className="absolute top-0 right-0 -mt-10 -mr-10 text-ethereal-primary/20 pointer-events-none rotate-90">
            <motion.svg width="150" height="150" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
              <motion.path 
                d="M50 50C30 30 10 40 10 60C10 80 30 90 50 50Z" 
                stroke="currentColor" 
                strokeWidth="1.5"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 1 }}
                transition={{ duration: 2.5, ease: "easeInOut", delay: 0.3 }}
              />
              <motion.path 
                d="M10 60C30 60 40 55 50 50" 
                stroke="currentColor" 
                strokeWidth="1"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 0.7 }}
                transition={{ duration: 2, ease: "easeInOut", delay: 1.1 }}
              />
            </motion.svg>
          </div>

          {/* Center-Left */}
          <div className="absolute top-1/2 left-0 -mt-24 -ml-12 text-ethereal-primary/20 pointer-events-none -rotate-45">
            <motion.svg width="200" height="200" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
              {/* Petal 1 */}
              <motion.path 
                d="M50 50C30 30 10 40 10 60C10 80 30 90 50 50Z" 
                stroke="currentColor" 
                strokeWidth="1.5"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 1 }}
                transition={{ duration: 3, ease: "easeInOut", delay: 0.2 }}
              />
              <motion.path 
                d="M50 50C70 70 90 60 90 40C90 20 70 10 50 50Z" 
                stroke="currentColor" 
                strokeWidth="1.5"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 1 }}
                transition={{ duration: 3, ease: "easeInOut", delay: 0.4 }}
              />
              <motion.path 
                d="M10 60C30 60 40 55 50 50" 
                stroke="currentColor" 
                strokeWidth="1"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 0.7 }}
                transition={{ duration: 2, ease: "easeInOut", delay: 1 }}
              />
              <motion.path 
                d="M90 40C70 40 60 45 50 50" 
                stroke="currentColor" 
                strokeWidth="1"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 0.7 }}
                transition={{ duration: 2, ease: "easeInOut", delay: 1.2 }}
              />
            </motion.svg>
          </div>

          {/* Bottom-Right */}
          <div className="absolute bottom-0 right-0 -mb-10 -mr-10 text-ethereal-primary/20 pointer-events-none rotate-45">
            <motion.svg width="150" height="150" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
              <motion.path 
                d="M50 50C30 30 10 40 10 60C10 80 30 90 50 50Z" 
                stroke="currentColor" 
                strokeWidth="1.5"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 1 }}
                transition={{ duration: 2.5, ease: "easeInOut", delay: 0.6 }}
              />
              <motion.path 
                d="M10 60C30 60 40 55 50 50" 
                stroke="currentColor" 
                strokeWidth="1"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 0.7 }}
                transition={{ duration: 2, ease: "easeInOut", delay: 1.4 }}
              />
            </motion.svg>
          </div>

          {/* Bottom-Left */}
          <div className="absolute bottom-0 left-0 -mb-10 -ml-10 text-ethereal-primary/20 pointer-events-none -rotate-90">
            <motion.svg width="160" height="160" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
              <motion.path 
                d="M50 50C30 30 10 40 10 60C10 80 30 90 50 50Z" 
                stroke="currentColor" 
                strokeWidth="1.5"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 1 }}
                transition={{ duration: 2.7, ease: "easeInOut", delay: 0.5 }}
              />
              <motion.path 
                d="M10 60C30 60 40 55 50 50" 
                stroke="currentColor" 
                strokeWidth="1"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 0.7 }}
                transition={{ duration: 2, ease: "easeInOut", delay: 1.3 }}
              />
            </motion.svg>
          </div>

          <div className="relative z-10">
            <AnimatePresence mode="wait" custom={direction}>
              <motion.div
                key={step}
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.35, ease: 'easeInOut' }}
              >
                {/* Step header */}
                <div className="mb-7">
                  <h2 className="text-xl font-heading font-bold text-white leading-snug">
                    {currentStep.title}
                  </h2>
                  <p className="text-ethereal-tertiary/60 text-sm font-sans mt-1">
                    {currentStep.subtitle}
                  </p>
                </div>

                {/* Step content */}
                <div>
                  {currentStep.content}
                </div>

                {error && (
                  <div className="mt-5 p-4 bg-ethereal-error/10 text-ethereal-error rounded-2xl text-sm">
                    {error}
                  </div>
                )}

                {/* Navigation */}
                <div className="flex gap-3 mt-8">
                  {step > 0 && (
                    <button
                      type="button"
                      onClick={goBack}
                      className="btn-secondary flex-shrink-0 py-3.5 px-4 flex items-center justify-center rounded-2xl border-white/20 text-white hover:bg-white/5"
                      disabled={submitting}
                    >
                      <ChevronLeft size={18} />
                    </button>
                  )}

                  {isLastStep ? (
                    <button
                      type="button"
                      onClick={handleFinish}
                      disabled={submitting}
                      className="btn-primary flex-1 py-3.5 text-sm font-semibold h-[52px]"
                    >
                      {submitting ? <ThreeDotsLoader size="md" /> : 'Finish setup'}
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={goNext}
                      className="btn-primary flex-1 py-3.5 text-sm font-semibold gap-2 h-[52px]"
                    >
                      Next
                      <ChevronRight size={16} />
                    </button>
                  )}
                </div>

                {/* Skip */}
                <button
                  type="button"
                  onClick={handleSkip}
                  disabled={submitting}
                  className="w-full mt-6 text-xs text-white/40 hover:text-white/80 transition-colors font-sans"
                >
                  Skip setup for now
                </button>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
