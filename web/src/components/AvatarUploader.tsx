'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { appImageSrc } from '@/components/AppImage';

interface AvatarUploaderProps {
  currentAvatarUrl: string | null;
  userName: string;
}

export function AvatarUploader({ currentAvatarUrl, userName }: AvatarUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(currentAvatarUrl);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Show instant preview
    setPreview(URL.createObjectURL(file));
    setUploading(true);

    try {
      const formData = new FormData();
      formData.append('image', file);

      const res = await fetch('/api/user/avatar', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        throw new Error('Upload failed');
      }

      const data = await res.json();
      setPreview(data.avatar_url);
      router.refresh(); // Refresh the server component to fetch new data
    } catch (err) {
      alert('Failed to upload avatar. Please try again.');
      setPreview(currentAvatarUrl);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="flex flex-col items-center gap-3">
      <div 
        className="relative group cursor-pointer w-24 h-24 rounded-full overflow-hidden border-2 border-gray-200 hover:border-gearup-600 transition"
        onClick={() => fileInputRef.current?.click()}
      >
        {preview ? (
          <img 
            src={appImageSrc(preview)} 
            alt={userName} 
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gearup-600 text-white flex items-center justify-center text-3xl font-bold">
            {userName.charAt(0).toUpperCase()}
          </div>
        )}
        
        {/* Hover overlay */}
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
          <span className="text-white text-xs font-semibold text-center px-1">
            {uploading ? 'Uploading...' : 'Change Photo'}
          </span>
        </div>
      </div>

      <input 
        type="file" 
        ref={fileInputRef} 
        className="hidden" 
        accept="image/*"
        onChange={handleFileSelect} 
        disabled={uploading}
      />
    </div>
  );
}