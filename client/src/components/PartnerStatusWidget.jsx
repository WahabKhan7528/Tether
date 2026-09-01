import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Smile, Frown } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import api from '../api/axios';
import toast from 'react-hot-toast';

const MOODS = [
  { id: 'happy', label: 'Happy', icon: Smile, color: 'text-green-500' },
  { id: 'sad', label: 'Sad', icon: Frown, color: 'text-red-500' }
];

export default function PartnerStatusWidget({ partnerName, initialPartnerStatus }) {
  const { user, setUser } = useAuth();
  const socket = useSocket();
  const [partnerStatus, setPartnerStatus] = useState(initialPartnerStatus || 'happy');
  const [isSelecting, setIsSelecting] = useState(false);
  
  // Real-time listener for partner status changes
  useEffect(() => {
    if (!socket) return;
    
    const handleStatusChanged = (data) => {
      setPartnerStatus(data.status);
    };
    
    socket.on('partner_status_changed', handleStatusChanged);
    return () => socket.off('partner_status_changed', handleStatusChanged);
  }, [socket]);
  
  // Also sync when props change (e.g. from react-query refetch)
  useEffect(() => {
    if (initialPartnerStatus) setPartnerStatus(initialPartnerStatus);
  }, [initialPartnerStatus]);

  const handleSetMood = async (moodId) => {
    setIsSelecting(false);
    if (user.currentStatus === moodId) return;
    
    // Optimistic update
    const previousStatus = user.currentStatus;
    setUser({ ...user, currentStatus: moodId });
    
    try {
      await api.patch('/auth/me', { currentStatus: moodId });
      // Emit to partner
      if (socket) {
        socket.emit('status_update', { status: moodId });
      }
      toast.success('Mood updated');
    } catch (error) {
      setUser({ ...user, currentStatus: previousStatus });
      toast.error('Failed to update mood');
    }
  };

  const currentPartnerMood = MOODS.find(m => m.id === partnerStatus) || MOODS[0];
  const myMood = MOODS.find(m => m.id === user?.currentStatus) || MOODS[0];

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
      className="flex flex-col items-center justify-center mt-4 w-full"
    >
      <div className="flex flex-col sm:flex-row items-center gap-6 bg-ethereal-surface-dim/80 backdrop-blur-md border border-ethereal-outline/50 p-3 sm:px-6 sm:py-4 rounded-[2rem] shadow-ambient transition-all hover:border-ethereal-outline/80">
        
        {/* Partner's Mood */}
        <div className="flex flex-col items-center gap-1.5 px-4 sm:border-r border-ethereal-outline/50">
          <span className="text-[10px] font-bold uppercase tracking-widest text-ethereal-tertiary/40">
            {partnerName}'s Mood
          </span>
          <div className="flex items-center gap-2">
            <currentPartnerMood.icon size={18} className={currentPartnerMood.color} />
            <span className="text-sm font-medium tracking-wider uppercase text-ethereal-tertiary">
              {currentPartnerMood.label}
            </span>
          </div>
        </div>

        {/* My Mood Selector */}
        <div className="flex flex-col items-center gap-1.5 px-4 relative">
          <span className="text-[10px] font-bold uppercase tracking-widest text-ethereal-tertiary/40">
            My Mood
          </span>
          
          <button 
            onClick={() => setIsSelecting(!isSelecting)}
            className="flex items-center gap-2 hover:bg-ethereal-surface p-1 -m-1 rounded-xl transition-colors"
          >
            <myMood.icon size={18} className={myMood.color} />
            <span className="text-sm font-medium tracking-wider uppercase text-ethereal-tertiary">
              {myMood.label}
            </span>
          </button>

          <AnimatePresence>
            {isSelecting && (
              <>
                <motion.div 
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="fixed inset-0 z-40" 
                  onClick={() => setIsSelecting(false)} 
                />
                  <motion.div 
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  className="absolute top-full mt-3 left-1/2 -translate-x-1/2 bg-ethereal-surface border border-ethereal-primary/30 p-2 rounded-2xl shadow-xl z-50 flex gap-2 backdrop-blur-md min-w-max"
                >
                  {MOODS.map(mood => (
                    <button
                      key={mood.id}
                      onClick={() => handleSetMood(mood.id)}
                      className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all ${
                        user?.currentStatus === mood.id 
                          ? 'bg-ethereal-primary/10 border border-ethereal-primary/30 shadow-sm' 
                          : 'hover:bg-ethereal-surface-dim'
                      }`}
                    >
                      <mood.icon size={18} className={mood.color} />
                      <span className="text-xs uppercase font-bold tracking-wider text-ethereal-tertiary/80">{mood.label}</span>
                    </button>
                  ))}
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>

      </div>
    </motion.div>
  );
}
