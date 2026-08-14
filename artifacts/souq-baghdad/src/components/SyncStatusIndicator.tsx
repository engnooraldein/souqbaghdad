import React from 'react';
import { Facebook, Instagram, Send, AlertCircle, Loader2, CheckCircle2 } from 'lucide-react';

interface SyncStatusIndicatorProps {
  status?: {
    facebook?: 'pending' | 'success' | 'failed';
    instagram?: 'pending' | 'success' | 'failed';
    telegram?: 'pending' | 'success' | 'failed';
  };
}

export function SyncStatusIndicator({ status }: SyncStatusIndicatorProps) {
  if (!status) return null;

  const renderIcon = (platform: string, state?: 'pending' | 'success' | 'failed') => {
    let Icon = Facebook;
    if (platform === 'instagram') Icon = Instagram;
    if (platform === 'telegram') Icon = Send;

    let colorClass = 'text-gray-400';
    let StateIcon = null;

    if (state === 'success') {
      colorClass = 'text-green-500';
      StateIcon = <CheckCircle2 className="w-3 h-3 absolute -bottom-1 -right-1 text-green-500 bg-white rounded-full" />;
    } else if (state === 'failed') {
      colorClass = 'text-red-500';
      StateIcon = <AlertCircle className="w-3 h-3 absolute -bottom-1 -right-1 text-red-500 bg-white rounded-full" />;
    } else {
      StateIcon = <Loader2 className="w-3 h-3 absolute -bottom-1 -right-1 text-gray-400 bg-white rounded-full animate-spin" />;
    }

    return (
      <div className="relative inline-flex items-center justify-center p-1" title={`${platform}: ${state || 'pending'}`}>
        <Icon className={`w-4 h-4 ${colorClass}`} />
        {StateIcon}
      </div>
    );
  };

  return (
    <div className="flex items-center gap-2 bg-gray-50 rounded-full px-2 py-1 border border-gray-100 shadow-sm mt-2 max-w-fit">
      {renderIcon('facebook', status.facebook)}
      {renderIcon('instagram', status.instagram)}
      {renderIcon('telegram', status.telegram)}
    </div>
  );
}
