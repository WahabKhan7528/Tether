import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import GalleryGrid from './GalleryGrid';

import api from '../../api/axios';

export default function GalleryPicker({ onSelect, onCancel, selectedImages = [], multiSelect = true }) {
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selection, setSelection] = useState(selectedImages); // Array of _ids
  
  useEffect(() => {
    fetchGallery();
  }, []);

  const fetchGallery = async () => {
    try {
      setLoading(true);
      const res = await api.get('/gallery');
      const data = res.data;
      if (data.success) {
        setImages(data.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const toggleSelection = (id) => {
    if (multiSelect) {
      setSelection(prev => 
        prev.includes(id) ? prev.filter(imgId => imgId !== id) : [...prev, id]
      );
    } else {
      setSelection([id]);
    }
  };

  const handleConfirm = () => {
    // Return full image objects based on selected IDs, preserving order of selection
    const selectedObjects = selection.map(id => images.find(img => img._id === id)).filter(Boolean);
    onSelect(selectedObjects);
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] bg-ethereal-surface/90 backdrop-blur-md flex flex-col"
      >
        <div className="flex-1 overflow-y-auto px-4 py-6 sm:p-8">
          <div className="max-w-5xl mx-auto pb-24">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-2xl font-heading text-ethereal-tertiary">Choose Photos</h2>
                <p className="text-sm text-ethereal-tertiary/60">Select photos from your shared gallery</p>
              </div>
              <button 
                onClick={onCancel}
                className="px-4 py-2 text-ethereal-tertiary/70 hover:text-ethereal-primary transition-colors"
              >
                Cancel
              </button>
            </div>
            
            {loading ? (
              <div className="flex justify-center items-center h-64">
                <div className="w-8 h-8 rounded-full border-2 border-ethereal-primary border-t-transparent animate-spin"></div>
              </div>
            ) : images.length === 0 ? (
              <div className="text-center text-ethereal-tertiary/50 py-12">
                Your gallery is empty.
              </div>
            ) : (
              <GalleryGrid 
                images={images} 
                selectable={true} 
                selectedIds={selection} 
                onToggleSelect={toggleSelection} 
              />
            )}
          </div>
        </div>

        {/* Bottom bar */}
        <div className="fixed bottom-0 left-0 right-0 bg-ethereal-surface-dim border-t border-ethereal-outline p-4 sm:px-8">
          <div className="max-w-5xl mx-auto flex justify-between items-center">
            <div className="text-ethereal-tertiary text-sm">
              {selection.length} photo{selection.length !== 1 ? 's' : ''} selected
            </div>
            <div className="flex gap-4">
              <button 
                onClick={onCancel}
                className="px-6 py-2 rounded-full border border-ethereal-outline text-ethereal-tertiary hover:bg-ethereal-surface transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={handleConfirm}
                className="px-6 py-2 rounded-full bg-ethereal-primary text-white font-medium hover:bg-ethereal-primary/90 transition-colors shadow-lg"
              >
                Add {selection.length > 0 ? selection.length : ''} Photos
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
