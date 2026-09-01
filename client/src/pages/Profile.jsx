import { useState, useRef, useEffect, memo, useCallback } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { updateProfile, updatePartner, changePassword, uploadAvatar } from '../api/profile';
import { updateCouple, addMilestone, deleteMilestone, addBucketListItem, toggleBucketListItem, deleteBucketListItem } from '../api/couples';
import LoadingSpinner from '../components/LoadingSpinner';
import CustomDatePicker from '../components/CustomDatePicker';
import CustomColorPicker from '../components/CustomColorPicker';
import ConfirmationModal from '../components/ui/ConfirmationModal';
import PasswordInput from '../components/ui/PasswordInput';
import { toast } from 'react-hot-toast';
import {
  User, Camera, Edit2, Check, X, Lock, Heart,
  Calendar, Palette, Smile, Shield, Info,
  Activity, Frown, Meh, Settings, Users,
  MapPin, Plus, Trash2, Send, Star,
  ListTodo, HeartHandshake, LogOut
} from 'lucide-react';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(dateStr) {
  if (!dateStr) return null;
  try {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric', month: 'long', day: 'numeric',
    });
  } catch {
    return null;
  }
}

function getAnniversaryCountdown(dateStr) {
  if (!dateStr) return null;
  const anniversary = new Date(dateStr);
  const today = new Date();
  const thisYear = new Date(today.getFullYear(), anniversary.getMonth(), anniversary.getDate());
  const nextAnniversary = thisYear < today
    ? new Date(today.getFullYear() + 1, anniversary.getMonth(), anniversary.getDate())
    : thisYear;
  const diffMs = nextAnniversary - today;
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  return diffDays === 0 ? 'Today!' : `${diffDays} day${diffDays !== 1 ? 's' : ''} away`;
}

function GenderBadge({ gender }) {
  if (!gender) return null;
  const map = { boy: { label: 'Boy' }, girl: { label: 'Girl' } };
  const g = map[gender];
  if (!g) return null;
  return (
    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-ethereal-surface-dim text-ethereal-tertiary">
      {g.label}
    </span>
  );
}

const AvatarPicker = memo(function AvatarPicker({ avatarUrl, name, onUpload, loading }) {
  const inputRef = useRef(null);
  const [preview, setPreview] = useState(avatarUrl);
  const [uploading, setUploading] = useState(false);

  useEffect(() => { setPreview(avatarUrl); }, [avatarUrl]);

  const handleChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setPreview(ev.target.result);
    reader.readAsDataURL(file);
    setUploading(true);
    try {
      await onUpload(file);
    } finally {
      setUploading(false);
    }
  };

  const initials = name?.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2) || '?';

  return (
    <div className="relative flex-shrink-0 z-10">
      <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-full overflow-hidden bg-ethereal-surface-dim flex items-center justify-center shadow-lg ring-4 ring-ethereal-surface">
        {preview ? (
          <img src={preview} alt={name} className="w-full h-full object-cover" />
        ) : (
          <span className="font-heading text-3xl font-bold text-ethereal-primary opacity-70">{initials}</span>
        )}
      </div>
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={uploading || loading}
        className="absolute bottom-1 right-1 w-9 h-9 bg-ethereal-tertiary text-ethereal-surface rounded-full flex items-center justify-center shadow-md hover:scale-110 transition-transform disabled:opacity-50"
        aria-label="Change avatar"
      >
        {uploading ? <LoadingSpinner size="xs" /> : <Camera size={16} />}
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={handleChange}
        className="hidden"
        aria-label="Upload avatar"
      />
    </div>
  );
});

const EditableField = memo(function EditableField({ label, value, onSave, type = 'text', maxLength, icon: Icon, multiline = false, pickerPlacement = 'bottom' }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value || '');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    await onSave(draft);
    setSaving(false);
    setEditing(false);
  };

  const handleCancel = () => {
    setDraft(value || '');
    setEditing(false);
  };

  return (
    <div className="group py-4 px-3 -mx-3 border-b border-ethereal-outline/20 last:border-0 hover:bg-ethereal-primary/5 hover:shadow-sm rounded-2xl transition-all duration-300">
      <div className="flex items-center justify-between mb-2">
        <label className="flex items-center gap-2 text-label text-ethereal-tertiary/40">
          {Icon && <Icon size={14} className="text-ethereal-tertiary/30" />}
          {label}
        </label>
        {!editing && (
          <button
            onClick={() => { setDraft(value || ''); setEditing(true); }}
            className="opacity-0 group-hover:opacity-100 p-1.5 rounded-full hover:bg-ethereal-surface-dim text-ethereal-tertiary/40 hover:text-ethereal-primary transition-all"
            aria-label={`Edit ${label}`}
          >
            <Edit2 size={14} />
          </button>
        )}
      </div>

      {editing ? (
        <div className="space-y-3 mt-2">
          {type === 'date' ? (
            <CustomDatePicker value={draft} onChange={(val) => setDraft(val)} placement={pickerPlacement} />
          ) : multiline ? (
            <textarea
              className="w-full bg-transparent border-b border-ethereal-primary text-ethereal-tertiary text-base focus:outline-none resize-none py-2"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              maxLength={maxLength}
              autoFocus
              rows={3}
            />
          ) : (
            <input
              type={type}
              className="w-full bg-transparent border-b border-ethereal-primary text-ethereal-tertiary text-base focus:outline-none py-2"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              maxLength={maxLength}
              autoFocus
            />
          )}
          <div className="flex gap-2">
            <button onClick={handleSave} disabled={saving} className="px-4 py-1.5 rounded-full bg-ethereal-primary text-white text-xs font-medium flex items-center gap-1 hover:opacity-90 shadow-sm">
              {saving ? <LoadingSpinner size="xs" /> : <Check size={14} />} Save
            </button>
            <button onClick={handleCancel} className="px-4 py-1.5 rounded-full text-ethereal-tertiary/60 text-xs font-medium flex items-center gap-1 hover:bg-ethereal-primary/10 transition-colors">
              <X size={14} /> Cancel
            </button>
          </div>
        </div>
      ) : (
        <p className={`text-base text-ethereal-tertiary font-sans ${!value ? 'italic text-ethereal-tertiary/30' : ''}`}>
          {value || `No ${label.toLowerCase()} set`}
        </p>
      )}
    </div>
  );
});

function ChangePasswordModal({ onClose }) {
  const [form, setForm] = useState({ currentPassword: '', newPassword: '', confirm: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const update = (f) => (e) => setForm((prev) => ({ ...prev, [f]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (form.newPassword.length < 8) { setError('New password must be at least 8 characters.'); return; }
    if (form.newPassword !== form.confirm) { setError('Passwords do not match.'); return; }
    setLoading(true);
    try {
      await changePassword({ currentPassword: form.currentPassword, newPassword: form.newPassword });
      setSuccess(true);
      setTimeout(onClose, 1500);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to change password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ scale: 0.95, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.95, y: 20 }}
        className="w-full max-w-sm bg-ethereal-surface border border-ethereal-outline rounded-3xl p-8 shadow-2xl"
      >
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-2xl bg-ethereal-primary/10 flex items-center justify-center text-ethereal-primary">
            <Lock size={18} />
          </div>
          <div>
            <h3 className="font-heading font-bold text-ethereal-tertiary text-lg">Change Password</h3>
          </div>
        </div>

        {success ? (
          <div className="text-center py-6">
            <Check size={40} className="text-green-500 mx-auto mb-3" />
            <p className="text-base text-ethereal-tertiary font-sans">Password successfully updated.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            <PasswordInput
              id="currentPassword"
              label="Current password"
              labelClassName="text-label text-ethereal-tertiary/50 mb-1 block"
              inputClassName="w-full bg-ethereal-surface-dim rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-ethereal-primary"
              value={form.currentPassword}
              onChange={update('currentPassword')}
              autoComplete="current-password"
              placeholder=""
            />
            <PasswordInput
              id="newPassword"
              label="New password"
              labelClassName="text-label text-ethereal-tertiary/50 mb-1 block"
              inputClassName="w-full bg-ethereal-surface-dim rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-ethereal-primary"
              placeholder="At least 8 characters"
              value={form.newPassword}
              onChange={update('newPassword')}
              minLength={8}
              autoComplete="new-password"
            />
            <PasswordInput
              id="confirmPassword"
              label="Confirm password"
              labelClassName="text-label text-ethereal-tertiary/50 mb-1 block"
              inputClassName="w-full bg-ethereal-surface-dim rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-ethereal-primary"
              value={form.confirm}
              onChange={update('confirm')}
              autoComplete="new-password"
              placeholder=""
            />
            {error && <div className="p-3 bg-ethereal-error/10 text-ethereal-error rounded-xl text-xs">{error}</div>}
            <div className="flex gap-3 pt-2">
              <button type="button" onClick={onClose} className="flex-1 py-3 text-sm font-medium rounded-full bg-ethereal-surface-dim text-ethereal-tertiary hover:opacity-80 transition-opacity">Cancel</button>
              <button type="submit" disabled={loading} className="flex-1 py-3 text-sm font-medium rounded-full bg-ethereal-tertiary text-ethereal-surface hover:opacity-90 transition-opacity">
                {loading ? <LoadingSpinner size="sm" /> : 'Update'}
              </button>
            </div>
          </form>
        )}
      </motion.div>
    </motion.div>
  );
}

// ─── Main Profile Page ─────────────────────────────────────────────────────────

export default function Profile() {
  const { user, refreshUser, updateUser, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('me'); // 'me', 'partner', 'space', 'settings'
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null); // { type: 'bucket' | 'milestone', idx: number }
  const [coupleNickname, setCoupleNickname] = useState(user?.couple?.coupleNickname || '');
  const [relationshipStatus, setRelationshipStatus] = useState(user?.couple?.relationshipStatus || '');
  const [anniversaryDate, setAnniversaryDate] = useState(user?.couple?.anniversaryDate ? user.couple.anniversaryDate.substring(0, 10) : '');
  const [coupleBio, setCoupleBio] = useState(user?.couple?.coupleBio || '');

  useEffect(() => {
    if (user?.couple?.anniversaryDate) {
      setAnniversaryDate(user.couple.anniversaryDate.substring(0, 10));
    } else {
      setAnniversaryDate('');
    }
  }, [user?.couple?.anniversaryDate]);

  useEffect(() => {
    if (user?.couple?.milestones) setMilestones(user.couple.milestones);
  }, [user?.couple?.milestones]);

  useEffect(() => {
    if (user?.couple?.bucketList) setBucketList(user.couple.bucketList);
  }, [user?.couple?.bucketList]);

  const [milestones, setMilestones] = useState(user?.couple?.milestones || []);
  const [bucketList, setBucketList] = useState(user?.couple?.bucketList || []);
  const [interactions, setInteractions] = useState(user?.couple?.interactions || { hugCount: 0, kissCount: 0 });

  const queryClient = useQueryClient();

  const profileMutation = useMutation({
    mutationFn: (updates) => updateProfile(updates),
    onSuccess: async (res) => {
      await queryClient.invalidateQueries({ queryKey: ['couple'] });
      updateUser(res.data.data.user);
    },
    onError: (err) => console.error('Profile update failed:', err)
  });

  const partnerMutation = useMutation({
    mutationFn: (updates) => updatePartner(updates),
    onSuccess: async (res) => {
      await queryClient.invalidateQueries({ queryKey: ['couple'] });
      updateUser(res.data.data.user);
    },
    onError: (err) => console.error('Partner update failed:', err)
  });

  const avatarMutation = useMutation({
    mutationFn: (file) => uploadAvatar(file),
    onSuccess: async (res) => {
      await queryClient.invalidateQueries({ queryKey: ['couple'] });
      updateUser(res.data.data.user);
    },
    onError: (err) => console.error('Avatar upload failed:', err)
  });

  const coupleMutation = useMutation({
    mutationFn: (updates) => updateCouple(updates),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['couple'] });
      refreshUser();
    },
    onError: (err) => console.error('Failed to update couple', err)
  });

  if (!user) return null;
  const partner = user?.couple?.partner;

  const handleProfileSave = useCallback((field, value) => {
    profileMutation.mutate({ [field]: value });
  }, []);

  const handlePartnerSave = useCallback((field, value) => {
    partnerMutation.mutate({ [field]: value });
  }, []);

  const handleAvatarUpload = useCallback((file) => {
    return avatarMutation.mutateAsync(file);
  }, []);

  const handleCoupleSave = (extraFields = {}) => {
    coupleMutation.mutate({ 
      coupleNickname, 
      relationshipStatus, 
      coupleBio,
      anniversaryDate: anniversaryDate || null,
      milestones,
      bucketList,
      interactions,
      ...extraFields
    });
  };

  const handleSendHug = () => {
    const newCount = (user.hugsSent || 0) + 1;
    profileMutation.mutate({ hugsSent: newCount }, {
      onSuccess: () => refreshUser()
    });
  };

  const handleToggleBucketList = (idx) => {
    const newBL = [...bucketList];
    newBL[idx].isCompleted = !newBL[idx].isCompleted;
    setBucketList(newBL);
    handleCoupleSave({ bucketList: newBL });
  };

  const handleAddBucketList = (e) => {
    if (e.key === 'Enter' && e.target.value.trim()) {
      const newBL = [...bucketList, { title: e.target.value.trim(), isCompleted: false, addedBy: user._id }];
      setBucketList(newBL);
      e.target.value = '';
      handleCoupleSave({ bucketList: newBL });
    }
  };

  const handleRemoveBucketList = (idx) => {
    setDeleteConfirm({ type: 'bucket', idx });
  };

  const handleAddMilestone = (e) => {
    if (e.key === 'Enter' && e.target.value.trim()) {
      const newMilestones = [...milestones, { title: e.target.value.trim(), date: new Date(), description: '' }];
      setMilestones(newMilestones);
      e.target.value = '';
      handleCoupleSave({ milestones: newMilestones });
    }
  };

  const handleRemoveMilestone = (idx) => {
    setDeleteConfirm({ type: 'milestone', idx });
  };

  const confirmDelete = () => {
    if (!deleteConfirm) return;
    const { type, idx } = deleteConfirm;
    
    if (type === 'bucket') {
      const newBL = bucketList.filter((_, i) => i !== idx);
      setBucketList(newBL);
      handleCoupleSave({ bucketList: newBL });
      toast.success('Goal removed');
    } else if (type === 'milestone') {
      const newMilestones = milestones.filter((_, i) => i !== idx);
      setMilestones(newMilestones);
      handleCoupleSave({ milestones: newMilestones });
      toast.success('Milestone removed');
    }
    setDeleteConfirm(null);
  };

  const getDaysAgoText = (dateStr) => {
    if(!dateStr) return '';
    const diff = Math.floor((new Date() - new Date(dateStr)) / (1000 * 60 * 60 * 24));
    if (diff === 0) return 'Today';
    if (diff === 1) return 'Yesterday';
    if (diff > 0) return `${diff} days ago`;
    return `In ${Math.abs(diff)} days`;
  };

  const DEFAULT_QUESTIONS = [
    "What is their favorite food?",
    "What is their dream holiday destination?",
    "What is their biggest fear?",
    "What is their favorite movie or show?",
  ];

  const handleKnowledgeSave = useCallback((question, answer) => {
    let current = user.partnerKnowledge ? [...user.partnerKnowledge] : [];
    const idx = current.findIndex(k => k.question === question);
    if (idx !== -1) {
      if (answer) current[idx].answer = answer;
      else current.splice(idx, 1);
    } else if (answer) {
      current.push({ question, answer });
    }
    profileMutation.mutate({ partnerKnowledge: current });
  }, [user.partnerKnowledge]);

  const GENDER_OPTIONS = [
    { value: 'boy', label: 'Boy' },
    { value: 'girl', label: 'Girl' },
  ];

  const COLOUR_PALETTE = [
    '#E8A598', '#F4C2A1', '#E8C9B0', '#D4A5A5',
    '#A8C5B5', '#87ABBE', '#B5A8C5', '#C5A8B5',
    '#7D9E8C', '#6B7FA8', '#8C6B7D', '#A89C6B',
  ];

  // The custom layout begins
  return (
    <div className="min-h-screen pb-20 md:pl-20 md:pb-0 bg-ethereal-surface">

      {/* ─── Hero Header ─── */}
      <div className="relative pt-24 pb-12 px-6 flex flex-col items-center overflow-hidden">
        <div 
          className="absolute inset-0 opacity-[0.2] dark:opacity-[0.08] bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-ethereal-primary/60 via-ethereal-surface to-transparent pointer-events-none transition-colors duration-1000"
        />

        <button 
          onClick={logout}
          className="md:hidden absolute top-6 right-6 p-2 rounded-full bg-ethereal-surface-dim text-ethereal-tertiary hover:text-ethereal-error hover:bg-ethereal-error/10 transition-all border border-ethereal-outline shadow-sm"
          aria-label="Log out"
        >
          <LogOut size={20} />
        </button>

        <AvatarPicker
          avatarUrl={user.avatarUrl}
          name={user.name}
          onUpload={handleAvatarUpload}
        />

        <h1 className="font-heading text-5xl font-black text-ethereal-tertiary mt-5 z-10 text-center tracking-tight">
          {user.name}
        </h1>
        {user.nickname && (
          <p className="text-xl text-ethereal-tertiary/70 font-heading italic z-10 mt-2 font-medium">"{user.nickname}"</p>
        )}

        {/* Mood Widget directly in hero */}
        <div className="z-10 mt-6 flex items-center justify-center gap-4 bg-ethereal-surface-dim/50 backdrop-blur-md px-6 py-3 rounded-full border border-ethereal-outline/30 shadow-sm">
          {[
            { value: 'happy', icon: Smile, activeColor: 'text-green-500' },
            { value: 'sad', icon: Frown, activeColor: 'text-red-500' }
          ].map(mood => {
            const isSelected = (user.currentStatus || 'sad') === mood.value;
            return (
              <button
                key={mood.value}
                onClick={() => handleProfileSave('currentStatus', mood.value)}
                className={`transition-all duration-300 rounded-full p-2 ${isSelected ? 'scale-125 bg-ethereal-surface shadow-sm' : 'opacity-40 hover:opacity-100 hover:scale-110'}`}
                aria-label={`Set mood to ${mood.value}`}
              >
                <mood.icon size={22} className={isSelected ? mood.activeColor : 'text-ethereal-tertiary'} />
              </button>
            )
          })}
        </div>
      </div>

      {/* ─── Tabs Navigation ─── */}
      <div className="px-4 sm:px-8 max-w-3xl mx-auto">
        <div className="flex overflow-x-auto hide-scrollbar justify-start sm:justify-center border-b border-ethereal-outline/20 mb-8 pb-2 gap-2">
          {[
            { id: 'me', label: 'My Info', icon: User },
            { id: 'partner', label: 'Partner', icon: Heart, hidden: !partner },
            { id: 'space', label: 'Our Space', icon: Users },
            { id: 'settings', label: 'Settings', icon: Settings },
          ].filter(t => !t.hidden).map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-full font-sans text-sm tracking-wide font-medium transition-all whitespace-nowrap ${
                activeTab === tab.id 
                  ? 'bg-ethereal-primary text-white shadow-md transform scale-105' 
                  : 'bg-transparent text-ethereal-tertiary/60 hover:bg-ethereal-primary/10 hover:text-ethereal-tertiary'
              }`}
            >
              <tab.icon size={16} />
              {tab.label}
            </button>
          ))}
        </div>

        {/* ─── Tab Content ─── */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
            className="pb-12 px-2"
          >
            {/* --- ME TAB --- */}
            {activeTab === 'me' && (
              <div className="space-y-6 p-6 sm:p-8 rounded-3xl border border-white/20 dark:border-white/5 shadow-xl bg-white/40 dark:bg-black/20 backdrop-blur-xl">
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2">
                  <div className="col-span-1 md:col-span-2 mb-2">
                    <h3 className="text-sm font-semibold uppercase tracking-widest text-ethereal-tertiary/60 border-b border-ethereal-outline/20 pb-2">Basic Info</h3>
                  </div>
                  
                  <div className="col-span-1">
                    <EditableField
                      label="Name"
                      value={user.name}
                      onSave={(v) => handleProfileSave('name', v)}
                      maxLength={60}
                      icon={User}
                    />
                  </div>
                  
                  <div className="col-span-1">
                    <EditableField
                      label="Nickname"
                      value={user.nickname}
                      onSave={(v) => handleProfileSave('nickname', v)}
                      maxLength={40}
                      icon={Smile}
                    />
                  </div>

                  <div className="col-span-1 md:col-span-2">
                    <EditableField
                      label="Bio"
                      value={user.bio}
                      onSave={(v) => handleProfileSave('bio', v)}
                      maxLength={160}
                      multiline
                      icon={Info}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2 pt-4">
                  <div className="col-span-1 md:col-span-2 mb-2">
                    <h3 className="text-sm font-semibold uppercase tracking-widest text-ethereal-tertiary/60 border-b border-ethereal-outline/20 pb-2">Personal Details</h3>
                  </div>

                  <div className="col-span-1">
                    {/* ReadOnly Email */}
                    <div className="group py-4 px-3 -mx-3 border-b border-ethereal-outline/20 last:border-0 hover:bg-ethereal-primary/5 hover:shadow-sm rounded-2xl transition-all duration-300 h-full">
                      <div className="flex items-center justify-between mb-2">
                        <label className="flex items-center gap-2 text-label text-ethereal-tertiary/40">
                          <Shield size={14} className="text-ethereal-tertiary/30" /> Email (Private)
                        </label>
                      </div>
                      <p className="text-base text-ethereal-tertiary font-sans">
                        {user.email}
                      </p>
                    </div>
                  </div>

                  <div className="col-span-1">
                    <EditableField
                      label="Birthday"
                      value={user.dateOfBirth ? user.dateOfBirth.split('T')[0] : ''}
                      onSave={(v) => handleProfileSave('dateOfBirth', v || null)}
                      type="date"
                      icon={Calendar}
                      pickerPlacement="top"
                    />
                  </div>

                  <div className="col-span-1">
                    <div className="group py-4 px-3 -mx-3 border-b border-ethereal-outline/20 last:border-0 hover:bg-ethereal-primary/5 hover:shadow-sm rounded-2xl transition-all duration-300 h-full flex flex-col justify-center">
                      <label className="flex items-center gap-2 text-label text-ethereal-tertiary/40 mb-3">
                        <User size={14} className="text-ethereal-tertiary/30" /> Gender
                      </label>
                      <div className="flex gap-3">
                        {GENDER_OPTIONS.map((g) => (
                          <button
                            key={g.value}
                            onClick={() => handleProfileSave('gender', g.value)}
                            className={`px-6 py-2 rounded-full text-sm font-medium transition-all duration-300 shadow-sm ${
                              user.gender === g.value
                                ? 'bg-ethereal-primary text-white transform scale-105 shadow-md'
                                : 'bg-transparent text-ethereal-tertiary/70 hover:bg-ethereal-primary/10 hover:text-ethereal-tertiary hover:shadow-sm border border-ethereal-outline/20'
                            }`}
                          >
                            {g.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="col-span-1">
                    <div className="group py-4 px-3 -mx-3 border-b border-ethereal-outline/20 last:border-0 hover:bg-ethereal-primary/5 hover:shadow-sm rounded-2xl transition-all duration-300 h-full flex flex-col justify-center">
                      <label className="flex items-center gap-2 text-label text-ethereal-tertiary/40 mb-3">
                        <Palette size={14} className="text-ethereal-tertiary/30" /> Favorite Color
                      </label>
                      <CustomColorPicker
                        value={user.favouriteColour}
                        onChange={(v) => handleProfileSave('favouriteColour', v)}
                        palette={COLOUR_PALETTE}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* --- PARTNER TAB --- */}
            {activeTab === 'partner' && partner && (
              <div className="flex flex-col md:flex-row gap-10 items-start p-6 sm:p-8 rounded-3xl border border-white/20 dark:border-white/5 shadow-xl bg-white/40 dark:bg-black/20 backdrop-blur-xl">
                {/* Partner Image & Mood */}
                <div className="flex flex-col items-center gap-4">
                  <div className="w-32 h-32 sm:w-40 sm:h-40 rounded-full overflow-hidden bg-ethereal-surface-dim flex items-center justify-center shadow-lg">
                    {partner.avatarUrl ? (
                      <img src={partner.avatarUrl} alt={partner.name} className="w-full h-full object-cover" />
                    ) : (
                      <span className="font-heading text-4xl font-bold text-ethereal-primary opacity-50">
                        {partner.name?.split(' ').map((n) => n[0]).join('').slice(0, 2)}
                      </span>
                    )}
                  </div>
                  {/* Partner Mood Badge */}
                  {partner.currentStatus && (
                    <div className="flex items-center gap-2 bg-ethereal-surface-dim px-4 py-2 rounded-full shadow-sm">
                      {partner.currentStatus === 'happy' && <Smile size={16} className="text-green-500" />}
                      {partner.currentStatus === 'sad' && <Frown size={16} className="text-red-500" />}
                      <span className="text-sm font-medium capitalize text-ethereal-tertiary">{partner.currentStatus}</span>
                    </div>
                  )}
                </div>

                {/* Partner Details */}
                <div className="flex-1 space-y-6 w-full">
                  <div>
                    <h2 className="font-heading text-3xl font-bold text-ethereal-tertiary">{partner.name}</h2>
                    <p className="text-ethereal-tertiary/50 text-sm">{partner.email}</p>

                    {user.role === 'admin' ? (
                      <div className="mt-4 max-w-xs">
                        <EditableField
                          label="Set their nickname"
                          value={partner.nickname}
                          onSave={(v) => handlePartnerSave('nickname', v)}
                          maxLength={40}
                        />
                      </div>
                    ) : partner.nickname ? (
                      <p className="text-lg text-ethereal-tertiary/70 font-heading italic mt-2">"{partner.nickname}"</p>
                    ) : null}
                  </div>

                  {partner.bio && (
                    <div>
                      <p className="text-label text-ethereal-tertiary/40 mb-1">Bio</p>
                      <p className="text-base text-ethereal-tertiary">{partner.bio}</p>
                    </div>
                  )}

                  <div className="pt-4 border-t border-ethereal-outline/30 space-y-6">
                    <h3 className="font-heading text-xl font-medium text-ethereal-tertiary">Partner Knowledge</h3>
                    <p className="text-sm text-ethereal-tertiary/50 -mt-4">How well do you know them?</p>
                    <div className="space-y-2">
                      {DEFAULT_QUESTIONS.map(q => {
                        const existing = user.partnerKnowledge?.find(k => k.question === q);
                        return (
                          <EditableField
                            key={q}
                            label={q}
                            value={existing?.answer || ''}
                            onSave={(val) => handleKnowledgeSave(q, val)}
                            maxLength={160}
                            multiline
                          />
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* --- OUR SPACE TAB --- */}
            {activeTab === 'space' && (
              <div className="max-w-4xl mx-auto space-y-6 mt-4">
                {/* Hero Dashboard */}
                <div className="p-8 rounded-2xl border border-ethereal-outline/20 shadow-sm text-center bg-white dark:bg-ethereal-surface-dim">
                  
                  <div className="w-16 h-16 mx-auto rounded-full flex items-center justify-center mb-4 bg-ethereal-surface text-ethereal-primary">
                    <Heart size={28} />
                  </div>

                  <div className="flex flex-col items-center justify-center gap-3">
                    <input
                      type="text"
                      className="bg-transparent text-center font-semibold text-2xl sm:text-3xl border-b-2 border-transparent hover:border-ethereal-outline/30 focus:border-ethereal-primary focus:outline-none text-ethereal-tertiary w-full max-w-lg transition-all"
                      placeholder={`${user.name.split(' ')[0]} & ${partner?.name?.split(' ')[0] || 'Partner'}`}
                      value={coupleNickname}
                      onChange={(e) => setCoupleNickname(e.target.value)}
                      onBlur={() => handleCoupleSave()}
                      maxLength={60}
                    />
                    <input
                      type="text"
                      className="bg-transparent text-center font-medium text-base border-b border-transparent hover:border-ethereal-outline/30 focus:border-ethereal-primary/50 focus:outline-none text-ethereal-tertiary/70 w-full max-w-sm transition-all"
                      placeholder="Relationship Status (e.g. Engaged)"
                      value={relationshipStatus}
                      onChange={(e) => setRelationshipStatus(e.target.value)}
                      onBlur={() => handleCoupleSave()}
                      maxLength={40}
                    />
                  </div>

                  {user.couple?.anniversaryDate ? (
                    <div className="mt-8 pt-8 border-t border-ethereal-outline/20">
                      <p className="text-sm font-medium text-ethereal-tertiary/60 mb-2">Days Together</p>
                      <div className="text-3xl font-bold text-ethereal-primary">
                        {Math.floor((new Date() - new Date(user.couple.anniversaryDate)) / (1000 * 60 * 60 * 24))}
                      </div>
                      <p className="text-sm text-ethereal-tertiary/50 mt-1">Since {formatDate(user.couple.anniversaryDate)}</p>
                    </div>
                  ) : (
                    <div className="mt-8 pt-8 border-t border-ethereal-outline/20 flex flex-col items-center">
                      <p className="text-sm text-ethereal-tertiary/50 italic mb-3">Set your anniversary date in Settings to start the counter.</p>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                  {/* Bucket List Widget */}
                  <div className="p-6 rounded-2xl border border-ethereal-outline/20 shadow-sm bg-white dark:bg-ethereal-surface-dim h-[26rem] flex flex-col">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-ethereal-surface flex items-center justify-center text-ethereal-primary">
                          <ListTodo size={18} />
                        </div>
                        <h3 className="text-lg font-semibold text-ethereal-tertiary">Our Bucket List</h3>
                      </div>
                      <span className="text-xs font-semibold px-2 py-1 rounded-md bg-ethereal-surface text-ethereal-primary">
                        {bucketList.filter(i => i.isCompleted).length} / {bucketList.length}
                      </span>
                    </div>
                    
                    <div className="flex-1 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                      {bucketList.map((item, idx) => (
                        <div key={idx} className="flex items-center gap-3 p-3 rounded-xl bg-ethereal-surface/50 border border-transparent hover:border-ethereal-outline/20 group transition-all">
                          <button onClick={() => handleToggleBucketList(idx)} className={`w-5 h-5 flex-shrink-0 rounded-md border flex items-center justify-center transition-colors ${item.isCompleted ? 'bg-ethereal-primary border-ethereal-primary' : 'border-ethereal-tertiary/30'}`}>
                            {item.isCompleted && <Check size={14} className="text-white" />}
                          </button>
                          <span className={`flex-1 text-sm transition-all break-words ${item.isCompleted ? 'line-through text-ethereal-tertiary/40' : 'text-ethereal-tertiary'}`}>
                            {item.title}
                          </span>
                          <button onClick={() => handleRemoveBucketList(idx)} className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-500 transition-opacity">
                            <Trash2 size={16} />
                          </button>
                        </div>
                      ))}
                    </div>
                    
                    <div className="mt-4 pt-4 border-t border-ethereal-outline/20 flex gap-2">
                      <input 
                        type="text" 
                        placeholder="Add a new dream..." 
                        onKeyDown={handleAddBucketList}
                        className="flex-1 bg-ethereal-surface rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ethereal-primary border border-transparent"
                      />
                    </div>
                  </div>

                  {/* Right Column: Interaction & Music */}
                  <div className="space-y-6 flex flex-col h-[26rem]">
                    {/* Easter Egg Widget */}
                    <div className="flex-1 p-6 rounded-2xl border border-ethereal-outline/20 shadow-sm bg-white dark:bg-ethereal-surface-dim flex flex-col items-center justify-center relative group">
                      <button 
                        onClick={handleSendHug}
                        className="w-16 h-16 rounded-2xl bg-ethereal-surface text-ethereal-primary hover:bg-ethereal-primary hover:text-white flex items-center justify-center shadow-sm transform transition-all active:scale-95 mb-4 focus:outline-none focus:ring-2 focus:ring-ethereal-primary focus:ring-offset-2 dark:focus:ring-offset-ethereal-surface-dim"
                      >
                        <HeartHandshake size={28} />
                      </button>
                      <h3 className="text-lg font-semibold text-ethereal-tertiary">Send a Hug</h3>
                      
                      <div className="flex w-full mt-3 justify-around items-center">
                        <div className="flex flex-col items-center">
                          <p className="text-xl font-bold text-ethereal-primary">{user.hugsSent || 0}</p>
                          <p className="text-[10px] font-medium text-ethereal-tertiary/60 uppercase tracking-wider">Sent</p>
                        </div>
                        <div className="w-px h-8 bg-ethereal-outline/20"></div>
                        <div className="flex flex-col items-center">
                          <p className="text-xl font-bold text-ethereal-primary">{partner?.hugsSent || 0}</p>
                          <p className="text-[10px] font-medium text-ethereal-tertiary/60 uppercase tracking-wider">Received</p>
                        </div>
                      </div>
                    </div>

                  </div>
                </div>

                {/* Milestones Widget */}
                <div className="p-6 sm:p-8 rounded-2xl border border-ethereal-outline/20 shadow-sm bg-white dark:bg-ethereal-surface-dim">
                  <div className="flex items-center justify-between mb-6 border-b border-ethereal-outline/20 pb-4">
                    <div className="flex items-center gap-2">
                      <MapPin size={20} className="text-ethereal-primary" />
                      <h3 className="text-lg font-semibold text-ethereal-tertiary">Timeline</h3>
                    </div>
                    <span className="text-xs font-semibold px-2 py-1 rounded-md bg-ethereal-surface text-ethereal-primary">
                      {milestones.length} Milestones
                    </span>
                  </div>
                  
                  <div className="space-y-4">
                    {milestones.length === 0 && <p className="text-sm text-ethereal-tertiary/40 italic text-center py-6">No milestones yet. Record your journey together!</p>}
                    
                    {milestones.map((m, idx) => (
                      <div key={idx} className="flex gap-4 group">
                        <div className="flex flex-col items-center">
                          <div className="w-4 h-4 rounded-full bg-ethereal-surface border-2 border-ethereal-primary mt-1 flex-shrink-0" />
                          <div className="w-0.5 h-full bg-ethereal-outline/30 group-last:hidden mt-2" />
                        </div>
                        <div className="flex-1 pb-6 bg-white dark:bg-ethereal-surface-dim rounded-xl p-4 border border-ethereal-outline/20 hover:border-ethereal-primary/30 transition-all -mt-3">
                          <div className="flex items-center justify-between">
                            <h4 className="font-semibold text-ethereal-tertiary text-base">{m.title}</h4>
                            <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3">
                              <span className="text-xs font-medium text-ethereal-tertiary/60">{formatDate(m.date)}</span>
                              <span className="text-xs font-medium text-ethereal-tertiary/60">{getDaysAgoText(m.date)}</span>
                              <button onClick={() => handleRemoveMilestone(idx)} className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-500 transition-opacity ml-auto">
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                    
                    <div className="flex gap-4 items-start pt-4 mt-2 border-t border-ethereal-outline/10">
                      <div className="w-4 h-4 rounded-full bg-ethereal-surface mt-3 flex-shrink-0" />
                      <input 
                        type="text" 
                        placeholder="Add new milestone... (Press Enter to save)" 
                        onKeyDown={handleAddMilestone}
                        className="flex-1 bg-ethereal-surface rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-ethereal-primary border border-transparent"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* --- SETTINGS TAB --- */}
            {activeTab === 'settings' && (
              <div className="max-w-xl space-y-8">
                {user.role === 'admin' && (
                  <div>
                    <h3 className="text-lg font-heading font-medium text-ethereal-tertiary mb-1">Couple Settings</h3>
                    <p className="text-sm text-ethereal-tertiary/50 mb-4">Manage your anniversary date.</p>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                      <label className="text-sm font-medium text-ethereal-tertiary/80 whitespace-nowrap">Anniversary Date</label>
                      <div className="max-w-[200px] w-full">
                        <CustomDatePicker
                          value={anniversaryDate}
                          onChange={(val) => {
                            const newDate = val || null;
                            setAnniversaryDate(newDate); // Update UI instantly
                            handleCoupleSave({ anniversaryDate: newDate }); // Save to backend
                          }}
                        />
                      </div>
                    </div>
                  </div>
                )}
                
                <div className="pt-6 border-t border-ethereal-outline/10">
                  <h3 className="text-lg font-heading font-medium text-ethereal-tertiary mb-1">Account Security</h3>
                  <p className="text-sm text-ethereal-tertiary/50 mb-4">Manage your password and security preferences.</p>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <button
                      onClick={() => setShowPasswordModal(true)}
                      className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-ethereal-surface-dim hover:bg-ethereal-outline/30 text-ethereal-tertiary font-medium transition-colors"
                    >
                      <Lock size={18} className="text-ethereal-tertiary/60" />
                      Change Password
                    </button>
                    <button
                      onClick={logout}
                      className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-ethereal-error/10 hover:bg-ethereal-error/20 text-ethereal-error font-medium transition-colors"
                    >
                      <LogOut size={18} />
                      Log out
                    </button>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>

      </div>

      <ConfirmationModal
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        onConfirm={confirmDelete}
        title={`Remove ${deleteConfirm?.type === 'bucket' ? 'Goal' : 'Milestone'}`}
        message={`Are you sure you want to remove this ${deleteConfirm?.type === 'bucket' ? 'bucket list goal' : 'milestone'}?`}
        confirmText="Remove"
      />

      {/* Password Modal */}
      <AnimatePresence>
        {showPasswordModal && (
          <ChangePasswordModal onClose={() => setShowPasswordModal(false)} />
        )}
      </AnimatePresence>
    </div>
  );
}
