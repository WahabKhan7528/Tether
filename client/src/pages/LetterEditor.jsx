import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import BottomNav from '../components/BottomNav';
import GalleryPicker from '../components/gallery/GalleryPicker';
import LetterRenderer from '../components/letters/LetterRenderer';
import { motion, AnimatePresence } from 'framer-motion';
import { Save, ImagePlus, Eye, Edit2, X, ArrowLeft, ArrowRight } from 'lucide-react';
import api from '../api/axios';
import ConfirmationModal from '../components/ui/ConfirmationModal';
import { toast } from 'react-hot-toast';
import { useSocket } from '../context/SocketContext';

const TEMPLATES = [
  { id: 'classic', label: 'Classic', desc: 'Elegant and centered' },
  { id: 'minimal', label: 'Minimal', desc: 'Modern with strong typography' },
  { id: 'scrapbook', label: 'Scrapbook', desc: 'Playful layered composition' },
  { id: 'elegant', label: 'Elegant', desc: 'Luxurious and refined with delicate borders' },
  { id: 'vintage', label: 'Vintage', desc: 'Nostalgic journal entry with a sepia touch' },
];

const PALETTES = [
  { id: 'default', label: 'Default', colors: ['#A57B5A', '#F4E1D2'] },
  { id: 'monochrome', label: 'Monochrome', colors: ['#2A2A2A', '#F5F5F5'] },
  { id: 'ocean', label: 'Ocean', colors: ['#2B4C59', '#E0F2F1'] },
  { id: 'sunset', label: 'Sunset', colors: ['#D96C4A', '#FDF2E9'] },
  { id: 'forest', label: 'Forest', colors: ['#3A5A40', '#DAD7CD'] },
  { id: 'royal', label: 'Royal', colors: ['#4A3B52', '#F4F1DE'] },
];

export default function LetterEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const socket = useSocket();

  const typingTimeoutRef = useRef(null);
  const isTypingRef = useRef(false);

  const [isEditing, setIsEditing] = useState(!!id);
  const [isPreview, setIsPreview] = useState(false);
  const [loading, setLoading] = useState(!!id);
  const [saving, setSaving] = useState(false);

  const [showPicker, setShowPicker] = useState(false);

  const [title, setTitle] = useState('');
  const [templateId, setTemplateId] = useState('classic');
  const [palette, setPalette] = useState('default');
  const [greeting, setGreeting] = useState('');
  const [body, setBody] = useState('');
  const [closing, setClosing] = useState('');
  const [images, setImages] = useState([]);
  const [imageToRemove, setImageToRemove] = useState(null);

  useEffect(() => {
    if (id) {
      fetchLetter();
    }
  }, [id]);

  useEffect(() => {
    if (!socket || !body) return;
    
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    if (!isTypingRef.current) {
      isTypingRef.current = true;
      socket.emit('typing_letter_start');
    }

    typingTimeoutRef.current = setTimeout(() => {
      isTypingRef.current = false;
      socket.emit('typing_letter_stop');
    }, 2000);

    return () => {
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    };
  }, [body, socket]);

  useEffect(() => {
    return () => {
      if (isTypingRef.current && socket) {
        socket.emit('typing_letter_stop');
      }
    };
  }, [socket]);

  const fetchLetter = async () => {
    try {
      const res = await api.get(`/letters/${id}`);
      const data = res.data;
      if (data.success) {
        setTitle(data.data.title);
        setTemplateId(data.data.templateId || 'classic');
        setPalette(data.data.palette || 'default');
        setGreeting(data.data.content.greeting);
        setBody(data.data.content.body);
        setClosing(data.data.content.closing);
        setImages(data.data.images || []);
      } else {
        navigate('/letters');
      }
    } catch (err) {
      console.error(err);
      navigate('/letters');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!title.trim()) {
      toast.error("Please enter a title");
      return;
    }

    try {
      setSaving(true);

      const payload = {
        title,
        templateId,
        palette,
        content: { greeting, body, closing },
        images: images.map((img, idx) => ({ ...img, order: idx }))
      };

      const url = id ? `/letters/${id}` : '/letters';
      const method = id ? 'PATCH' : 'POST';

      const res = await api({
        method,
        url,
        data: payload
      });

      const data = res.data;

      if (data.success) {
        await queryClient.invalidateQueries({ queryKey: ['letters'] });
        if (id) {
          await queryClient.invalidateQueries({ queryKey: ['letter', id] });
        }
        if (socket) socket.emit('content_updated');
        toast.success(id ? 'Letter updated successfully' : 'Letter saved successfully');
        navigate(`/letters/${data.data._id}`);
      } else {
        toast.error(data.message || 'Error saving letter');
      }
    } catch (err) {
      toast.error('Network error while saving letter');
    } finally {
      setSaving(false);
    }
  };

  const handleImagesSelected = (selected) => {
    setShowPicker(false);

    // We only want to add new ones or just replace? The picker returns ALL selected.
    // If our picker supports pre-selection, we can just replace.
    // Let's replace since our picker component returns all selected objects.
    setImages(selected);
  };

  const moveImage = (index, dir) => {
    const newIdx = index + dir;
    if (newIdx < 0 || newIdx >= images.length) return;

    const newImages = [...images];
    const temp = newImages[index];
    newImages[index] = newImages[newIdx];
    newImages[newIdx] = temp;
    setImages(newImages);
  };

  const removeImage = (index) => {
    setImageToRemove(index);
  };

  const confirmRemoveImage = () => {
    if (imageToRemove !== null) {
      setImages(images.filter((_, i) => i !== imageToRemove));
      setImageToRemove(null);
    }
  };

  const previewLetterObject = {
    title: title || 'Untitled Letter',
    content: { greeting, body, closing },
    images,
    createdAt: new Date().toISOString(),
    palette
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className="min-h-screen pb-24 md:pb-8 bg-ethereal-background">

      <div className="max-w-5xl mx-auto pt-24 md:pt-32 px-4 md:pl-28 md:pr-8">

        {/* Header Actions */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
          <div>
            <h1 className="font-heading text-3xl font-semibold text-ethereal-tertiary">
              {id ? 'Edit Letter' : 'New Letter'}
            </h1>
          </div>
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              onClick={() => setIsPreview(!isPreview)}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-2.5 rounded-full border border-ethereal-outline text-ethereal-tertiary hover:bg-ethereal-surface transition-colors font-medium"
            >
              {isPreview ? <Edit2 size={18} /> : <Eye size={18} />}
              <span>{isPreview ? 'Edit' : 'Preview'}</span>
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-2.5 rounded-full bg-ethereal-primary text-white hover:bg-ethereal-primary/90 transition-colors font-medium shadow-md shadow-ethereal-primary/20 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              <Save size={18} />
              {saving ? 'Saving...' : 'Save Letter'}
            </button>
          </div>
        </div>

        {isPreview ? (
          <div className="my-12">
            <LetterRenderer templateId={templateId} letter={previewLetterObject} />
          </div>
        ) : (
          <div className="flex flex-col gap-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

              {/* Main Editor */}
              <div className="lg:col-span-8 flex flex-col gap-6">

                {/* Content Card */}
                <div className="bg-ethereal-surface-dim/80 backdrop-blur-xl p-8 md:p-12 rounded-[2.5rem] border border-ethereal-outline/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.2)] transition-all duration-300 hover:shadow-[0_8px_40px_rgb(0,0,0,0.08)]">

                  <input
                    type="text"
                    placeholder="Letter Title..."
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    className="w-full bg-transparent text-2xl md:text-3xl font-heading font-semibold text-ethereal-tertiary placeholder:text-ethereal-tertiary/30 outline-none mb-8 pb-4 border-b border-ethereal-outline/30 focus:border-ethereal-primary/60 transition-colors"
                  />

                  <div className="flex flex-col gap-6">
                    <div className="group">
                      <label className="block text-sm font-medium text-ethereal-tertiary/70 mb-2 group-focus-within:text-ethereal-primary transition-colors">Greeting</label>
                      <input
                        type="text"
                        placeholder="Dear..."
                        value={greeting}
                        onChange={e => setGreeting(e.target.value)}
                        className="w-full bg-ethereal-surface/50 border border-ethereal-outline/50 rounded-xl p-4 text-ethereal-tertiary outline-none focus:bg-ethereal-surface focus:border-ethereal-primary/60 focus:ring-4 focus:ring-ethereal-primary/5 transition-all shadow-sm"
                      />
                    </div>

                    <div className="group">
                      <label className="block text-sm font-medium text-ethereal-tertiary/70 mb-2 group-focus-within:text-ethereal-primary transition-colors">Body</label>
                      <textarea
                        placeholder="Write your letter..."
                        value={body}
                        onChange={e => setBody(e.target.value)}
                        rows={12}
                        className="w-full bg-ethereal-surface/50 border border-ethereal-outline/50 rounded-xl p-4 text-ethereal-tertiary outline-none focus:bg-ethereal-surface focus:border-ethereal-primary/60 focus:ring-4 focus:ring-ethereal-primary/5 transition-all resize-none leading-relaxed shadow-sm"
                      />
                    </div>

                    <div className="group">
                      <label className="block text-sm font-medium text-ethereal-tertiary/70 mb-2 group-focus-within:text-ethereal-primary transition-colors text-right">Closing</label>
                      <input
                        type="text"
                        placeholder="With love..."
                        value={closing}
                        onChange={e => setClosing(e.target.value)}
                        className="w-full bg-ethereal-surface/50 border border-ethereal-outline/50 rounded-xl p-4 text-ethereal-tertiary outline-none focus:bg-ethereal-surface focus:border-ethereal-primary/60 focus:ring-4 focus:ring-ethereal-primary/5 transition-all text-right shadow-sm"
                      />
                    </div>
                  </div>
                </div>

              </div>

              {/* Sidebar (Template & Photos) */}
              <div className="lg:col-span-4 flex flex-col gap-6">

                {/* Templates */}
                <div className="bg-ethereal-surface-dim/80 backdrop-blur-xl p-6 rounded-[2rem] border border-ethereal-outline/60 shadow-lg relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-ethereal-primary/5 rounded-full blur-3xl pointer-events-none" />
                  <h3 className="text-lg font-medium text-ethereal-tertiary mb-4">Template</h3>
                  <div className="flex flex-col gap-3">
                    {TEMPLATES.map(t => (
                      <button
                        key={t.id}
                        onClick={() => setTemplateId(t.id)}
                        className={`text-left p-4 rounded-xl border transition-all duration-300 group ${templateId === t.id
                            ? 'border-ethereal-primary bg-ethereal-primary/5 shadow-md shadow-ethereal-primary/5 scale-[1.02]'
                            : 'border-ethereal-outline/50 bg-ethereal-surface/30 hover:border-ethereal-primary/30 hover:bg-ethereal-surface hover:shadow-sm'
                          }`}
                      >
                        <div className="font-medium text-ethereal-tertiary mb-1">{t.label}</div>
                        <div className="text-xs text-ethereal-tertiary/60">{t.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Photos */}
                <div className="bg-ethereal-surface-dim/80 backdrop-blur-xl p-6 rounded-[2rem] border border-ethereal-outline/60 shadow-lg">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-medium text-ethereal-tertiary">Photos</h3>
                    <button
                      onClick={() => setShowPicker(true)}
                      className="text-ethereal-primary text-sm font-medium flex items-center gap-1 hover:underline"
                    >
                      <ImagePlus size={16} /> Add
                    </button>
                  </div>

                  {images.length === 0 ? (
                    <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-ethereal-outline/40 rounded-2xl bg-ethereal-surface/30">
                      <div className="w-10 h-10 rounded-full bg-ethereal-outline/20 flex items-center justify-center mb-3">
                        <ImagePlus size={18} className="text-ethereal-tertiary/40" />
                      </div>
                      <p className="text-sm font-medium text-ethereal-tertiary/50">No memories attached</p>
                      <p className="text-xs text-ethereal-tertiary/40 mt-1">Add photos to enhance your letter</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-3">
                      {images.map((img, i) => (
                        <div key={i} className="group relative aspect-square rounded-xl overflow-hidden border border-ethereal-outline/50 shadow-sm">
                          <img src={img.url} alt="thumbnail" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />

                          {/* Overlay Controls */}
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-between p-2">
                            <button
                              onClick={() => removeImage(i)}
                              className="self-end p-1.5 bg-black/50 hover:bg-red-500/80 text-white rounded-full backdrop-blur-md transition-colors"
                            >
                              <X size={14} />
                            </button>

                            <div className="flex justify-between gap-1">
                              <button
                                onClick={() => moveImage(i, -1)}
                                disabled={i === 0}
                                className="p-1.5 bg-black/50 text-white rounded-full backdrop-blur-md hover:bg-black/70 disabled:opacity-0 transition-all"
                              >
                                <ArrowLeft size={14} />
                              </button>
                              <button
                                onClick={() => moveImage(i, 1)}
                                disabled={i === images.length - 1}
                                className="p-1.5 bg-black/50 text-white rounded-full backdrop-blur-md hover:bg-black/70 disabled:opacity-0 transition-all"
                              >
                                <ArrowRight size={14} />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Color Palette (Full Width) */}
            <div className="bg-ethereal-surface-dim/80 backdrop-blur-xl p-8 rounded-[2.5rem] border border-ethereal-outline/60 shadow-lg w-full mb-8">
              <div className="flex flex-col md:flex-row md:items-center gap-6">
                <div className="shrink-0">
                  <h3 className="text-lg font-medium text-ethereal-tertiary mb-1">Color Theme</h3>
                  <p className="text-sm text-ethereal-tertiary/50">Choose a palette for your letter</p>
                </div>
                <div className="w-px h-12 bg-ethereal-outline/50 hidden md:block" />
                <div className="flex flex-wrap items-center gap-4 flex-1">
                  {PALETTES.map(p => (
                    <button
                      key={p.id}
                      onClick={() => setPalette(p.id)}
                      title={p.label}
                      className={`flex items-center gap-3 px-2 py-2 pr-5 rounded-full border transition-all duration-300 ${palette === p.id
                          ? 'border-ethereal-primary bg-ethereal-primary/5 shadow-md shadow-ethereal-primary/10'
                          : 'border-transparent hover:bg-ethereal-surface/50 hover:border-ethereal-outline/50'
                        }`}
                    >
                      <div className={`w-10 h-10 rounded-full flex overflow-hidden border-[2px] transition-all duration-300 ${palette === p.id ? 'border-ethereal-primary ring-2 ring-ethereal-primary/10' : 'border-transparent'
                        }`}>
                        <span className="flex-1 h-full" style={{ backgroundColor: p.colors[0] }} />
                        <span className="flex-1 h-full" style={{ backgroundColor: p.colors[1] }} />
                      </div>
                      <span className={`text-sm font-medium ${palette === p.id ? 'text-ethereal-primary' : 'text-ethereal-tertiary'}`}>
                        {p.label}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {showPicker && (
        <GalleryPicker
          selectedImages={images.map(img => img._id || img.imageId)}
          onSelect={handleImagesSelected}
          onCancel={() => setShowPicker(false)}
        />
      )}

      <ConfirmationModal
        isOpen={imageToRemove !== null}
        onClose={() => setImageToRemove(null)}
        onConfirm={confirmRemoveImage}
        title="Remove Photo"
        message="Are you sure you want to remove this photo from the letter?"
        confirmText="Remove"
      />

      <BottomNav />
    </div>
  );
}
