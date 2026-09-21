import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import LoadingSpinner from '../components/LoadingSpinner';
import { useParams, useNavigate, Link } from 'react-router-dom';
import BottomNav from '../components/BottomNav';
import LetterRenderer from '../components/letters/LetterRenderer';
import { ArrowLeft, Edit2, Trash2 } from 'lucide-react';
import { motion } from 'framer-motion';
import api from '../api/axios';
import ConfirmationModal from '../components/ui/ConfirmationModal';
import { toast } from 'react-hot-toast';
import { useSocket } from '../context/SocketContext';

export default function LetterDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const socket = useSocket();
  const [isDeleting, setIsDeleting] = useState(false);

  const { data: letter, isLoading: loading, isError } = useQuery({
    queryKey: ['letter', id],
    queryFn: async () => {
      const res = await api.get(`/letters/${id}`);
      return res.data.success ? res.data.data : null;
    }
  });

  const deleteMutation = useMutation({
    mutationFn: () => api.delete(`/letters/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['letters'] });
      if (socket) socket.emit('content_updated');
      toast.success('Letter deleted successfully');
      navigate('/letters');
    },
    onError: () => {
      toast.error('Error deleting letter');
      setIsDeleting(false);
    }
  });

  if (isError) {
    navigate('/letters');
    return null;
  }

  const handleDelete = () => {
    setIsDeleting(true);
  };

  const confirmDelete = () => {
    deleteMutation.mutate();
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center"><LoadingSpinner size="lg" /></div>;
  if (!letter) return <div className="min-h-screen flex items-center justify-center">Letter not found</div>;

  return (
    <div className="min-h-screen pb-24 md:pb-8 bg-ethereal-background">
      
      <div className="max-w-5xl mx-auto pt-24 md:pt-32 px-4 md:pl-28 md:pr-8 mb-8">
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex justify-between items-center"
        >
          <Link to="/letters" className="inline-flex items-center gap-2 text-ethereal-tertiary/70 hover:text-ethereal-primary transition-colors">
            <ArrowLeft size={18} />
            <span>Back to Letters</span>
          </Link>
          
          <div className="flex items-center gap-3">
            <Link 
              to={`/letters/${id}/edit`}
              className="w-10 h-10 rounded-full flex items-center justify-center bg-ethereal-surface-dim border border-ethereal-outline text-ethereal-tertiary hover:text-ethereal-primary transition-colors"
            >
              <Edit2 size={16} />
            </Link>
            <button 
              onClick={handleDelete}
              className="w-10 h-10 rounded-full flex items-center justify-center bg-ethereal-surface-dim border border-ethereal-outline text-red-400/70 hover:text-red-500 transition-colors"
            >
              <Trash2 size={16} />
            </button>
          </div>
        </motion.div>
      </div>

      <div className="max-w-5xl mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <LetterRenderer templateId={letter.templateId} letter={letter} />
        </motion.div>
      </div>

      <ConfirmationModal
        isOpen={isDeleting}
        onClose={() => setIsDeleting(false)}
        onConfirm={confirmDelete}
        title="Delete Letter"
        message="Are you sure you want to delete this letter? This action cannot be undone."
        confirmText="Delete Letter"
      />

      <BottomNav />
    </div>
  );
}
