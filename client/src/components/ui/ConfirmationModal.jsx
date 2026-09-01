import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, Trash2, X } from 'lucide-react';

export default function ConfirmationModal({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title = "Confirm Action", 
  message = "Are you sure you want to do this?", 
  confirmText = "Confirm",
  cancelText = "Cancel",
  isDanger = true 
}) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[999]"
            onClick={onClose}
          />
          
          {/* Modal content */}
          <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 pointer-events-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-ethereal-surface/80 backdrop-blur-2xl border border-white/10 rounded-3xl p-6 w-full max-w-sm pointer-events-auto shadow-ambient"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-start mb-4">
                <div className={`p-3 rounded-2xl ${isDanger ? 'bg-ethereal-error/20 text-ethereal-error' : 'bg-ethereal-primary/20 text-ethereal-primary'}`}>
                  {isDanger ? <AlertTriangle size={24} /> : <Trash2 size={24} />}
                </div>
                <button 
                  onClick={onClose}
                  className="p-2 hover:bg-white/5 rounded-full transition-colors text-white/50 hover:text-white"
                >
                  <X size={20} />
                </button>
              </div>
              
              <h3 className="text-xl font-heading text-white mb-2">{title}</h3>
              <p className="text-white/70 text-sm mb-6 leading-relaxed">
                {message}
              </p>
              
              <div className="flex gap-3">
                <button
                  onClick={onClose}
                  className="flex-1 py-3 px-4 rounded-xl border border-white/10 text-white hover:bg-white/5 transition-colors font-medium text-sm"
                >
                  {cancelText}
                </button>
                <button
                  onClick={() => {
                    onConfirm();
                    onClose();
                  }}
                  className={`flex-1 py-3 px-4 rounded-xl font-medium text-sm transition-colors ${
                    isDanger 
                      ? 'bg-ethereal-error/20 text-ethereal-error hover:bg-ethereal-error/30 border border-ethereal-error/30' 
                      : 'bg-white text-black hover:bg-white/90'
                  }`}
                >
                  {confirmText}
                </button>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
