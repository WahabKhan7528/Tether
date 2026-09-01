import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../api/axios';
import { motion, AnimatePresence } from 'framer-motion';
import { BookHeart, Send, Lock, Unlock, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';

export default function PromptTab({ partnerName }) {
  const queryClient = useQueryClient();
  const [answerText, setAnswerText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['prompt', 'today'],
    queryFn: async () => {
      const res = await api.get('/prompts/today');
      return res.data.success ? res.data.data : null;
    }
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!answerText.trim()) return;
    
    setIsSubmitting(true);
    try {
      await api.post('/prompts/today', { answerText });
      toast.success('Answer submitted!');
      queryClient.invalidateQueries(['prompt', 'today']);
      setAnswerText('');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to submit answer');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return <div className="min-h-[50vh] flex items-center justify-center">Loading prompt...</div>;
  }

  if (!data) {
    return <div className="min-h-[50vh] flex items-center justify-center">No prompt available today.</div>;
  }

  const { prompt, myAnswer, partnerAnswer } = data;
  const bothAnswered = myAnswer && partnerAnswer && !partnerAnswer.hidden;

  return (
    <div className="w-full min-h-[60vh] flex flex-col items-center">
      <div className="relative mb-12 flex flex-col items-center mt-2 w-full max-w-2xl text-center mx-auto">
        {/* Ambient Glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md h-32 bg-ethereal-primary/10 blur-[50px] rounded-full pointer-events-none z-0"></div>
        
        <div className="relative z-10 flex flex-col items-center">
          <div className="flex items-center justify-center gap-4 mb-3">
             <div className="w-8 md:w-16 h-[1px] bg-gradient-to-r from-transparent to-ethereal-primary/60"></div>
             <span className="text-[10px] md:text-xs uppercase tracking-[0.4em] text-ethereal-primary font-bold">Reflections</span>
             <div className="w-8 md:w-16 h-[1px] bg-gradient-to-l from-transparent to-ethereal-primary/60"></div>
          </div>
          
          <h2 className="text-4xl md:text-5xl font-heading text-ethereal-tertiary mb-6 drop-shadow-sm leading-tight">
            Daily Prompt
          </h2>
          
          <div className="inline-flex items-center gap-2 bg-ethereal-surface-dim/80 backdrop-blur-md border border-ethereal-primary/30 px-6 py-2.5 rounded-full shadow-[0_5px_15px_rgba(0,0,0,0.05)]">
            <BookHeart size={14} className="text-ethereal-primary" />
            <p className="text-sm text-ethereal-tertiary/80 font-medium tracking-wide">
              Answer to reveal {partnerName}'s response.
            </p>
          </div>
        </div>
      </div>

      <div className="w-full max-w-3xl flex flex-col gap-8">
        {/* The Prompt Card */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-ethereal-surface border border-ethereal-primary/40 rounded-[2rem] p-8 sm:p-12 shadow-ambient text-center relative overflow-hidden"
        >
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-1 bg-gradient-to-r from-transparent via-ethereal-primary to-transparent opacity-50"></div>
          
          <div className="w-16 h-16 rounded-full bg-ethereal-primary/10 flex items-center justify-center mx-auto mb-6 text-ethereal-primary">
            <BookHeart size={32} strokeWidth={1.5} />
          </div>
          
          <h3 className="text-2xl sm:text-3xl font-heading text-ethereal-tertiary leading-snug mb-2">
            "{prompt.text}"
          </h3>
          <span className="text-[10px] uppercase tracking-widest text-ethereal-tertiary/40 font-bold">
            {new Date(prompt.dateString).toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}
          </span>
        </motion.div>

        {/* Answers Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
          
          {/* My Answer */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-ethereal-surface-dim border border-ethereal-outline rounded-[2rem] p-6 sm:p-8 flex flex-col h-full relative group"
          >
            <div className="flex justify-between items-center mb-6">
              <span className="text-xs uppercase tracking-widest text-ethereal-primary font-bold">You</span>
              {myAnswer && <CheckCircle size={18} className="text-green-400" />}
            </div>
            
            {myAnswer ? (
              <div className="flex-1 flex flex-col justify-center">
                <p className="text-ethereal-tertiary text-lg font-medium leading-relaxed italic border-l-2 border-ethereal-primary/30 pl-4">
                  {myAnswer.text}
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="flex-1 flex flex-col h-full">
                <textarea 
                  className="w-full flex-1 min-h-[120px] bg-transparent border border-ethereal-outline rounded-xl p-4 text-ethereal-tertiary focus:border-ethereal-primary outline-none transition-colors resize-none placeholder:text-ethereal-tertiary/30"
                  placeholder="Type your answer here..."
                  value={answerText}
                  onChange={(e) => setAnswerText(e.target.value)}
                  maxLength={500}
                ></textarea>
                <button 
                  type="submit"
                  disabled={!answerText.trim() || isSubmitting}
                  className="mt-4 btn-primary py-3 px-6 text-sm flex items-center justify-center gap-2 disabled:opacity-50 w-full"
                >
                  {isSubmitting ? 'Sending...' : (
                    <>Send <Send size={16} /></>
                  )}
                </button>
              </form>
            )}
          </motion.div>

          {/* Partner Answer */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className={`bg-ethereal-surface-dim border rounded-[2rem] p-6 sm:p-8 flex flex-col h-full relative transition-colors ${
              bothAnswered ? 'border-ethereal-primary/40 shadow-ambient' : 'border-ethereal-outline'
            }`}
          >
             <div className="flex justify-between items-center mb-6">
              <span className={`text-xs uppercase tracking-widest font-bold ${bothAnswered ? 'text-ethereal-primary' : 'text-ethereal-tertiary/50'}`}>
                {partnerName}
              </span>
              {!partnerAnswer ? (
                <div className="text-xs text-ethereal-tertiary/40">Waiting...</div>
              ) : bothAnswered ? (
                <Unlock size={18} className="text-ethereal-primary" />
              ) : (
                <Lock size={18} className="text-ethereal-tertiary/40" />
              )}
            </div>

            <div className="flex-1 flex flex-col justify-center items-center text-center">
              {!partnerAnswer ? (
                <>
                  <div className="w-12 h-12 rounded-full border border-dashed border-ethereal-outline flex items-center justify-center mb-4 text-ethereal-tertiary/30">
                    <BookHeart size={20} />
                  </div>
                  <p className="text-sm text-ethereal-tertiary/50 italic">
                    {partnerName} hasn't answered yet.
                  </p>
                </>
              ) : !bothAnswered ? (
                <>
                  <div className="w-12 h-12 rounded-full bg-ethereal-surface border border-ethereal-outline flex items-center justify-center mb-4 text-ethereal-tertiary/50">
                    <Lock size={20} />
                  </div>
                  <p className="text-sm text-ethereal-tertiary/50 italic px-4">
                    {partnerName} has answered! Submit your answer to see it.
                  </p>
                </>
              ) : (
                <p className="text-ethereal-tertiary text-lg font-medium leading-relaxed italic border-r-2 border-ethereal-primary/30 pr-4 w-full text-right">
                  {partnerAnswer.text}
                </p>
              )}
            </div>
          </motion.div>

        </div>
      </div>
    </div>
  );
}
