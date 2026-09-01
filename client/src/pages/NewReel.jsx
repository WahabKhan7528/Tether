import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { createReel } from '../api/reels';
import { getCategories } from '../api/categories';
import LoadingSpinner from '../components/LoadingSpinner';
import CustomDropdown from '../components/CustomDropdown';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Camera, Music2, Link2, FolderHeart, PenLine, MessageSquare, Sparkles } from 'lucide-react';

function detectPlatform(url) {
  if (!url) return 'other';
  if (url.includes('instagram.com')) return 'instagram';
  if (url.includes('tiktok.com')) return 'tiktok';
  return 'other';
}

const PLATFORM_ICONS = { 
  instagram: <Camera size={16} />, 
  tiktok: <Music2 size={16} />, 
  other: <Link2 size={16} /> 
};

export default function NewReel() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [form, setForm] = useState({ url: '', platform: 'other', caption: '', note: '', categoryId: '' });
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    getCategories().then((r) => setCategories(r.data.data)).catch(() => {});
  }, []);

  const handleUrlChange = (url) => {
    setForm((f) => ({ ...f, url, platform: detectPlatform(url) }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await createReel({
        url: form.url,
        platform: form.platform,
        caption: form.caption,
        note: form.note,
        categoryId: form.categoryId || undefined,
      });
      await queryClient.invalidateQueries({ queryKey: ['reels'] });
      navigate('/reels');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save reel. Please try again.');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-ethereal-surface pb-32 md:pb-16 relative">
      
      {/* Background decorations */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-ethereal-primary/5 rounded-full blur-[100px] -z-10 translate-x-1/3 -translate-y-1/4"></div>
      
      <div className="max-w-2xl mx-auto px-4 sm:px-6 md:px-8 pt-24 sm:pt-28 md:pt-32 relative z-10">
        
        <div className="flex items-center gap-4 sm:gap-6 mb-8 sm:mb-12">
          <button type="button" onClick={() => navigate(-1)} className="shrink-0 w-12 h-12 rounded-full bg-ethereal-surface-dim/80 backdrop-blur-md border border-ethereal-outline/50 flex items-center justify-center text-ethereal-tertiary hover:bg-ethereal-surface hover:border-ethereal-primary/30 transition-all shadow-sm">
            <ArrowLeft size={20} strokeWidth={2} />
          </button>
          <div>
            <h1 className="font-heading text-3xl sm:text-4xl md:text-5xl text-ethereal-tertiary tracking-tight">Save a Reel</h1>
            <p className="text-ethereal-tertiary/60 font-sans text-sm sm:text-base mt-1">Drop a link to an idea you want to recreate.</p>
          </div>
        </div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="bg-ethereal-surface-dim/40 backdrop-blur-md p-5 sm:p-8 md:p-12 rounded-[2rem] sm:rounded-[2.5rem] shadow-2xl border border-ethereal-outline/60"
        >
          <form onSubmit={handleSubmit} className="space-y-5 sm:space-y-8">
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-ethereal-tertiary/70 flex items-center gap-2 pl-1"><Link2 size={14}/> Paste Link</label>
              <div className="relative">
                <input
                  type="url"
                  className="w-full bg-ethereal-surface border border-ethereal-outline rounded-2xl px-5 py-4 text-ethereal-tertiary placeholder:text-ethereal-tertiary/30 focus:outline-none focus:border-ethereal-primary focus:ring-1 focus:ring-ethereal-primary transition-all"
                  placeholder="https://www.instagram.com/reel/..."
                  value={form.url}
                  onChange={(e) => handleUrlChange(e.target.value)}
                  required
                />
              </div>
              
              <AnimatePresence>
                {form.url && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0, marginTop: 0 }} 
                    animate={{ opacity: 1, height: 'auto', marginTop: 12 }}
                    exit={{ opacity: 0, height: 0, marginTop: 0 }}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-full border text-label transition-all bg-ethereal-surface-dim border-ethereal-outline/50 text-ethereal-tertiary/80 shadow-sm"
                  >
                    {PLATFORM_ICONS[form.platform]} 
                    <span>{form.platform}</span>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-ethereal-tertiary/70 flex items-center gap-2 pl-1"><PenLine size={14}/> Title</label>
              <input
                type="text"
                className="w-full bg-ethereal-surface border border-ethereal-outline rounded-2xl px-5 py-4 text-ethereal-tertiary placeholder:text-ethereal-tertiary/30 focus:outline-none focus:border-ethereal-primary focus:ring-1 focus:ring-ethereal-primary transition-all font-heading text-xl"
                placeholder="What is this about?"
                value={form.caption}
                onChange={(e) => setForm({ ...form, caption: e.target.value })}
                maxLength={300}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-ethereal-tertiary/70 flex items-center gap-2 pl-1"><MessageSquare size={14}/> Your Note</label>
              <textarea
                className="w-full bg-ethereal-surface border border-ethereal-outline rounded-2xl px-5 py-4 text-ethereal-tertiary placeholder:text-ethereal-tertiary/30 focus:outline-none focus:border-ethereal-primary focus:ring-1 focus:ring-ethereal-primary transition-all resize-none"
                rows={3}
                placeholder="This looks so fun, we should try it this weekend!"
                value={form.note}
                onChange={(e) => setForm({ ...form, note: e.target.value })}
                maxLength={500}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-ethereal-tertiary/70 flex items-center gap-2 pl-1"><FolderHeart size={14} className="text-ethereal-tertiary/40" /> Collection</label>
              <CustomDropdown
                value={form.categoryId}
                onChange={(val) => setForm({ ...form, categoryId: val })}
                options={[
                  { value: '', label: 'None (Optional)' },
                  ...categories.map((c) => ({ value: c._id, label: c.name }))
                ]}
                placeholder="None (Optional)"
              />
            </div>

            {error && <div className="p-4 bg-ethereal-error/10 text-ethereal-error border border-ethereal-error/20 rounded-2xl text-sm">{error}</div>}

            <div className="pt-6">
              <button type="submit" disabled={loading} className="btn-primary w-full py-4 text-lg shadow-xl hover:shadow-2xl flex justify-center items-center gap-2">
                {loading ? <LoadingSpinner size="sm" /> : <><Sparkles size={20} /> Save Reel</>}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </div>
  );
}
