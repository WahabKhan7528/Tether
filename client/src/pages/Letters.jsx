import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import BottomNav from '../components/BottomNav';
import EmptyState from '../components/EmptyState';
import { Mail, Plus, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

import api from '../api/axios';

export default function Letters() {
  const { data: letters = [], isLoading: loading } = useQuery({
    queryKey: ['letters'],
    queryFn: async () => {
      const res = await api.get('/letters');
      return res.data.success ? res.data.data : [];
    },
  });

  return (
    <div className="min-h-screen pb-24 md:pb-8 bg-ethereal-surface">
      
      {/* Premium Hero Section */}
      <div className="relative pt-32 sm:pt-40 md:pt-48 pb-16 pl-6 pr-6 sm:pl-12 sm:pr-12 md:pl-28 md:pr-16 overflow-hidden">
        {/* Subtle background glow/decoration */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-ethereal-primary/5 rounded-full blur-[100px] -z-10 translate-x-1/3 -translate-y-1/4"></div>
        <div className="absolute top-40 left-0 w-[300px] h-[300px] bg-ethereal-primary/5 rounded-full blur-[80px] -z-10 -translate-x-1/2"></div>
        
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-end justify-between gap-10 relative z-10">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }} className="flex flex-col max-w-3xl">
            <h1 className="text-display drop-shadow-sm leading-[0.9] -ml-1 lg:-ml-2">
              Letters<span className="text-ethereal-primary/70">.</span>
            </h1>
            <p className="text-ethereal-tertiary/60 font-sans text-xl md:text-2xl font-light tracking-wide max-w-xl mt-6 leading-relaxed">
              Beautiful words paired with your favorite moments.
            </p>
          </motion.div>
          
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2, duration: 0.5 }}>
            <Link to="/letters/new" className="group relative hidden sm:flex items-center justify-center gap-3 px-8 py-4 bg-ethereal-primary text-ethereal-surface font-bold tracking-wide rounded-full overflow-hidden shadow-[0_8px_30px_rgba(var(--color-primary),0.25)] hover:shadow-[0_12px_40px_rgba(var(--color-primary),0.35)] hover:-translate-y-1 transition-all duration-400">
              <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-400 ease-out rounded-full"></div>
              <Sparkles size={18} className="relative z-10" />
              <span className="relative z-10 text-sm sm:text-base">Write letter</span>
            </Link>
            <Link to="/letters/new" className="w-14 h-14 bg-ethereal-primary text-white rounded-full flex items-center justify-center shadow-ambient sm:hidden active:scale-95 transition-transform z-50 fixed bottom-24 right-6">
              <Plus size={24} />
            </Link>
          </motion.div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto pl-6 pr-6 sm:pl-12 sm:pr-12 md:pl-28 md:pr-16">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-48 rounded-[1.5rem] bg-ethereal-surface-dim/30 animate-pulse"></div>
            ))}
          </div>
        ) : letters.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
            className="w-full rounded-[2rem] flex flex-col items-center justify-center text-center bg-gradient-to-b from-ethereal-surface-dim/60 to-ethereal-surface-dim/20 border border-ethereal-outline/50 shadow-ambient p-16 md:p-24 mt-4"
          >
            <div className="w-24 h-24 bg-ethereal-surface-dim rounded-full flex items-center justify-center mb-6 shadow-inner border border-white/40">
              <Mail size={40} strokeWidth={1.5} className="text-ethereal-primary/50" />
            </div>
            <h3 className="text-3xl font-heading text-ethereal-tertiary mb-3 tracking-tight">No letters yet</h3>
            <p className="text-ethereal-tertiary/60 mb-8 max-w-md text-lg leading-relaxed">
              Write your first letter by combining your words with photos from your gallery.
            </p>
            <Link to="/letters/new" className="btn-primary shadow-xl hover:shadow-2xl">
              <Sparkles size={18} />
              Write a letter
            </Link>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <AnimatePresence mode="popLayout">
              {letters.map((letter, i) => (
                <motion.div
                  key={letter._id}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <Link to={`/letters/${letter._id}`}>
                    <div className="bg-ethereal-surface-dim p-6 rounded-[2rem] border border-ethereal-outline hover:border-ethereal-primary/40 transition-all group shadow-ambient hover:shadow-xl hover:-translate-y-1">
                      <div className="w-12 h-12 rounded-full bg-ethereal-primary/10 text-ethereal-primary flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                        <Mail size={20} strokeWidth={1.5} />
                      </div>
                      
                      <h3 className="font-heading text-2xl font-medium text-ethereal-tertiary mb-2 group-hover:text-ethereal-primary transition-colors">
                        {letter.title}
                      </h3>
                      
                      <div className="flex items-center justify-between mt-6 pt-4 border-t border-ethereal-outline/50">
                        <span className="text-xs text-ethereal-tertiary/50 uppercase tracking-wider font-semibold">
                          {letter.templateId} template
                        </span>
                        <span className="text-xs font-medium text-ethereal-tertiary/60">
                          {new Date(letter.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
      
      <BottomNav />
    </div>
  );
}
