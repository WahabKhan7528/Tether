import { Heart, ListTodo, Check, Trash2, HeartHandshake, MapPin } from 'lucide-react';
import { formatDate } from './ProfileHelpers';

export default function CoupleSettings({
  user,
  partner,
  coupleNickname,
  setCoupleNickname,
  relationshipStatus,
  setRelationshipStatus,
  bucketList,
  milestones,
  handleCoupleSave,
  handleSendHug,
  handleToggleBucketList,
  handleAddBucketList,
  handleRemoveBucketList,
  handleAddMilestone,
  handleRemoveMilestone,
  getDaysAgoText
}) {
  return (
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

        {/* Right Column: Interaction */}
        <div className="space-y-6 flex flex-col h-[26rem]">
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
  );
}
