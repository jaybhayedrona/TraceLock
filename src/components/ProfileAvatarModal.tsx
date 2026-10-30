import { useState, useRef } from 'react';
import { Camera, Upload, Trash2, X, CheckCircle2, AlertCircle, Shield } from 'lucide-react';
import { User } from '../types';
import { uploadProfilePicture, removeProfilePicture } from '../api';

interface ProfileAvatarModalProps {
  user: User;
  onClose: () => void;
  onSuccess: (updatedUser: User) => void;
}

export function ProfileAvatarModal({ user, onClose, onSuccess }: ProfileAvatarModalProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate image format
    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      setError('Please select a valid image format: JPEG, PNG, or WebP.');
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      setError('Image file size must be less than 2MB.');
      return;
    }

    setSelectedFile(file);
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
  };

  const handleUpload = async () => {
    if (!selectedFile) return;
    setLoading(true);
    setError(null);
    try {
      const res = await uploadProfilePicture(selectedFile);
      setSuccess('Profile picture updated successfully!');
      setTimeout(() => {
        onSuccess(res.user);
        onClose();
      }, 1000);
    } catch (err: any) {
      setError(err.message || 'Failed to upload profile picture.');
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await removeProfilePicture();
      setSuccess('Profile picture removed. Reverted to default avatar.');
      setSelectedFile(null);
      setPreviewUrl(null);
      setTimeout(() => {
        onSuccess(res.user);
        onClose();
      }, 1000);
    } catch (err: any) {
      setError(err.message || 'Failed to remove profile picture.');
    } finally {
      setLoading(false);
    }
  };

  const currentDisplayAvatar = previewUrl || user.avatarUrl;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-xl max-w-md w-full shadow-2xl border border-[#E2E8F0] overflow-hidden">
        {/* Modal Header */}
        <div className="px-6 py-4 bg-[#243B6B] text-white flex items-center justify-between border-b border-[#1E3159]">
          <div className="flex items-center gap-2">
            <Camera className="w-5 h-5 text-[#4776D0]" />
            <h2 className="text-base font-bold">Manage Profile Picture</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-white/70 hover:text-white rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-[#DC2626] text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-[#DC2626] shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-[#15966A] text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-[#15966A] shrink-0" />
              <span>{success}</span>
            </div>
          )}

          {/* Avatar Preview */}
          <div className="flex flex-col items-center justify-center space-y-3">
            <div className="relative group">
              <div className="w-28 h-28 rounded-xl overflow-hidden border-2 border-[#4776D0]/30 shadow-md bg-[#F5F7FB] flex items-center justify-center">
                {currentDisplayAvatar ? (
                  <img
                    src={currentDisplayAvatar}
                    alt={user.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-[#243B6B] to-[#4776D0] text-white font-bold text-3xl">
                    {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="absolute -bottom-2 -right-2 p-2 bg-[#4776D0] text-white rounded-lg shadow-lg hover:bg-[#243B6B] transition-colors cursor-pointer"
                title="Choose new picture"
              >
                <Upload className="w-4 h-4" />
              </button>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleFileChange}
              className="hidden"
            />

            <div className="text-center">
              <div className="text-sm font-semibold text-[#172033]">{user.name}</div>
              <div className="text-xs text-[#64748B] font-mono mt-0.5">{user.email}</div>
              <div className="text-[11px] text-[#243B6B] font-semibold mt-1">
                Family Role: {user.familyRole || 'Member'}
              </div>
            </div>
          </div>

          {/* Guidelines */}
          <div className="p-3.5 bg-[#F5F7FB] rounded-lg border border-[#E2E8F0] text-xs text-[#64748B] space-y-1">
            <div className="flex items-center gap-1.5 font-semibold text-[#243B6B]">
              <Shield className="w-3.5 h-3.5 text-[#4776D0]" />
              <span>Secure Profile Picture Guidelines</span>
            </div>
            <ul className="list-disc list-inside space-y-0.5 text-[11px] text-[#64748B]">
              <li>Supported file formats: JPEG, PNG, or WebP</li>
              <li>Maximum file size: 2 Megabytes (2MB)</li>
              <li>Visible on family cards, activity timelines, and shared document logs</li>
            </ul>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between gap-3 pt-2 border-t border-[#E2E8F0]">
            {user.avatarUrl ? (
              <button
                type="button"
                onClick={handleRemove}
                disabled={loading}
                className="px-3 py-2 text-[#DC2626] hover:bg-rose-50 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Remove Photo</span>
              </button>
            ) : (
              <div />
            )}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-[#E2E8F0] text-[#64748B] hover:bg-slate-50 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleUpload}
                disabled={!selectedFile || loading}
                className="px-4 py-2 bg-[#243B6B] hover:bg-[#1A2C52] text-white rounded-lg text-xs font-semibold transition-colors shadow-sm cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
              >
                {loading ? 'Saving...' : 'Save Picture'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
