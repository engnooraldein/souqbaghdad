import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { 
  Rocket, Check, AlertCircle, Sparkles, X, 
  Send, ShieldCheck, DollarSign, CheckCircle2,
  Share2, Radio, Instagram, MessageCircle, Globe
} from 'lucide-react';

interface BoostAdModalProps {
  isOpen: boolean;
  onClose: () => void;
  ad: any;
  onSuccess?: () => void;
}

interface ChannelOption {
  id: string;
  name: string;
  category: string;
  is_active: boolean;
  post_enabled: boolean;
  story_enabled: boolean;
  post_price: number;
  story_price: number;
  icon: string;
}

export const BoostAdModal: React.FC<BoostAdModalProps> = ({
  isOpen,
  onClose,
  ad,
  onSuccess
}) => {
  const [channels, setChannels] = useState<ChannelOption[]>([]);
  const [selectedChannels, setSelectedChannels] = useState<Record<string, { post: boolean; story: boolean }>>({});
  const [loading, setLoading] = useState(true);
  const [publishing, setPublishing] = useState(false);
  const [successResult, setSuccessResult] = useState<any | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadChannels();
      setSuccessResult(null);
      setErrorMsg(null);
    }
  }, [isOpen, ad]);

  const loadChannels = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('social_settings')
        .select('*')
        .order('id');

      if (!error && data) {
        const isRafdain = ad?.category === 'transport' && (
          (ad?.title && ad.title.includes('الرافدين')) ||
          (ad?.city && ad.city.includes('الرافدين')) ||
          (ad?.location && ad.location.includes('الرافدين')) ||
          (ad?.description && JSON.stringify(ad.description).includes('الرافدين'))
        );

        const initialSelected: Record<string, { post: boolean; story: boolean }> = {};

        const mapped: ChannelOption[] = data
          .filter(item => {
            if (!item.is_active) return false;
            if (item.id === 'system_alerts' || item.id === 'whatsapp') return false;
            if ((item.id === 'fb_rafdain' || item.id === 'ig_rafdain') && !isRafdain) return false;
            return true;
          })
          .map(item => {
            const postPrice = parseFloat(item.post_price || 0);
            const storyPrice = parseFloat(item.story_price || 0);
            
            // Auto-select active channels initially
            initialSelected[item.id] = {
              post: item.post_enabled !== false,
              story: item.story_enabled !== false
            };

            return {
              id: item.id,
              name: item.name,
              category: item.category || 'social',
              is_active: item.is_active !== false,
              post_enabled: item.post_enabled !== false,
              story_enabled: item.story_enabled !== false,
              post_price: postPrice,
              story_price: storyPrice,
              icon: item.category === 'facebook' ? '🔵' :
                    item.category === 'instagram' ? '📸' :
                    item.category === 'telegram' ? '✈️' :
                    item.category === 'threads' ? '🧵' : '🌐'
            };
          });

        setChannels(mapped);
        setSelectedChannels(initialSelected);
      }
    } catch (e) {
      console.error('Failed to load channels:', e);
    } finally {
      setLoading(false);
    }
  };

  const toggleOption = (channelId: string, type: 'post' | 'story') => {
    setSelectedChannels(prev => {
      const current = prev[channelId] || { post: false, story: false };
      return {
        ...prev,
        [channelId]: {
          ...current,
          [type]: !current[type]
        }
      };
    });
  };

  // Compute Total Price
  const totalPrice = channels.reduce((sum, ch) => {
    const sel = selectedChannels[ch.id];
    let chSum = 0;
    if (sel?.post && ch.post_enabled) chSum += ch.post_price;
    if (sel?.story && ch.story_enabled) chSum += ch.story_price;
    return sum + chSum;
  }, 0);

  const handlePublishNow = async () => {
    if (!ad) return;
    setPublishing(true);
    setErrorMsg(null);

    try {
      const isPostTelegram = selectedChannels['tg_channels']?.post;
      const isPostFb = selectedChannels['fb_souq']?.post || selectedChannels['fb_rafdain']?.post;
      const isPostIg = selectedChannels['ig_souq']?.post || selectedChannels['ig_rafdain']?.post;
      const isPostThreads = selectedChannels['threads']?.post;

      const payload = {
        type: 'INSERT',
        table: ad.price !== undefined && ad.seats !== undefined ? 'ads' : (ad.category ? 'ads' : 'products'),
        record: ad,
        targets: {
          telegram: Boolean(isPostTelegram),
          facebook: Boolean(isPostFb),
          instagram: Boolean(isPostIg),
          threads: Boolean(isPostThreads),
          tiktok: false,
          custom_channels: selectedChannels
        }
      };

      const response = await fetch('https://lyhqnccpudwgvexqinxa.supabase.co/functions/v1/telegram-bot', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer sb_publishable_JH0HoX448K2Rqw38QOM5Gw_IsIXRAUf'
        },
        body: JSON.stringify(payload)
      });

      const resData = await response.json();
      setSuccessResult(resData);
      if (onSuccess) onSuccess();
    } catch (err: any) {
      setErrorMsg(err.message || 'فشل الترويج، يرجى المحاولة لاحقاً');
    } finally {
      setPublishing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl bg-gray-950 border border-amber-500/30 rounded-3xl p-6 shadow-2xl overflow-hidden text-right" dir="rtl">
        
        {/* Background Ambient Glow */}
        <div className="absolute top-0 right-1/4 w-72 h-72 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/4 w-72 h-72 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-800/80 pb-4 mb-5">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-br from-amber-500/20 to-orange-500/20 border border-amber-500/40 rounded-2xl text-amber-400">
              <Rocket className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <h3 className="text-xl font-black text-white flex items-center gap-2">
                روّج إعلانك على السوشيال ميديا 🚀
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40">
                  فوري
                </span>
              </h3>
              <p className="text-xs text-gray-400">
                اختر القنوات والمنصات التي تريد نشر إعلانك فيها لزيادة المشاهدات والوصول
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-white rounded-xl bg-gray-900 border border-gray-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Success View */}
        {successResult ? (
          <div className="py-8 text-center space-y-4">
            <div className="w-16 h-16 bg-emerald-500/20 border border-emerald-500/40 rounded-full flex items-center justify-center mx-auto text-emerald-400">
              <CheckCircle2 className="w-10 h-10 animate-bounce" />
            </div>
            <h4 className="text-2xl font-black text-white">تم ترويج ونشر إعلانك بنجاح! 🎉</h4>
            <p className="text-sm text-gray-300 max-w-md mx-auto">
              إعلانك الآن منشور وحي في المنصات المختارة مع الباركود التفاعلي وروابط التواصل المباشر.
            </p>
            <div className="pt-4">
              <button
                onClick={onClose}
                className="w-full py-3.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold rounded-2xl shadow-lg shadow-emerald-900/30"
              >
                رائع، تم! ✨
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Loading */}
            {loading ? (
              <div className="py-12 text-center text-gray-400">
                <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                <p className="text-xs">جاري تجهيز خيارات النشر والترويج المتاحة...</p>
              </div>
            ) : (
              <div className="space-y-4 max-h-[55vh] overflow-y-auto pr-1">
                
                {/* Ad Mini Preview */}
                {ad && (
                  <div className="p-3 bg-gray-900/60 border border-gray-800 rounded-2xl flex items-center justify-between">
                    <div>
                      <div className="text-xs font-bold text-white line-clamp-1">{ad.title || 'إعلان بدون عنوان'}</div>
                      <div className="text-[11px] text-gray-400 mt-0.5">كود الإعلان: #{ad.short_id || ad.id?.slice(0, 5)}</div>
                    </div>
                    <span className="text-xs font-bold text-amber-400 px-2.5 py-1 bg-amber-500/10 border border-amber-500/20 rounded-xl">
                      {ad.category === 'transport' ? '🚌 خط نقل' : ad.category === 'vehicles' ? '🚗 سيارات' : '🛍️ منتج'}
                    </span>
                  </div>
                )}

                {/* Channels List */}
                <div className="space-y-3">
                  {channels.map(channel => {
                    const sel = selectedChannels[channel.id] || { post: false, story: false };
                    
                    return (
                      <div 
                        key={channel.id}
                        className="p-4 bg-gray-900/80 border border-gray-800 hover:border-gray-700 rounded-2xl transition-all space-y-3"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2.5">
                            <span className="text-xl">{channel.icon}</span>
                            <div>
                              <div className="text-sm font-bold text-white">{channel.name}</div>
                              <div className="text-[11px] text-gray-400">
                                {channel.category === 'telegram' ? 'قنوات رسمية موثقة' : 'صفحات ومتابعين حقيقيين'}
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Options Buttons (Post / Story) */}
                        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-gray-800/60">
                          {/* Post Option */}
                          <button
                            type="button"
                            disabled={!channel.post_enabled}
                            onClick={() => toggleOption(channel.id, 'post')}
                            className={`p-2.5 rounded-xl border text-xs font-bold flex items-center justify-between transition-all ${
                              !channel.post_enabled
                                ? 'bg-gray-950/40 border-gray-800 text-gray-600 cursor-not-allowed'
                                : sel.post
                                ? 'bg-amber-500/20 border-amber-500/50 text-amber-300'
                                : 'bg-gray-950 border-gray-800 text-gray-400 hover:border-gray-700'
                            }`}
                          >
                            <span className="flex items-center gap-1.5">
                              <span className={`w-3.5 h-3.5 rounded border flex items-center justify-center ${sel.post ? 'bg-amber-500 border-amber-400 text-black' : 'border-gray-600'}`}>
                                {sel.post && <Check className="w-3 h-3" />}
                              </span>
                              منشور (Feed)
                            </span>
                            <span className="text-[11px] font-normal">
                              {channel.post_enabled ? (channel.post_price === 0 ? 'مجاناً 🎁' : `${channel.post_price} د.ع`) : 'غير متوفر'}
                            </span>
                          </button>

                          {/* Story Option */}
                          <button
                            type="button"
                            disabled={!channel.story_enabled}
                            onClick={() => toggleOption(channel.id, 'story')}
                            className={`p-2.5 rounded-xl border text-xs font-bold flex items-center justify-between transition-all ${
                              !channel.story_enabled
                                ? 'bg-gray-950/40 border-gray-800 text-gray-600 cursor-not-allowed'
                                : sel.story
                                ? 'bg-purple-500/20 border-purple-500/50 text-purple-300'
                                : 'bg-gray-950 border-gray-800 text-gray-400 hover:border-gray-700'
                            }`}
                          >
                            <span className="flex items-center gap-1.5">
                              <span className={`w-3.5 h-3.5 rounded border flex items-center justify-center ${sel.story ? 'bg-purple-500 border-purple-400 text-white' : 'border-gray-600'}`}>
                                {sel.story && <Check className="w-3 h-3" />}
                              </span>
                              ستوري (Story 9:16)
                            </span>
                            <span className="text-[11px] font-normal">
                              {channel.story_enabled ? (channel.story_price === 0 ? 'مجاناً 🎁' : `${channel.story_price} د.ع`) : 'غير متوفر'}
                            </span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Error Message */}
                {errorMsg && (
                  <div className="p-3 bg-red-950/60 border border-red-800 rounded-xl text-xs text-red-300 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                    {errorMsg}
                  </div>
                )}
              </div>
            )}

            {/* Footer Summary & Action */}
            <div className="pt-4 border-t border-gray-800/80 flex items-center justify-between gap-4 mt-4">
              <div>
                <div className="text-[11px] text-gray-400">إجمالي تكلفة الترويج</div>
                <div className="text-lg font-black text-amber-400">
                  {totalPrice === 0 ? '0 د.ع (مجاناً لفترة محدودة 🎁)' : `${totalPrice.toLocaleString()} د.ع`}
                </div>
              </div>

              <button
                type="button"
                onClick={handlePublishNow}
                disabled={publishing || loading}
                className="px-6 py-3 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-400 hover:to-orange-400 text-black font-black text-sm rounded-2xl shadow-xl shadow-amber-500/20 flex items-center gap-2 disabled:opacity-50 transition-all"
              >
                <Rocket className={`w-4 h-4 ${publishing ? 'animate-spin' : ''}`} />
                {publishing ? 'جاري النشر في المنصات...' : '🚀 انشر وروّج إعلاني الآن'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
