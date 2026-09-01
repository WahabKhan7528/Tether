import { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Upload, ImagePlus, MapPin, Calendar, Type, FileText, Check } from 'lucide-react';
import api from '../../api/axios';
import LocationPickerModal from '../ui/LocationPickerModal';
import CustomDatePicker from '../CustomDatePicker';
import { useSocket } from '../../context/SocketContext';

export default function GalleryUploadModal({ onSuccess, onCancel }) {
  const socket = useSocket();
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [done, setDone] = useState(false);
  const [form, setForm] = useState({ title: '', caption: '', dateTaken: '', location: '', coordinates: { lat: null, lng: null } });
  const [showMapPicker, setShowMapPicker] = useState(false);
  const fileInputRef = useRef(null);

  const handleFile = (f) => {
    if (!f || !f.type.startsWith('image/')) return;
    setFile(f);
    const reader = new FileReader();
    reader.onload = (e) => setPreview(e.target.result);
    reader.readAsDataURL(f);
  };

  const onDrop = useCallback((e) => {
    e.preventDefault();
    setDragging(false);
    const dropped = e.dataTransfer.files[0];
    handleFile(dropped);
  }, []);

  const onDragOver = (e) => { e.preventDefault(); setDragging(true); };
  const onDragLeave = () => setDragging(false);

  const handleSubmit = async () => {
    if (!file) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('image', file);
      if (form.title) formData.append('title', form.title);
      if (form.caption) formData.append('caption', form.caption);
      if (form.dateTaken) formData.append('dateTaken', form.dateTaken);
      if (form.location) formData.append('location', form.location);
      if (form.coordinates && form.coordinates.lat !== null) {
        formData.append('coordinates', JSON.stringify(form.coordinates));
      }

      await api.post('/gallery/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (socket) socket.emit('content_updated');
      setDone(true);
      setTimeout(() => onSuccess(), 800);
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || 'Upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] bg-ethereal-surface/90 backdrop-blur-md flex items-center justify-center p-4"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ duration: 0.3 }}
          className="w-full max-w-xl bg-ethereal-surface-dim rounded-[2rem] shadow-2xl border border-ethereal-outline/50 overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-8 pt-8 pb-4">
            <div>
              <h2 className="font-heading text-2xl text-ethereal-tertiary">Upload to Gallery</h2>
              <p className="text-sm text-ethereal-tertiary/50 mt-0.5">This photo won't appear in Memories</p>
            </div>
            <button
              onClick={onCancel}
              className="w-10 h-10 flex items-center justify-center rounded-full text-ethereal-tertiary/40 hover:bg-ethereal-surface hover:text-ethereal-tertiary transition-all"
            >
              <X size={20} />
            </button>
          </div>

          <div className="px-8 pb-8 flex flex-col gap-6 max-h-[75vh] overflow-y-auto">
            {/* Drop zone / Preview */}
            {!preview ? (
              <div
                onDrop={onDrop}
                onDragOver={onDragOver}
                onDragLeave={onDragLeave}
                onClick={() => fileInputRef.current?.click()}
                className={`relative flex flex-col items-center justify-center gap-4 h-52 rounded-2xl border-2 border-dashed cursor-pointer transition-all duration-300 ${
                  dragging
                    ? 'border-ethereal-primary bg-ethereal-primary/5 scale-[1.02]'
                    : 'border-ethereal-outline hover:border-ethereal-primary/50 hover:bg-ethereal-surface/50'
                }`}
              >
                <div className="w-16 h-16 rounded-full bg-ethereal-primary/10 flex items-center justify-center">
                  <ImagePlus size={28} className="text-ethereal-primary" />
                </div>
                <div className="text-center">
                  <p className="font-medium text-ethereal-tertiary">Drop a photo here</p>
                  <p className="text-sm text-ethereal-tertiary/50 mt-1">or click to browse · JPEG, PNG, WebP · max 10 MB</p>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={(e) => handleFile(e.target.files[0])}
                />
              </div>
            ) : (
              <div className="relative rounded-2xl overflow-hidden aspect-video bg-black">
                <img src={preview} alt="preview" className="w-full h-full object-cover" />
                <button
                  onClick={() => { setFile(null); setPreview(null); }}
                  className="absolute top-3 right-3 w-8 h-8 bg-black/50 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-black/70 transition-colors"
                >
                  <X size={14} />
                </button>
              </div>
            )}

            {/* Metadata fields */}
            <div className="flex flex-col gap-4">
              {/* Title */}
              <div className="relative">
                <Type size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-ethereal-tertiary/40" />
                <input
                  type="text"
                  placeholder="Title (optional)"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  maxLength={120}
                  className="w-full pl-10 pr-4 py-3 bg-ethereal-surface border border-ethereal-outline rounded-xl text-ethereal-tertiary placeholder:text-ethereal-tertiary/30 focus:outline-none focus:border-ethereal-primary/50 transition-colors text-sm"
                />
              </div>

              {/* Caption */}
              <div className="relative">
                <FileText size={15} className="absolute left-4 top-3.5 text-ethereal-tertiary/40" />
                <textarea
                  placeholder="Caption (optional)"
                  value={form.caption}
                  onChange={(e) => setForm({ ...form, caption: e.target.value })}
                  maxLength={500}
                  rows={2}
                  className="w-full pl-10 pr-4 py-3 bg-ethereal-surface border border-ethereal-outline rounded-xl text-ethereal-tertiary placeholder:text-ethereal-tertiary/30 focus:outline-none focus:border-ethereal-primary/50 transition-colors resize-none text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Date */}
                <div className="relative">
                  <CustomDatePicker
                    value={form.dateTaken}
                    onChange={(val) => setForm({ ...form, dateTaken: val })}
                  />
                </div>

                {/* Location */}
                <div className="relative">
                  <MapPin size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-ethereal-tertiary/40" />
                  <input
                    type="text"
                    placeholder="Location (optional)"
                    value={form.location}
                    onChange={(e) => setForm({ ...form, location: e.target.value })}
                    maxLength={120}
                    className="w-full pl-10 pr-20 py-3 bg-ethereal-surface border border-ethereal-outline rounded-xl text-ethereal-tertiary placeholder:text-ethereal-tertiary/30 focus:outline-none focus:border-ethereal-primary/50 transition-colors text-sm"
                  />
                  <button 
                    type="button" 
                    onClick={() => setShowMapPicker(true)} 
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] uppercase font-bold tracking-wider text-ethereal-primary hover:underline"
                  >
                    Map
                  </button>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              <button
                onClick={onCancel}
                className="flex-1 py-3 rounded-full border border-ethereal-outline text-ethereal-tertiary hover:bg-ethereal-surface transition-colors text-sm font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={!file || uploading || done}
                className="flex-1 py-3 rounded-full bg-ethereal-primary text-white font-medium hover:bg-ethereal-primary/90 transition-colors shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm"
              >
                {done ? (
                  <><Check size={16} /> Uploaded!</>
                ) : uploading ? (
                  <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Uploading...</>
                ) : (
                  <><Upload size={16} /> Upload Photo</>
                )}
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
      
      <LocationPickerModal
        isOpen={showMapPicker}
        onClose={() => setShowMapPicker(false)}
        initialLocation={form.location}
        initialCoordinates={form.coordinates}
        onSelect={({ location, coordinates }) => {
          setForm(prev => ({ ...prev, location, coordinates }));
        }}
      />
    </AnimatePresence>
  );
}
