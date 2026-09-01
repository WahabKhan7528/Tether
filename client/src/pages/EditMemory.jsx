import { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useParams } from 'react-router-dom';
import { getMemory, updateMemory } from '../api/memories';
import { getCategories } from '../api/categories';
import api from '../api/axios';
import LoadingSpinner from '../components/LoadingSpinner';
import CustomDatePicker from '../components/CustomDatePicker';
import CustomDropdown from '../components/CustomDropdown';
import { motion } from 'framer-motion';
import { ArrowLeft, ImagePlus, Check, MapPin, Calendar, FolderHeart, X, Sparkles } from 'lucide-react';
import ConfirmationModal from '../components/ui/ConfirmationModal';
import { toast } from 'react-hot-toast';

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_SIZE_MB = 10;


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



export default function EditMemory() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [form, setForm] = useState({ title: '', description: '', dateTaken: '', location: '', categoryId: '' });
  const [existingImages, setExistingImages] = useState([]);
  const [newFiles, setNewFiles] = useState([]);
  const [newPreviews, setNewPreviews] = useState([]);
  const [saving, setSaving] = useState(false);
  const [uploadProgress, setUploadProgress] = useState([]);
  const [currentUpload, setCurrentUpload] = useState(-1);
  const [error, setError] = useState('');
  const [existingToRemove, setExistingToRemove] = useState(null);
  const [newToRemove, setNewToRemove] = useState(null);
  const [formInitialized, setFormInitialized] = useState(false);

  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: () => getCategories().then(r => r.data.data),
  });

  const { data: memory, isLoading, isError } = useQuery({
    queryKey: ['memory', id],
    queryFn: () => getMemory(id).then(r => r.data.data),
  });

  useEffect(() => {
    if (memory && !formInitialized) {
      setForm({
        title: memory.title || '',
        description: memory.description || '',
        dateTaken: memory.dateTaken ? new Date(memory.dateTaken).toISOString().split('T')[0] : '',
        location: memory.location || '',
        categoryId: memory.categoryId?._id || memory.categoryId || ''
      });
      setExistingImages(memory.images?.sort((a, b) => a.order - b.order) || []);
      setFormInitialized(true);
    }
  }, [memory, formInitialized]);

  if (isError) {
    toast.error('Failed to load memory');
  }

  const handleFilePick = (e) => {
    const picked = Array.from(e.target.files);
    const valid = picked.filter(
      (f) => ALLOWED_TYPES.includes(f.type) && f.size <= MAX_SIZE_MB * 1024 * 1024
    );
    if (valid.length !== picked.length) {
      toast.error(`Some files were skipped. Only JPEG/PNG/WebP under ${MAX_SIZE_MB}MB are allowed.`);
    }
    setNewFiles(prev => [...prev, ...valid]);
    setNewPreviews(prev => [...prev, ...valid.map((f) => URL.createObjectURL(f))]);
    setUploadProgress(prev => [...prev, ...valid.map(() => 0)]);
  };

  const removeExistingImage = (indexToRemove) => {
    setExistingToRemove(indexToRemove);
  };

  const removeNewFile = (indexToRemove) => {
    setNewToRemove(indexToRemove);
  };

  const confirmRemoveImage = () => {
    if (existingToRemove !== null) {
      setExistingImages(prev => prev.filter((_, i) => i !== existingToRemove));
      setExistingToRemove(null);
    } else if (newToRemove !== null) {
      setNewFiles(prev => prev.filter((_, i) => i !== newToRemove));
      setNewPreviews(prev => prev.filter((_, i) => i !== newToRemove));
      setUploadProgress(prev => prev.filter((_, i) => i !== newToRemove));
      setNewToRemove(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (existingImages.length === 0 && newFiles.length === 0) {
      toast.error('A memory must have at least one photo.');
      return;
    }
    setError('');
    setSaving(true);
    setCurrentUpload(-1);

    try {
      // Step 1: Update text fields and existing images array
      await updateMemory(id, {
        title: form.title,
        description: form.description || undefined,
        dateTaken: form.dateTaken || undefined,
        location: form.location || undefined,
        categoryId: form.categoryId || null,
        images: existingImages.map((img, idx) => ({ ...img, order: idx })) // Re-order kept images
      });

      // Step 2: Upload new files if any
      if (newFiles.length > 0) {
        const startOrder = existingImages.length;
        for (let i = 0; i < newFiles.length; i++) {
          setCurrentUpload(i);
          const updateProgress = (pct) =>
            setUploadProgress((prev) => prev.map((v, idx) => (idx === i ? pct : v)));

          await uploadLocal(id, newFiles[i], startOrder + i, updateProgress);
        }
      }

      await queryClient.invalidateQueries({ queryKey: ['memories'] });
      await queryClient.invalidateQueries({ queryKey: ['memory', id] });
      toast.success('Memory updated successfully');
      navigate('/memories');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update memory. Please try again.');
      setSaving(false);
      setCurrentUpload(-1);
    }
  };

  if (isLoading || !formInitialized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-ethereal-surface">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

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
            <h1 className="font-heading text-3xl sm:text-4xl md:text-5xl text-ethereal-tertiary tracking-tight">Edit Memory</h1>
            <p className="text-ethereal-tertiary/60 font-sans text-sm sm:text-base mt-1">Update your preserved moment.</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 sm:space-y-8">

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full bg-ethereal-surface-dim/20 p-5 sm:p-8 rounded-[2rem] sm:rounded-[2.5rem] border border-ethereal-outline/40 shadow-sm"
          >
            {/* Gallery of all images (existing + new) */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {existingImages.map((img, i) => (
                <div key={`existing-${i}`} className="relative aspect-square rounded-2xl overflow-hidden shadow-sm border border-ethereal-outline group bg-ethereal-surface-dim">
                  <img src={img.url} alt="Memory" className="w-full h-full object-cover" />
                  <button type="button" onClick={() => removeExistingImage(i)} className="absolute top-2 right-2 w-8 h-8 bg-black/50 hover:bg-ethereal-error text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all backdrop-blur-md">
                    <X size={16} />
                  </button>
                </div>
              ))}

              {newPreviews.map((src, i) => (
                <div key={`new-${i}`} className="relative aspect-square rounded-2xl overflow-hidden shadow-sm border border-ethereal-outline group bg-ethereal-surface-dim">
                  <img src={src} alt="New Preview" className="w-full h-full object-cover" />
                  <button type="button" onClick={() => removeNewFile(i)} className="absolute top-2 right-2 w-8 h-8 bg-black/50 hover:bg-ethereal-error text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all backdrop-blur-md z-20">
                    <X size={16} />
                  </button>

                  {saving && currentUpload === i && (
                    <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center text-white backdrop-blur-sm z-10">
                      <LoadingSpinner size="sm" />
                      <span className="font-heading mt-2 text-sm">{uploadProgress[i]}%</span>
                    </div>
                  )}
                  {saving && currentUpload > i && (
                    <div className="absolute inset-0 bg-ethereal-primary/80 flex items-center justify-center backdrop-blur-sm z-10">
                      <Check size={24} className="text-white" />
                    </div>
                  )}
                </div>
              ))}

              {/* Add More Button */}
              <div className="relative aspect-square rounded-2xl bg-ethereal-surface border border-ethereal-outline flex flex-col items-center justify-center cursor-pointer hover:border-ethereal-primary/50 hover:shadow-ambient transition-all group overflow-hidden">
                <input
                  type="file"
                  multiple
                  accept="image/jpeg,image/png,image/webp"
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                  onChange={handleFilePick}
                />
                <div className="w-14 h-14 rounded-full bg-ethereal-surface-dim/60 flex items-center justify-center text-ethereal-primary mb-3 group-hover:scale-110 transition-transform shadow-sm">
                  <ImagePlus size={24} />
                </div>
                <span className="text-sm font-medium text-ethereal-tertiary">Add Photos</span>
              </div>
            </div>
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
            <button type="submit" disabled={saving} className="btn-primary w-full py-4 text-lg shadow-xl hover:shadow-2xl flex justify-center items-center gap-2">
              {saving ? (
                <span className="flex items-center justify-center gap-2">
                  <LoadingSpinner size="sm" />
                  {newFiles.length > 0 ? `Uploading ${currentUpload + 1}/${newFiles.length}…` : 'Saving…'}
                </span>
              ) : <><Sparkles size={20} /> Save Changes</>}
            </button>
          </div>
        </form>
      </div>

      <ConfirmationModal
        isOpen={existingToRemove !== null || newToRemove !== null}
        onClose={() => {
          setExistingToRemove(null);
          setNewToRemove(null);
        }}
        onConfirm={confirmRemoveImage}
        title="Remove Photo"
        message="Are you sure you want to remove this photo from the memory?"
        confirmText="Remove"
      />
    </div>
  );
}
