import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { createMemory } from '../api/memories';
import { getCategories } from '../api/categories';
import api from '../api/axios';
import LoadingSpinner from '../components/LoadingSpinner';
import CustomDatePicker from '../components/CustomDatePicker';
import CustomDropdown from '../components/CustomDropdown';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, ImagePlus, Check, MapPin, Calendar, FolderHeart, Sparkles } from 'lucide-react';

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_SIZE_MB = 10;

// ─── Upload strategies ────────────────────────────────────────────────────────
async function uploadLocal(memoryId, file, order, onProgress) {
  const formData = new FormData();
  formData.append('image', file);
  formData.append('order', String(order));

  const res = await api.post(`/memories/${memoryId}/images`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress: (evt) => {
      if (evt.total) onProgress(Math.round((evt.loaded / evt.total) * 100));
    },
  });
  return res.data.data;
}


// ─── Component ────────────────────────────────────────────────────────────────
export default function NewMemory() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [form, setForm] = useState({ title: '', description: '', dateTaken: '', location: '', categoryId: '' });
  const [files, setFiles] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState([]);
  const [currentUpload, setCurrentUpload] = useState(-1);
  const [error, setError] = useState('');
  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: () => getCategories().then(r => r.data.data),
  });

  const handleFilePick = (e) => {
    const picked = Array.from(e.target.files);
    const valid = picked.filter(
      (f) => ALLOWED_TYPES.includes(f.type) && f.size <= MAX_SIZE_MB * 1024 * 1024
    );
    if (valid.length !== picked.length) {
      setError(`Some files were skipped. Only JPEG/PNG/WebP under ${MAX_SIZE_MB}MB are allowed.`);
    }
    setFiles(valid);
    setPreviews(valid.map((f) => URL.createObjectURL(f)));
    setUploadProgress(valid.map(() => 0));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (files.length === 0) {
      setError('Please add at least one photo.');
      return;
    }
    setError('');
    setLoading(true);
    setCurrentUpload(-1);

    try {
      const memRes = await createMemory({
        title: form.title,
        description: form.description || undefined,
        dateTaken: form.dateTaken || undefined,
        location: form.location || undefined,
        categoryId: form.categoryId || undefined,
      });
      const memoryId = memRes.data.data._id;

      for (let i = 0; i < files.length; i++) {
        setCurrentUpload(i);
        const updateProgress = (pct) =>
          setUploadProgress((prev) => prev.map((v, idx) => (idx === i ? pct : v)));

        await uploadLocal(memoryId, files[i], i, updateProgress);
      }

      await queryClient.invalidateQueries({ queryKey: ['memories'] });
      navigate('/memories');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save memory. Please try again.');
    }
    setLoading(false);
    setCurrentUpload(-1);
  };

  return (
    <div className="min-h-screen bg-ethereal-surface pb-32 md:pb-16 relative">

      {/* Background decorations */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-ethereal-primary/5 rounded-full blur-[100px] -z-10 translate-x-1/3 -translate-y-1/4"></div>

      <div className="max-w-2xl mx-auto px-4 sm:px-6 md:px-8 pt-24 sm:pt-28 md:pt-32 relative z-10">

        <div className="flex items-center gap-4 sm:gap-6 mb-8 sm:mb-12">
          <button type="button" onClick={() => navigate(-1)} className="shrink-0 w-12 h-12 rounded-full bg-ethereal-surface-dim/80 backdrop-blur-md border border-ethereal-outline/50 flex items-center justify-center text-ethereal-tertiary hover:bg-ethereal-surface hover:border-ethereal-primary/30 transition-all shadow-sm">
            <ArrowLeft size={20} strokeWidth={2} />
          </button>
          <div>
            <h1 className="font-heading text-3xl sm:text-4xl md:text-5xl text-ethereal-tertiary tracking-tight">New Memory</h1>
            <p className="text-ethereal-tertiary/60 font-sans text-sm sm:text-base mt-1">Preserve a moment forever.</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 sm:space-y-8">

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full"
          >
            {previews.length === 0 ? (
              <div className="w-full aspect-[4/3] sm:aspect-[16/9] rounded-[2.5rem] bg-ethereal-surface-dim/50 border border-ethereal-outline flex items-center justify-center cursor-pointer hover:border-ethereal-primary/50 hover:shadow-ambient transition-all duration-300 relative overflow-hidden group shadow-sm backdrop-blur-sm">
                <input
                  type="file"
                  id="images"
                  multiple
                  accept="image/jpeg,image/png,image/webp"
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                  onChange={handleFilePick}
                />
                <div className="text-center p-8 flex flex-col items-center justify-center">
                  <div className="w-20 h-20 rounded-full bg-ethereal-surface flex items-center justify-center text-ethereal-primary mb-6 group-hover:scale-110 group-hover:bg-ethereal-primary/10 transition-all duration-500 shadow-sm border border-ethereal-outline/50">
                    <ImagePlus strokeWidth={1.5} size={32} />
                  </div>
                  <p className="font-heading text-2xl text-ethereal-tertiary mb-2">Select Photos</p>
                  <p className="text-ethereal-tertiary/50 text-sm max-w-[250px] leading-relaxed">High-quality JPEG, PNG, or WebP. Up to 10MB each.</p>
                </div>
              </div>
            ) : (
              <div className="w-full aspect-[4/3] sm:aspect-[16/9] rounded-[2.5rem] overflow-hidden shadow-xl border border-ethereal-outline/50 relative group">
                <img src={previews[0]} alt="Primary preview" className="w-full h-full object-cover" />

                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center backdrop-blur-sm">
                  <input
                    type="file"
                    multiple
                    accept="image/jpeg,image/png,image/webp"
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                    onChange={handleFilePick}
                  />
                  <span className="bg-ethereal-surface-dim/90 text-ethereal-tertiary font-medium px-6 py-3 rounded-full text-sm flex items-center gap-2 shadow-lg border border-ethereal-outline/50 hover:bg-ethereal-surface transition-colors">
                    <ImagePlus size={16} /> Change Photos
                  </span>
                </div>

                {loading && currentUpload === 0 && (
                  <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center text-white backdrop-blur-md">
                    <LoadingSpinner size="lg" />
                    <span className="font-heading mt-4 text-xl">{uploadProgress[0]}%</span>
                  </div>
                )}
                {loading && currentUpload > 0 && (
                  <div className="absolute inset-0 bg-ethereal-primary/80 flex items-center justify-center backdrop-blur-md">
                    <Check size={48} className="text-white drop-shadow-md" />
                  </div>
                )}
              </div>
            )}

            {previews.length > 1 && (
              <div className="flex gap-4 mt-6 overflow-x-auto hide-scrollbar pb-4 px-2">
                {previews.slice(1).map((src, i) => {
                  const actualIndex = i + 1;
                  return (
                    <div key={actualIndex} className="relative w-24 h-24 sm:w-28 sm:h-28 flex-shrink-0 rounded-2xl overflow-hidden border border-ethereal-outline/50 shadow-md">
                      <img src={src} alt={`Preview ${actualIndex}`} className="w-full h-full object-cover" />

                      {loading && currentUpload === actualIndex && (
                        <div className="absolute inset-0 bg-black/60 flex items-center justify-center backdrop-blur-sm">
                          <span className="text-white text-sm font-bold">{uploadProgress[actualIndex]}%</span>
                        </div>
                      )}
                      {loading && currentUpload > actualIndex && (
                        <div className="absolute inset-0 bg-ethereal-primary/80 flex items-center justify-center backdrop-blur-sm">
                          <Check size={24} className="text-white" />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.5 }}
            className="space-y-5 sm:space-y-6 bg-ethereal-surface-dim/40 backdrop-blur-md p-5 sm:p-8 md:p-12 rounded-[2rem] sm:rounded-[2.5rem] border border-ethereal-outline/60 shadow-xl"
          >
            <div className="space-y-2">
              <label className="text-sm font-medium text-ethereal-tertiary/70 pl-1">Title</label>
              <input
                type="text"
                className="w-full bg-ethereal-surface border border-ethereal-outline rounded-2xl px-5 py-4 text-ethereal-tertiary placeholder:text-ethereal-tertiary/30 focus:outline-none focus:border-ethereal-primary focus:ring-1 focus:ring-ethereal-primary transition-all font-heading text-2xl"
                placeholder="Give this memory a title..."
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                required
                maxLength={120}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-ethereal-tertiary/70 pl-1">Description</label>
              <textarea
                className="w-full bg-ethereal-surface border border-ethereal-outline rounded-2xl px-5 py-4 text-ethereal-tertiary placeholder:text-ethereal-tertiary/30 focus:outline-none focus:border-ethereal-primary focus:ring-1 focus:ring-ethereal-primary transition-all resize-none leading-relaxed"
                rows={4}
                placeholder="Write something about this moment..."
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                maxLength={2000}
              />
            </div>

            <div className="flex flex-col sm:flex-row gap-6 pt-2">
              <div className="flex-1 space-y-2">
                <label className="text-sm font-medium text-ethereal-tertiary/70 flex items-center gap-2 pl-1"><Calendar size={14} className="text-ethereal-tertiary/40" /> Date</label>
                <CustomDatePicker
                  value={form.dateTaken}
                  onChange={(val) => setForm({ ...form, dateTaken: val })}
                />
              </div>
              <div className="flex-1 space-y-2">
                <label className="text-sm font-medium text-ethereal-tertiary/70 flex items-center gap-2 pl-1"><MapPin size={14} /> Location</label>
                <input
                  type="text"
                  className="w-full bg-ethereal-surface border border-ethereal-outline rounded-2xl px-5 py-4 text-ethereal-tertiary placeholder:text-ethereal-tertiary/30 focus:outline-none focus:border-ethereal-primary focus:ring-1 focus:ring-ethereal-primary transition-all"
                  placeholder="Where were you?"
                  value={form.location}
                  onChange={(e) => setForm({ ...form, location: e.target.value })}
                  maxLength={120}
                />
              </div>
            </div>

            <div className="space-y-2 pt-2">
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
          </motion.div>

          {error && <div className="p-4 bg-ethereal-error/10 text-ethereal-error border border-ethereal-error/20 rounded-2xl text-sm">{error}</div>}

          <div className="pt-6">
            <button type="submit" disabled={loading} className="btn-primary w-full py-4 text-lg shadow-xl hover:shadow-2xl flex justify-center items-center gap-2">
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <LoadingSpinner size="sm" />
                  {files.length > 0 ? `Uploading ${currentUpload + 1}/${files.length}…` : 'Saving…'}
                </span>
              ) : <><Sparkles size={20} /> Save Memory</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
