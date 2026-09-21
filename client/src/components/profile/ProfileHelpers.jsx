import { useState, useRef, useEffect, memo } from 'react';
import { Camera, Check, Edit2, Lock, X } from 'lucide-react';
import { motion } from 'framer-motion';
import LoadingSpinner, { ThreeDotsLoader } from '../LoadingSpinner';
import CustomDatePicker from '../CustomDatePicker';
import PasswordInput from '../ui/PasswordInput';
import { changePassword } from '../../api/profile';

export function formatDate(dateStr) {
  if (!dateStr) return null;
  try {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric', month: 'long', day: 'numeric',
    });
  } catch {
    return null;
  }
}

export function getAnniversaryCountdown(dateStr) {
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

export function GenderBadge({ gender }) {
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

export const AvatarPicker = memo(function AvatarPicker({ avatarUrl, name, onUpload, loading }) {
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

export const EditableField = memo(function EditableField({ label, value, onSave, type = 'text', maxLength, icon: Icon, multiline = false, pickerPlacement = 'bottom' }) {
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

export function ChangePasswordModal({ onClose }) {
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
                {loading ? <ThreeDotsLoader size="md" /> : 'Update'}
              </button>
            </div>
          </form>
        )}
      </motion.div>
    </motion.div>
  );
}
