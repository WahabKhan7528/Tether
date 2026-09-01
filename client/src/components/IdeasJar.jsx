import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Plus, Trash2, HelpCircle } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import api from '../api/axios';
import toast from 'react-hot-toast';

export default function IdeasJar({ couple }) {
  const queryClient = useQueryClient();
  const [isAdding, setIsAdding] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [pickedIdea, setPickedIdea] = useState(null);
  const [isPicking, setIsPicking] = useState(false);
  const [isShuffling, setIsShuffling] = useState(false);

  const dateIdeas = couple?.dateIdeas || [];

  const handleAddIdea = async (e) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    try {
      await api.post('/couples/me/date-ideas', {
        title: newTitle,
        description: newDescription
      });
      queryClient.invalidateQueries(['couple', 'me']);
      setNewTitle('');
      setNewDescription('');
      setIsAdding(false);
      toast.success('Idea added to the jar!');
    } catch (error) {
      toast.error('Failed to add idea');
    }
  };

  const handleDeleteIdea = async (id) => {
    try {
      await api.delete(`/couples/me/date-ideas/${id}`);
      queryClient.invalidateQueries(['couple', 'me']);
      toast.success('Idea removed');
      if (pickedIdea && pickedIdea._id === id) {
        setPickedIdea(null);
      }
    } catch (error) {
      toast.error('Failed to remove idea');
    }
  };

  const handlePickRandom = () => {
    if (dateIdeas.length === 0) {
      toast.error('The jar is empty!');
      return;
    }
    
    setIsPicking(true);
    setPickedIdea(null);
    
    // Simulate shaking/picking animation
    setTimeout(() => {
      const randomIndex = Math.floor(Math.random() * dateIdeas.length);
      setPickedIdea(dateIdeas[randomIndex]);
      setIsPicking(false);
    }, 1500);
  };

  const handleShuffle = () => {
    if (dateIdeas.length === 0) return;
    setIsShuffling(true);
    setTimeout(() => setIsShuffling(false), 1500);
  };

  return (
    <div className="max-w-5xl mx-auto min-h-[60vh] flex flex-col relative py-4">
      {/* Premium Heading */}
      <div className="relative mb-12 flex flex-col items-center mt-2 w-full max-w-2xl text-center mx-auto">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md h-32 bg-ethereal-primary/10 blur-[50px] rounded-full pointer-events-none z-0"></div>
        
        <div className="relative z-10 flex flex-col items-center">
          <div className="flex items-center justify-center gap-4 mb-3">
             <div className="w-8 md:w-16 h-[1px] bg-gradient-to-r from-transparent to-ethereal-primary/60"></div>
             <span className="text-[10px] md:text-xs uppercase tracking-[0.4em] text-ethereal-primary font-bold">Adventures</span>
             <div className="w-8 md:w-16 h-[1px] bg-gradient-to-l from-transparent to-ethereal-primary/60"></div>
          </div>
          
          <h2 className="text-4xl md:text-5xl font-heading text-ethereal-tertiary mb-6 drop-shadow-sm leading-tight">
            Ideas Jar
          </h2>
          
          <div className="inline-flex items-center gap-2 bg-ethereal-surface-dim/80 backdrop-blur-md border border-ethereal-primary/30 px-6 py-2.5 rounded-full shadow-[0_5px_15px_rgba(0,0,0,0.05)]">
            <Sparkles size={14} className="text-ethereal-primary" />
            <p className="text-sm text-ethereal-tertiary/80 font-medium tracking-wide">
              A collection of things we want to do together.
            </p>
          </div>
        </div>
      </div>

      <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-12 relative z-10 flex-1">
        {/* Left Side: The Jar & Picker */}
        <div className="flex flex-col items-center justify-center border border-ethereal-outline/40 bg-ethereal-surface-dim/40 backdrop-blur-xl p-8 rounded-[3rem] shadow-ambient relative overflow-hidden h-full">
          {/* Decorative elements */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-[-10%] right-[-10%] w-72 h-72 bg-ethereal-primary/10 rounded-full blur-3xl"></div>
            <div className="absolute bottom-[-10%] left-[-10%] w-64 h-64 bg-ethereal-primary/10 rounded-full blur-3xl"></div>
          </div>

          <motion.div
            animate={(isShuffling || isPicking) ? { 
               x: [-3, 3, -4, 4, -5, 5, -3, 3, 0],
               rotate: [-2, 2, -3, 3, -4, 4, -2, 2, 0]
            } : {}}
            transition={{ duration: 1.5, ease: "easeInOut" }}
            className="relative mb-10 mt-6 z-10"
          >
            {/* Minimalist Spherical Jar Design */}
            <div className="relative flex flex-col items-center">
              
              {/* Spherical Cork Lid */}
              <div className="w-14 h-14 rounded-full bg-gradient-to-br from-[#E6D5B8] to-[#C2A370] shadow-[inset_-3px_-3px_10px_rgba(0,0,0,0.2),0_5px_10px_rgba(0,0,0,0.1)] z-20 -mb-6 relative overflow-hidden border border-[#B39360]">
                {/* Subtle texture */}
                <div className="absolute inset-0 opacity-10 mix-blend-multiply" style={{ backgroundImage: 'radial-gradient(#5C4033 1px, transparent 1px)', backgroundSize: '3px 3px' }}></div>
              </div>
              
              {/* Neck Ring */}
              <div className="w-20 h-4 rounded-full bg-white/20 backdrop-blur-md border border-white/40 shadow-inner z-10 -mb-2"></div>
              
              {/* Glass Orb Body */}
              <div className="w-64 h-64 relative bg-gradient-to-tr from-ethereal-primary/5 via-transparent to-white/5 backdrop-blur-md border-[1.5px] border-white/30 rounded-full shadow-[inset_0_-20px_50px_rgba(255,255,255,0.1),inset_0_20px_40px_rgba(255,255,255,0.05),0_20px_40px_rgba(0,0,0,0.1)] flex flex-col justify-end overflow-hidden group-hover:border-white/50 group-hover:shadow-[inset_0_-20px_50px_rgba(255,255,255,0.2),0_20px_40px_rgba(var(--color-primary),0.2)] transition-all duration-500">
                
                {/* Elegant Glass Highlight */}
                <div className="absolute top-[10%] left-[15%] w-[70%] h-[80%] rounded-full border-[1.5px] border-l-white/40 border-t-white/40 border-r-transparent border-b-transparent transform rotate-[-45deg] opacity-70"></div>
                
                {/* Soft Bottom Glow */}
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-40 h-16 bg-white/10 rounded-full blur-xl"></div>
                
                {/* The Integrated Label */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 w-36 h-36 border border-white/20 rounded-full flex flex-col items-center justify-center p-4 bg-white/5 backdrop-blur-sm shadow-[inset_0_0_20px_rgba(255,255,255,0.05)] text-center pointer-events-none">
                  <Sparkles size={18} className="text-white/80 mb-2 drop-shadow-sm" />
                  <span className="text-[10px] font-bold uppercase tracking-widest text-white/90 leading-relaxed drop-shadow-sm">
                    For when you can't decide
                  </span>
                </div>

                {dateIdeas.length === 0 ? (
                  <span className="text-ethereal-tertiary/40 font-heading italic tracking-widest uppercase text-sm mb-16 relative z-10 text-center w-full">Empty</span>
                ) : (
                  <div className="flex flex-wrap-reverse gap-2 p-8 justify-center content-start items-end h-full w-full pb-10 z-10 relative">
                    {/* Ideas inside jar */}
                    {dateIdeas.slice(0, 25).map((_, i) => {
                      const colors = [
                        'bg-rose-400/90', 'bg-blue-400/90', 'bg-amber-400/90', 
                        'bg-emerald-400/90', 'bg-purple-400/90', 'bg-cyan-400/90'
                      ];
                      const color = colors[i % colors.length];
                      const rotation = ((i * 37) % 80) - 40;
                      
                      const randomX1 = (Math.random() - 0.5) * 180;
                      const randomY1 = -(Math.random() * 180 + 40);
                      const randomX2 = (Math.random() - 0.5) * 180;
                      const randomY2 = -(Math.random() * 120 + 20);
                      const randomRot = Math.random() * 360 + 180;
                       
                      return (
                        <motion.div 
                          key={i} 
                          className={`w-7 h-5 rounded-[1px] shadow-[1px_1px_4px_rgba(0,0,0,0.2)] ${color} border-l-2 border-white/40 flex items-center justify-center relative z-10`}
                          initial={{ rotate: rotation }}
                          animate={(isShuffling || isPicking) ? {
                            x: [0, randomX1, randomX2, 0],
                            y: [0, randomY1, randomY2, 0],
                            rotate: [rotation, rotation + randomRot, rotation + randomRot + 180, rotation]
                          } : { x: 0, y: 0, rotate: rotation }}
                          transition={
                            (isShuffling || isPicking) 
                            ? { duration: 1.5, ease: "easeInOut", times: [0, 0.4, 0.7, 1] } 
                            : { type: 'spring', stiffness: 150, damping: 15 }
                          }
                        >
                           {/* Fold line */}
                           <div className="w-full h-[1px] bg-black/10 mix-blend-overlay"></div>
                        </motion.div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </motion.div>

          <AnimatePresence mode="wait">
            {pickedIdea ? (
              <motion.div
                initial={{ opacity: 0, y: 20, scale: 0.8 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="bg-ethereal-surface-dim/80 border border-ethereal-primary/40 p-8 rounded-[2rem] shadow-[0_0_40px_rgba(var(--color-primary),0.15)] w-full text-center relative z-20 backdrop-blur-xl"
              >
                <div className="absolute -top-4 -right-4 w-10 h-10 bg-ethereal-primary text-white rounded-full flex items-center justify-center transform rotate-12 shadow-lg">
                  <Sparkles size={18} />
                </div>
                <div className="mb-2 text-ethereal-primary/80 uppercase tracking-widest text-[10px] font-bold">Your Next Date</div>
                <h3 className="text-3xl font-heading text-ethereal-tertiary mb-3 leading-tight">{pickedIdea.title}</h3>
                {pickedIdea.description && (
                  <p className="text-sm text-ethereal-tertiary/70 leading-relaxed max-w-sm mx-auto">{pickedIdea.description}</p>
                )}
                <button 
                  onClick={() => setPickedIdea(null)}
                  className="mt-6 text-xs font-bold uppercase tracking-wider text-ethereal-primary hover:text-ethereal-primary/70 transition-colors border-b border-ethereal-primary/30 pb-0.5"
                >
                  Pick another
                </button>
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-center z-10"
              >
                <div className="flex gap-4 justify-center">
                  <button 
                    onClick={handleShuffle}
                    disabled={isShuffling || isPicking || dateIdeas.length === 0}
                    className="py-3 px-6 text-sm rounded-full bg-ethereal-surface-dim border border-ethereal-outline text-ethereal-tertiary hover:bg-ethereal-surface hover:border-ethereal-primary/30 transition-all shadow-sm disabled:opacity-50"
                  >
                    {isShuffling ? 'Shuffling...' : 'Shuffle Jar'}
                  </button>
                  <button 
                    onClick={handlePickRandom}
                    disabled={isPicking || isShuffling || dateIdeas.length === 0}
                    className="btn-primary py-3 px-8 text-sm disabled:opacity-50 shadow-lg shadow-ethereal-primary/20 hover:shadow-ethereal-primary/40 transition-shadow"
                  >
                    {isPicking ? 'Drawing...' : 'Draw from the Jar!'}
                  </button>
                </div>
                <p className="text-xs text-ethereal-tertiary/50 mt-4 font-medium tracking-wide">{dateIdeas.length} {dateIdeas.length === 1 ? 'idea' : 'ideas'} in the jar</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Right Side: List & Add Form */}
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-2xl font-heading text-ethereal-tertiary">All Ideas</h3>
            <button 
              onClick={() => setIsAdding(!isAdding)}
              className="flex items-center gap-1.5 text-sm font-semibold text-ethereal-primary hover:text-ethereal-tertiary transition-colors bg-ethereal-primary/10 px-4 py-2 rounded-full hover:bg-ethereal-surface-dim"
            >
              <Plus size={16} /> Add New
            </button>
          </div>

          <AnimatePresence>
            {isAdding && (
              <motion.form 
                initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                animate={{ opacity: 1, height: 'auto', marginBottom: 24 }}
                exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                onSubmit={handleAddIdea}
                className="overflow-hidden"
              >
                <div className="bg-ethereal-surface/80 backdrop-blur-md border border-ethereal-primary/30 p-6 rounded-3xl space-y-5 shadow-lg">
                  <div>
                    <input
                      type="text"
                      placeholder="Idea title (e.g., Picnic in the park)"
                      className="w-full bg-transparent border-b border-ethereal-outline/50 pb-2 outline-none focus:border-ethereal-primary text-ethereal-tertiary transition-colors font-medium text-lg placeholder:text-ethereal-tertiary/30"
                      value={newTitle}
                      onChange={(e) => setNewTitle(e.target.value)}
                      maxLength={120}
                      autoFocus
                    />
                  </div>
                  <div>
                    <textarea
                      placeholder="Details (optional)"
                      className="w-full bg-transparent border-b border-ethereal-outline/50 pb-2 outline-none focus:border-ethereal-primary text-ethereal-tertiary transition-colors resize-none text-sm placeholder:text-ethereal-tertiary/30"
                      rows="2"
                      value={newDescription}
                      onChange={(e) => setNewDescription(e.target.value)}
                      maxLength={300}
                    />
                  </div>
                  <div className="flex justify-end gap-4 pt-2">
                    <button 
                      type="button" 
                      onClick={() => setIsAdding(false)}
                      className="text-xs font-bold uppercase tracking-wider text-ethereal-tertiary/50 hover:text-ethereal-tertiary transition-colors"
                    >
                      Cancel
                    </button>
                    <button 
                      type="submit"
                      disabled={!newTitle.trim()}
                      className="px-5 py-2 rounded-full bg-ethereal-primary text-white text-xs font-bold uppercase tracking-wider hover:opacity-90 disabled:opacity-50 transition-opacity shadow-md"
                    >
                      Save Idea
                    </button>
                  </div>
                </div>
              </motion.form>
            )}
          </AnimatePresence>

          <div className="flex-1 overflow-y-auto pr-2 space-y-4 max-h-[400px] scrollbar-thin scrollbar-thumb-ethereal-primary/20">
            {dateIdeas.length === 0 ? (
              <div className="h-40 flex flex-col items-center justify-center text-ethereal-tertiary/40 border-2 border-dashed border-ethereal-outline/50 rounded-3xl bg-ethereal-surface-dim/30">
                <HelpCircle size={28} className="mb-3 opacity-50 text-ethereal-primary" />
                <p className="text-sm font-medium tracking-wide">No ideas yet. Add something fun!</p>
              </div>
            ) : (
              dateIdeas.map((idea) => (
                <div key={idea._id} className="group relative flex justify-between items-start bg-ethereal-surface-dim/60 backdrop-blur-sm border border-ethereal-outline/50 p-5 rounded-3xl hover:border-ethereal-primary/40 hover:shadow-ambient transition-all duration-300">
                  <div className="pr-8">
                    <h4 className="text-base font-semibold text-ethereal-tertiary tracking-wide">{idea.title}</h4>
                    {idea.description && (
                      <p className="text-sm text-ethereal-tertiary/60 mt-2 leading-relaxed line-clamp-2">{idea.description}</p>
                    )}
                  </div>
                  <button 
                    onClick={() => handleDeleteIdea(idea._id)}
                    className="absolute top-5 right-5 text-ethereal-tertiary/30 hover:text-red-500 hover:bg-red-500/10 p-2 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-300"
                    aria-label="Delete idea"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
