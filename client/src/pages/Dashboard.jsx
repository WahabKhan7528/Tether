import { useState } from 'react';
import { useQueries } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getMemories } from '../api/memories';
import { getReels } from '../api/reels';
import { getMyCouple } from '../api/couples';
import api from '../api/axios';
import MemoryCard from '../components/MemoryCard';
import ReelCard from '../components/ReelCard';
import LoadingSpinner from '../components/LoadingSpinner';


import { motion } from 'framer-motion';
import { Camera, Film, Images, BookHeart, CalendarHeart, Sparkles, Clock, Heart, Compass, FolderHeart, ArrowRight, Leaf, Smile, Frown, User, Users, ListTodo, Check, Star, Mail, Copy } from 'lucide-react';
import PartnerStatusWidget from '../components/PartnerStatusWidget';
import IdeasJar from '../components/IdeasJar';
import MapTab from '../components/MapTab';
import PromptTab from '../components/PromptTab';

function daysBetween(date1, date2) {
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  return Math.floor(Math.abs(d2 - d1) / (1000 * 60 * 60 * 24));
}

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

function capitalize(str) {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

export default function Dashboard() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');

  const results = useQueries({
    queries: [
      {
        queryKey: ['memories', { limit: 5 }],
        queryFn: () => getMemories({ limit: 5 }).then((res) => ({ data: res.data.data, total: res.data.pagination.total })),
      },
      {
        queryKey: ['reels', { limit: 3, isDone: false }],
        queryFn: () => getReels({ limit: 3, isDone: false }).then((res) => ({ data: res.data.data, total: res.data.pagination?.total || 0 })),
      },
      {
        queryKey: ['couple', 'me'],
        queryFn: () => getMyCouple().then((res) => res.data.data.couple),
      },
      {
        queryKey: ['letters', { limit: 5 }],
        queryFn: async () => {
          const res = await api.get('/letters');
          return res.data.success ? res.data.data : [];
        },
      },
    ],
  });

  const isLoading = results.some((q) => q.isLoading);

  const memoriesData = results[0].data || { data: [], total: 0 };
  const memories = memoriesData.data;
  const totalMemories = memoriesData.total;

  const reelsData = results[1].data || { data: [], total: 0 };
  const reels = reelsData.data;
  const totalReels = reelsData.total;
  const couple = results[2].data || null;
  const letters = results[3].data || [];

  const partner = couple?.partner;
  const daysTogether = couple?.anniversaryDate ? daysBetween(couple.anniversaryDate, new Date()) : null;

  const featuredMemory = memories.length > 0 ? memories[0] : null;

  const myName = capitalize(user?.name?.split(' ')[0]) || 'You';
  const partnerName = capitalize(partner?.name?.split(' ')[0]) || 'Someone';
  const partnerStatus = partner?.currentStatus || user?.couple?.partner?.currentStatus || 'happy';

  return (
    <div className="min-h-screen pb-16 transition-colors duration-500 relative">


      <div className="page-container max-w-5xl pt-16 sm:pt-24 md:pt-32 relative z-10 px-4 md:pl-28 md:pr-8">
        {/* Elegant Minimalist Hero Section */}
        <div className="relative mb-14 flex flex-col items-center justify-center min-h-[35vh] z-20 px-4">

          {/* Waiting for Partner Widget */}
          {!user.isPaired && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="w-full max-w-lg mb-10 bg-ethereal-surface-dim/80 backdrop-blur-md border border-ethereal-primary/30 p-6 rounded-[2rem] shadow-[0_8px_32px_rgba(var(--color-primary),0.15)] flex flex-col items-center text-center relative overflow-hidden group z-30"
            >
              <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-ethereal-primary/50 to-transparent"></div>
              
              <div className="w-12 h-12 rounded-full bg-ethereal-primary/20 flex items-center justify-center mb-4 text-ethereal-primary relative">
                <div className="absolute inset-0 rounded-full border-2 border-ethereal-primary/50 animate-ping opacity-20"></div>
                <Users size={20} />
              </div>
              
              <h3 className="text-xl font-heading text-white mb-2">Waiting for your partner...</h3>
              <p className="text-ethereal-tertiary/70 text-sm mb-6 leading-relaxed">
                Share this invitation code with them so they can join your space. We'll automatically connect you once they sign up.
              </p>
              
              <div className="flex items-center gap-2 bg-black/20 p-2 pl-6 pr-2 rounded-2xl border border-white/10 w-full">
                <span className="font-mono text-xl tracking-[0.2em] text-ethereal-primary font-bold flex-1 text-center select-all">
                  {couple?.inviteCode || '...'}
                </span>
                <button
                  onClick={() => {
                    if (couple?.inviteCode) {
                      navigator.clipboard.writeText(couple.inviteCode);
                      import('react-hot-toast').then(({ default: toast }) => toast.success('Code copied!'));
                    }
                  }}
                  className="bg-ethereal-primary text-white p-3 rounded-xl hover:bg-ethereal-primary/90 transition-colors shadow-lg"
                >
                  <Copy size={18} />
                </button>
              </div>
            </motion.div>
          )}

          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, ease: "easeOut" }}
            className="flex flex-col items-center text-center max-w-4xl"
          >
            {/* Prominent Elegant Greeting */}
            <div className="mb-8 flex items-center justify-center gap-4">
              <div className="h-[1px] w-16 bg-ethereal-primary/40"></div>
              <span className="text-2xl sm:text-3xl font-heading italic tracking-wide text-ethereal-primary drop-shadow-sm">
                {getGreeting()},
              </span>
              <div className="h-[1px] w-16 bg-ethereal-primary/40"></div>
            </div>

            {/* Massive Elegant Typography with Detailing */}
            <h1 className="font-heading text-6xl sm:text-8xl md:text-[9rem] text-ethereal-tertiary tracking-tight leading-none mb-10 flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-8 drop-shadow-sm relative">
              <span className="font-light">{myName}</span>
              <div className="flex items-center gap-3">
                <Sparkles size={16} className="text-ethereal-primary/40 hidden sm:block" />
                <span className="text-4xl sm:text-7xl text-ethereal-primary font-light italic opacity-70">&</span>
                <Sparkles size={16} className="text-ethereal-primary/40 hidden sm:block" />
              </div>
              <div className="relative inline-flex items-center">
                <span className="font-light">{partnerName}</span>
              </div>
            </h1>

            {/* Minimalist Days Counter & Flourish */}
            {daysTogether !== null && (
              <div className="flex flex-col items-center justify-center gap-4 mb-2">
                <p className="text-ethereal-tertiary/80 font-light tracking-[0.2em] uppercase text-sm sm:text-base">
                  <span className="font-medium text-ethereal-tertiary">{daysTogether}</span> Days Together
                </p>
                <div className="flex items-center gap-2 opacity-60">
                  <div className="w-8 h-[1px] bg-ethereal-primary/50"></div>
                  <div className="w-1.5 h-1.5 rounded-full bg-ethereal-primary"></div>
                  <div className="w-8 h-[1px] bg-ethereal-primary/50"></div>
                </div>
                {couple?.anniversaryDate && (
                  <p className="text-xs font-heading italic text-ethereal-tertiary/50 mt-1">
                    Since {new Date(couple.anniversaryDate).getFullYear()}
                  </p>
                )}
              </div>
            )}
            
            <PartnerStatusWidget partnerName={partnerName} initialPartnerStatus={partnerStatus} />
          </motion.div>
        </div>

        {/* --- TABS NAVIGATION --- */}
        <div className="flex items-center justify-center mb-12 px-4 relative z-30">
          <div className="flex items-center gap-1 sm:gap-2 p-1.5 sm:p-2 bg-ethereal-surface-dim/60 backdrop-blur-xl border border-ethereal-outline/50 rounded-full shadow-ambient overflow-x-auto scrollbar-hide max-w-full">
            {[
              { id: 'overview', label: 'Overview', icon: Heart },
              { id: 'ideas', label: 'Ideas Jar', icon: Sparkles },
              { id: 'map', label: 'Our Places', icon: Compass },
              { id: 'prompts', label: 'Daily Prompt', icon: BookHeart }
            ].map(tab => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`relative flex items-center gap-2 px-4 sm:px-6 py-2.5 rounded-full text-sm font-semibold transition-colors duration-300 whitespace-nowrap z-10 ${
                    isActive
                      ? 'text-white'
                      : 'text-ethereal-tertiary/60 hover:text-ethereal-tertiary hover:bg-ethereal-tertiary/5'
                  }`}
                >
                  {isActive && (
                    <motion.div
                      layoutId="dashboardTabBackground"
                      className="absolute inset-0 bg-ethereal-primary rounded-full shadow-lg shadow-ethereal-primary/30 -z-10"
                      initial={false}
                      transition={{ type: "spring", stiffness: 400, damping: 30 }}
                    />
                  )}
                  <tab.icon size={16} className="relative z-10" />
                  <span className="relative z-10">{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {activeTab === 'overview' && (
          <>
            <motion.div
              key="overview"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="flex flex-col gap-6 mb-16"
          >
          {/* Premium Stats Bar (Bento Grid) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
            {(() => {
              const statsData = [
                {
                  id: 'memories',
                  title: 'Memories',
                  subtitle: 'moments captured',
                  valueStr: (totalMemories > 0 ? totalMemories : 0).toString(),
                  icon: Camera,
                  bgLeaf: Leaf,
                  iconRotation: 'group-hover:rotate-12',
                },
                {
                  id: 'reels',
                  title: 'Reels',
                  subtitle: 'activities planned',
                  valueStr: (totalReels > 0 ? totalReels : 0).toString(),
                  icon: Film,
                  bgLeaf: Leaf,
                  iconRotation: 'group-hover:-rotate-12',
                },
                {
                  id: 'hugs',
                  title: 'Hugs',
                  subtitle: '',
                  valueStr: `${user.hugsSent || 0}/${partner?.hugsSent || 0}`,
                  icon: Heart,
                  bgLeaf: Heart,
                  iconRotation: 'group-hover:rotate-12',
                  isHugs: true,
                }
              ];

              // Sort stats by string length descending to find the widest one
              const sortedStats = [...statsData].sort((a, b) => b.valueStr.length - a.valueStr.length);
              const topStat = sortedStats[0];
              const bottomStats = [sortedStats[1], sortedStats[2]];

              const renderStatCard = (stat, isFullWidth) => (
                <div key={stat.id} className={`group relative overflow-hidden bg-gradient-to-br from-ethereal-surface-dim to-ethereal-surface p-6 sm:p-8 rounded-[2rem] border border-ethereal-outline shadow-ambient flex justify-between items-center transition-all duration-500 hover:shadow-xl hover:border-ethereal-primary/40 hover:-translate-y-1 ${isFullWidth ? 'md:col-span-2' : 'md:col-span-1'}`}>
                  {/* Decorative Background Leaf */}
                  <div className={`absolute -bottom-8 -left-8 text-ethereal-primary/5 group-hover:text-ethereal-primary/10 transition-all duration-700 transform group-hover:scale-110 ${stat.iconRotation} pointer-events-none`}>
                    <stat.bgLeaf size={160} strokeWidth={1} />
                  </div>

                  <div className="relative z-10 flex flex-col items-start pr-4">
                    <div className="w-12 h-12 rounded-full bg-ethereal-primary/10 flex items-center justify-center border border-ethereal-primary/20 shadow-sm mb-3">
                      <stat.icon size={18} className="text-ethereal-primary" />
                    </div>
                    <span className="text-label tracking-[0.2em] text-ethereal-tertiary/70">{stat.title}</span>
                  </div>

                  <div className="relative z-10 flex flex-col items-end text-right">
                    {stat.isHugs ? (
                      <div className="flex items-end gap-2 sm:gap-3 text-ethereal-primary drop-shadow-sm">
                        <div className="flex flex-col items-center">
                          <span className={`font-heading tracking-tight leading-none ${isFullWidth ? 'text-6xl sm:text-7xl lg:text-8xl' : 'text-5xl sm:text-6xl lg:text-7xl'}`}>{user.hugsSent || 0}</span>
                          <span className="text-[10px] font-medium text-ethereal-tertiary/60 uppercase tracking-widest mt-1">Sent</span>
                        </div>
                        <span className={`font-heading tracking-tight leading-none opacity-50 mb-4 ${isFullWidth ? 'text-6xl sm:text-7xl lg:text-8xl' : 'text-5xl sm:text-6xl lg:text-7xl'}`}>/</span>
                        <div className="flex flex-col items-center">
                          <span className={`font-heading tracking-tight leading-none ${isFullWidth ? 'text-6xl sm:text-7xl lg:text-8xl' : 'text-5xl sm:text-6xl lg:text-7xl'}`}>{partner?.hugsSent || 0}</span>
                          <span className="text-[10px] font-medium text-ethereal-tertiary/60 uppercase tracking-widest mt-1">Recv</span>
                        </div>
                      </div>
                    ) : (
                      <>
                        <span className={`font-heading text-ethereal-primary tracking-tight drop-shadow-sm leading-none ${isFullWidth ? 'text-6xl sm:text-7xl lg:text-8xl' : 'text-5xl sm:text-6xl lg:text-7xl'}`}>{stat.valueStr}</span>
                        <span className="block mt-2 text-sm sm:text-base font-medium text-ethereal-primary/60 italic font-heading tracking-wide">{stat.subtitle}</span>
                      </>
                    )}
                  </div>
                </div>
              );

              return (
                <>
                  {renderStatCard(topStat, true)}
                  {renderStatCard(bottomStats[0], false)}
                  {renderStatCard(bottomStats[1], false)}
                </>
              );
            })()}
          </div>

          {/* Action Bar */}
          <div className="grid grid-cols-2 gap-4">
            <Link to="/memories/new" className="flex flex-row items-center justify-center gap-3 p-6 rounded-3xl bg-ethereal-primary text-white shadow-ambient transition-all hover:scale-[1.02] active:scale-[0.98] group">
              <Camera strokeWidth={2} size={22} />
              <span className="text-label">Add Memory</span>
            </Link>
            <Link to="/categories" className="flex flex-row items-center justify-center gap-3 p-6 rounded-3xl bg-ethereal-surface-dim border border-ethereal-outline hover:border-ethereal-primary/50 shadow-ambient transition-all hover:-translate-y-1 group">
              <BookHeart strokeWidth={2} size={22} className="text-ethereal-primary" />
              <span className="text-label text-ethereal-tertiary">Collections</span>
            </Link>
          </div>
        </motion.div>

        {isLoading ? (
          <div className="flex justify-center py-20"><LoadingSpinner size="lg" /></div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">

            {/* Featured Memory (Left Col / Top on mobile) */}
            <motion.section
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="lg:col-span-7 flex flex-col"
            >
              <div className="flex items-center justify-between mb-6 px-2">
                <div className="flex items-center gap-3">
                  <Clock size={20} className="text-ethereal-primary" />
                  <h2 className="text-2xl font-heading text-ethereal-tertiary tracking-tight">Recent Highlight</h2>
                </div>
                <Link to="/memories" className="text-label text-ethereal-primary hover:text-ethereal-tertiary transition-colors flex items-center gap-1">
                  View Gallery <Images size={14} />
                </Link>
              </div>

              {featuredMemory ? (
                <>
                  <div className="w-full relative group shadow-ambient rounded-[2rem] overflow-hidden border-2 border-ethereal-outline/50 transition-all duration-500 hover:shadow-xl hover:border-ethereal-primary/30 min-h-[400px]">
                    <MemoryCard memory={featuredMemory} featured={true} />
                  </div>

                  {memories.length > 1 && (
                    <div className="mt-8 grid grid-cols-2 gap-6">
                      {memories.slice(1).map((memory) => (
                        <div key={memory._id} className="aspect-square">
                          <MemoryCard memory={memory} featured={false} />
                        </div>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <div className="aspect-[4/3] w-full rounded-[2rem] flex flex-col items-center justify-center text-center bg-ethereal-surface-dim border-2 border-dashed border-ethereal-outline shadow-ambient p-10">
                  <div className="w-16 h-16 rounded-full bg-ethereal-primary/10 flex items-center justify-center mb-6">
                    <Images size={28} strokeWidth={1.5} className="text-ethereal-primary" />
                  </div>
                  <h3 className="text-2xl font-heading text-ethereal-tertiary mb-3">A blank canvas</h3>
                  <p className="text-ethereal-tertiary/60 text-sm mb-8 max-w-[280px] leading-relaxed">Your gallery is waiting to be filled. Upload a photo to begin building your shared timeline.</p>
                  <Link to="/memories/new" className="btn-primary py-3 px-8 text-sm shadow-lg shadow-ethereal-primary/20">Save a memory</Link>
                </div>
              )}
            </motion.section>

            {/* Upcoming / Reels (Right Col / Bottom on mobile) */}
            <motion.section
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="lg:col-span-5 flex flex-col"
            >
              <div className="flex items-center justify-between mb-6 px-2">
                <div className="flex items-center gap-3">
                  <Film size={20} className="text-ethereal-primary" />
                  <h2 className="text-2xl font-heading text-ethereal-tertiary tracking-tight">Saved Reels</h2>
                </div>
                <Link to="/reels" className="text-label text-ethereal-primary hover:text-ethereal-tertiary transition-colors">
                  All Reels
                </Link>
              </div>

              {reels.length === 0 ? (
                <div className="flex-1 rounded-[2rem] p-10 flex flex-col items-center justify-center text-center bg-ethereal-surface-dim border border-ethereal-outline shadow-ambient">
                  <div className="w-16 h-16 rounded-full bg-ethereal-primary/10 flex items-center justify-center mb-6">
                    <Film size={28} strokeWidth={1.5} className="text-ethereal-primary" />
                  </div>
                  <h3 className="text-xl font-heading text-ethereal-tertiary mb-2">No activities planned</h3>
                  <p className="text-ethereal-tertiary/60 text-sm mb-6 leading-relaxed">Save Instagram reels or TikToks to recreate them later.</p>
                  <Link to="/reels/new" className="text-ethereal-primary font-bold text-sm hover:underline tracking-wide">Add a Reel</Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {reels.map((r) => <ReelCard key={r._id} reel={r} compact />)}

                  {reels.length >= 3 && (
                    <Link to="/reels" className="block w-full py-4 text-center rounded-2xl border border-ethereal-outline text-ethereal-tertiary text-sm font-semibold hover:bg-ethereal-surface-dim transition-colors mt-4">
                      View all saved reels
                    </Link>
                  )}
                </div>
              )}

              {/* Recent Letters */}
              <div className="mt-12 flex flex-col">
                <div className="flex items-center justify-between mb-6 px-2">
                  <div className="flex items-center gap-3">
                    <Mail size={20} className="text-ethereal-primary" />
                    <h2 className="text-2xl font-heading text-ethereal-tertiary tracking-tight">Recent Letters</h2>
                  </div>
                  <Link to="/letters" className="text-label text-ethereal-primary hover:text-ethereal-tertiary transition-colors">
                    All Letters
                  </Link>
                </div>

                {letters.length === 0 ? (
                  <div className="flex-1 rounded-[2rem] p-8 flex flex-col items-center justify-center text-center bg-ethereal-surface-dim border border-ethereal-outline shadow-ambient">
                    <div className="w-12 h-12 rounded-full bg-ethereal-primary/10 flex items-center justify-center mb-4">
                      <Mail size={20} className="text-ethereal-primary" />
                    </div>
                    <p className="text-ethereal-tertiary/60 text-sm mb-4">No letters yet.</p>
                    <Link to="/letters/new" className="text-ethereal-primary font-bold text-sm hover:underline tracking-wide">Write one</Link>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-3">
                    {letters.slice(0, 4).map((letter) => (
                      <Link
                        key={letter._id}
                        to={`/letters/${letter._id}`}
                        className="group flex items-center justify-between p-4 rounded-2xl bg-ethereal-surface-dim border border-ethereal-outline hover:border-ethereal-primary/40 hover:shadow-ambient transition-all duration-300"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-ethereal-primary/5 flex items-center justify-center text-ethereal-primary group-hover:scale-110 transition-transform shadow-sm">
                            <Mail size={18} strokeWidth={1.5} />
                          </div>
                          <span className="font-semibold text-sm tracking-wide text-ethereal-tertiary">{letter.title}</span>
                        </div>
                        <ArrowRight size={16} className="text-ethereal-tertiary/30 group-hover:text-ethereal-primary group-hover:translate-x-1 transition-all" />
                      </Link>
                    ))}
                    {letters.length > 4 && (
                      <Link to="/letters" className="flex items-center justify-center gap-2 p-4 mt-2 rounded-2xl border border-dashed border-ethereal-outline text-ethereal-tertiary text-xs uppercase tracking-widest font-semibold hover:bg-ethereal-surface-dim transition-colors">
                        View All Letters
                      </Link>
                    )}
                  </div>
                )}
              </div>
            </motion.section>

          </div>
        )}

        {/* My Info & Our Space Section */}
        {!isLoading && (
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12"
          >
            {/* My Info Widget */}
            <div className="flex flex-col">
              <div className="flex items-center justify-between mb-6 px-2">
                <div className="flex items-center gap-3">
                  <User size={20} className="text-ethereal-primary" />
                  <h2 className="text-2xl font-heading text-ethereal-tertiary tracking-tight">My Info</h2>
                </div>
                <Link to="/profile" className="text-label text-ethereal-primary hover:text-ethereal-tertiary transition-colors">
                  Edit Profile
                </Link>
              </div>
              
              <div className="group relative overflow-hidden bg-gradient-to-br from-ethereal-surface-dim to-ethereal-surface p-8 rounded-[2rem] border border-ethereal-outline shadow-ambient transition-all duration-500 hover:shadow-xl hover:border-ethereal-primary/40 h-full flex flex-col">
                <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity pointer-events-none">
                  <User size={160} strokeWidth={1} className="text-ethereal-primary transform translate-x-8 -translate-y-8" />
                </div>
                
                <div className="relative z-10 flex items-center gap-6 mb-6">
                  <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-ethereal-primary/20 shadow-sm flex-shrink-0 bg-ethereal-surface">
                    {user?.avatarUrl ? (
                      <img src={user.avatarUrl} alt={user.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-ethereal-primary/10 flex items-center justify-center">
                        <span className="font-heading text-2xl font-bold text-ethereal-primary opacity-70">
                          {user?.name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                        </span>
                      </div>
                    )}
                  </div>
                  <div>
                    <h3 className="text-2xl font-heading text-ethereal-tertiary">{user?.name}</h3>
                    {user?.nickname && <p className="text-ethereal-primary/80 font-medium italic">"{user.nickname}"</p>}
                  </div>
                </div>
                
                <p className="text-ethereal-tertiary/70 text-sm leading-relaxed mb-8 flex-1">
                  {user?.bio || 'Add a bio to express yourself...'}
                </p>
                
                <div className="grid grid-cols-2 gap-4 mt-auto">
                  <div className="flex flex-col">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-ethereal-tertiary/40 mb-1">Birthday</span>
                    <span className="text-sm font-medium text-ethereal-tertiary">{user?.dateOfBirth ? new Date(user.dateOfBirth).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : 'Not set'}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-ethereal-tertiary/40 mb-1">Status</span>
                    <span className="text-sm font-medium text-ethereal-tertiary capitalize">{user?.currentStatus || 'happy'}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Our Space Widget */}
            <div className="flex flex-col">
              <div className="flex items-center justify-between mb-6 px-2">
                <div className="flex items-center gap-3">
                  <Users size={20} className="text-ethereal-primary" />
                  <h2 className="text-2xl font-heading text-ethereal-tertiary tracking-tight">Our Space</h2>
                </div>
                <Link to="/profile" className="text-label text-ethereal-primary hover:text-ethereal-tertiary transition-colors">
                  View All
                </Link>
              </div>
              
              <div className="group relative overflow-hidden bg-gradient-to-bl from-ethereal-surface-dim to-ethereal-surface p-8 rounded-[2rem] border border-ethereal-outline shadow-ambient transition-all duration-500 hover:shadow-xl hover:border-ethereal-primary/40 h-full flex flex-col">
                <div className="absolute bottom-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity pointer-events-none transform -scale-x-100">
                  <Heart size={160} strokeWidth={1} className="text-ethereal-primary transform translate-x-8 translate-y-8" />
                </div>
                
                <div className="relative z-10 flex-1 flex flex-col">
                  <div className="mb-6">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-ethereal-tertiary/40 mb-1 block">Couple Name</span>
                    <h3 className="text-2xl font-heading text-ethereal-primary">{couple?.coupleNickname || `${myName} & ${partnerName}`}</h3>
                    {couple?.relationshipStatus && <p className="text-ethereal-tertiary/60 text-sm mt-1">{couple.relationshipStatus}</p>}
                  </div>
                  
                  {/* Bucket List Preview */}
                  <div className="mb-6">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-ethereal-tertiary/40 flex items-center gap-1"><ListTodo size={12}/> Bucket List</span>
                    </div>
                    {couple?.bucketList?.length > 0 ? (
                      <ul className="space-y-3">
                        {couple.bucketList.slice(0, 3).map((item, idx) => (
                          <li key={idx} className="flex items-start gap-3 text-sm text-ethereal-tertiary">
                            <div className={`mt-0.5 w-4 h-4 rounded-full flex items-center justify-center border shrink-0 transition-colors ${item.isCompleted ? 'bg-ethereal-primary border-ethereal-primary text-white' : 'border-ethereal-outline'}`}>
                              {item.isCompleted && <Check size={10} />}
                            </div>
                            <span className={`${item.isCompleted ? 'line-through opacity-50' : ''} leading-tight`}>{item.title}</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                       <p className="text-sm text-ethereal-tertiary/50 italic bg-ethereal-surface/50 p-3 rounded-xl border border-ethereal-outline/30">No bucket list items yet. Plan your next adventure!</p>
                    )}
                  </div>

                  {/* Milestones Preview */}
                  <div className="mt-auto">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-ethereal-tertiary/40 flex items-center gap-1"><Star size={12}/> Recent Milestone</span>
                    </div>
                    {couple?.milestones?.length > 0 ? (
                      <div className="p-4 bg-ethereal-surface/80 rounded-xl border border-ethereal-outline/50 shadow-sm flex items-center justify-between group-hover:border-ethereal-primary/30 transition-colors">
                        <div>
                          <p className="font-medium text-sm text-ethereal-tertiary mb-1">{couple.milestones[couple.milestones.length - 1].title}</p>
                          <p className="text-xs text-ethereal-primary">{new Date(couple.milestones[couple.milestones.length - 1].date).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}</p>
                        </div>
                        <div className="w-8 h-8 rounded-full bg-ethereal-primary/10 flex items-center justify-center text-ethereal-primary">
                          <Star size={14} />
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm text-ethereal-tertiary/50 italic bg-ethereal-surface/50 p-3 rounded-xl border border-ethereal-outline/30">No milestones recorded. Mark a special moment!</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </motion.section>
        )}
          </>
        )}
        
        {activeTab === 'ideas' && (
          <motion.div key="ideas" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full">
             <IdeasJar couple={couple} />
          </motion.div>
        )}

        {activeTab === 'map' && (
          <motion.div key="map" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full">
             <MapTab />
          </motion.div>
        )}

        {activeTab === 'prompts' && (
          <motion.div key="prompts" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full">
             <PromptTab partnerName={partnerName} />
          </motion.div>
        )}
      </div>
    </div>
  );
}
