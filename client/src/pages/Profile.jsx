import { useState, useRef, useEffect, memo, useCallback } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { updateProfile, updatePartner, changePassword, uploadAvatar } from '../api/profile';
import { updateCouple, addMilestone, deleteMilestone, addBucketListItem, toggleBucketListItem, deleteBucketListItem, getMyCouple } from '../api/couples';
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

import {
  formatDate,
  getAnniversaryCountdown,
  GenderBadge,
  AvatarPicker,
  EditableField,
  ChangePasswordModal
} from '../components/profile/ProfileHelpers';
import CoupleSettings from '../components/profile/CoupleSettings';



// ─── Main Profile Page ─────────────────────────────────────────────────────────

export default function Profile() {
  const { user, refreshUser, updateUser, logout } = useAuth();
  const socket = useSocket();
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
      if (socket) socket.emit('content_updated');
    },
    onError: (err) => console.error('Failed to update couple', err)
  });

  const { data: coupleQueryData } = useQuery({
    queryKey: ['couple', 'me'],
    queryFn: () => getMyCouple().then(res => res.data.data.couple),
    enabled: !!user?.coupleId
  });

  if (!user) return null;
  const partner = coupleQueryData?.partner;

  const handleProfileSave = useCallback((field, value) => {
    profileMutation.mutate({ [field]: value });
    if (field === 'currentStatus' && socket) {
      socket.emit('status_update', { status: value });
    }
  }, [socket]);

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
      onSuccess: () => {
        refreshUser();
        if (socket) socket.emit('send_hug');
      }
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
              <CoupleSettings
                user={user}
                partner={partner}
                coupleNickname={coupleNickname}
                setCoupleNickname={setCoupleNickname}
                relationshipStatus={relationshipStatus}
                setRelationshipStatus={setRelationshipStatus}
                bucketList={bucketList}
                milestones={milestones}
                handleCoupleSave={handleCoupleSave}
                handleSendHug={handleSendHug}
                handleToggleBucketList={handleToggleBucketList}
                handleAddBucketList={handleAddBucketList}
                handleRemoveBucketList={handleRemoveBucketList}
                handleAddMilestone={handleAddMilestone}
                handleRemoveMilestone={handleRemoveMilestone}
                getDaysAgoText={getDaysAgoText}
              />
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

                <div className="pt-6 border-t border-ethereal-outline/10">
                  <h3 className="text-lg font-heading font-medium text-ethereal-tertiary mb-1">App Preferences</h3>
                  <p className="text-sm text-ethereal-tertiary/50 mb-4">Customize your app experience.</p>
                  <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                    <label className="text-sm font-medium text-ethereal-tertiary/80 whitespace-nowrap">Distance Unit</label>
                    <div className="flex gap-2">
                      {['km', 'miles'].map((unit) => (
                        <button
                          key={unit}
                          onClick={() => handleProfileSave('distanceUnit', unit)}
                          className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 shadow-sm capitalize ${
                            (user.distanceUnit || 'km') === unit
                              ? 'bg-ethereal-primary text-white transform scale-105 shadow-md'
                              : 'bg-transparent text-ethereal-tertiary/70 hover:bg-ethereal-primary/10 hover:text-ethereal-tertiary hover:shadow-sm border border-ethereal-outline/20'
                          }`}
                        >
                          {unit}
                        </button>
                      ))}
                    </div>
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
