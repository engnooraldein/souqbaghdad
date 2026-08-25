// @ts-nocheck
import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import {
  X, Share2, Facebook, Instagram, Send, ExternalLink, CheckCircle2,
  AlertTriangle, Loader2, Globe, Clock, Info, Copy, Check
} from 'lucide-react';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

interface SocialPublishModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: any;
  category: 'cars' | 'general' | 'transport';
  table: 'ads' | 'products' | 'transport_ads';
}

interface PublishResult {
  platform: string;
  success: boolean;
  url?: string;
  error?: string;
  postId?: string;
}

interface TokenInfo {
  id: string;
  name: string;
  category: string;
  is_active: boolean;
  last_status: string;
  last_error: string | null;
  issued_at?: number;
  expires_at?: number;
  isSystemUser?: boolean;
}

export function SocialPublishModal({ isOpen, onClose, item, category, table }: SocialPublishModalProps) {
  const [publishing, setPublishing] = useState(false);
  const [results, setResults] = useState<PublishResult[]>([]);
  const [done, setDone] = useState(false);
  const [tokenInfos, setTokenInfos] = useState<TokenInfo[]>([]);
  const [loadingTokens, setLoadingTokens] = useState(false);
  const [copied, setCopied] = useState('');

  useEffect(() => {
    if (isOpen) {
      setResults([]);
      setDone(false);
      loadTokenInfo();
    }
  }, [isOpen]);

  const loadTokenInfo = async () => {
    setLoadingTokens(true);
    try {
      const { data } = await supabase
        .from('social_settings')
        .select('id, name, category, is_active, last_status, last_error, access_token')
        .in('category', ['facebook', 'instagram']);

      if (data && data.length > 0) {
        // Debug tokens via Meta API
        const enriched: TokenInfo[] = [];
        for (const setting of data) {
          if (!setting.access_token) {
            enriched.push({ ...setting });
            continue;
          }
          try {
            const res = await fetch(
              `https://graph.facebook.com/v19.0/debug_token?input_token=${setting.access_token}&access_token=${setting.access_token}`
            );
            const debug = await res.json();
            const d = debug.data || {};
            enriched.push({
              ...setting,
              issued_at: d.issued_at,
              expires_at: d.expires_at,
              isSystemUser: d.type === 'SYSTEM_USER',
            });
          } catch {
            enriched.push({ ...setting });
          }
        }
        setTokenInfos(enriched);
      }
    } catch (err) {
      console.error('loadTokenInfo error:', err);
    } finally {
      setLoadingTokens(false);
    }
  };

  const handlePublish = async () => {
    if (!item) return;
    setPublishing(true);
    setResults([]);
    try {
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/telegram-bot`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify({
            action: 'republish',
            record_id: item.id || item.short_id,
            table,
            category,
          }),
        }
      );
      const data = await res.json();

      // Build result list from response
      const newResults: PublishResult[] = [];

      // Telegram
      if (data.telegram_message_id || data.tg_ok) {
        const channelId = category === 'transport'
          ? '@souqbaghdad_lines'
          : category === 'cars'
          ? '@souqbaghdad_car'
          : '@souqbaghdad_iq';
        newResults.push({
          platform: 'تيليجرام',
          success: true,
          url: `https://t.me/${channelId.replace('@', '')}`,
          postId: String(data.telegram_message_id || ''),
        });
      } else if (data.tg_error) {
        newResults.push({ platform: 'تيليجرام', success: false, error: data.tg_error });
      }

      // Facebook
      if (data.facebook_post_id) {
        newResults.push({
          platform: 'فيسبوك',
          success: true,
          url: `https://www.facebook.com/${data.facebook_post_id}`,
          postId: data.facebook_post_id,
        });
      } else if (data.fb_error) {
        newResults.push({ platform: 'فيسبوك', success: false, error: data.fb_error });
      }

      // Instagram
      if (data.instagram_post_id) {
        newResults.push({
          platform: 'انستكرام',
          success: true,
          url: `https://www.instagram.com/p/${data.instagram_post_id}/`,
          postId: data.instagram_post_id,
        });
      } else if (data.ig_error) {
        newResults.push({ platform: 'انستكرام', success: false, error: data.ig_error });
      }

      // Threads
      if (data.threads_post_id) {
        newResults.push({
          platform: 'ثريدز',
          success: true,
          postId: data.threads_post_id,
        });
      }

      // If no specific results from response, check if it succeeded overall
      if (newResults.length === 0) {
        if (data.success || data.ok) {
          newResults.push({ platform: 'المنصات', success: true });
        } else {
          newResults.push({
            platform: 'خطأ',
            success: false,
            error: data.error || data.message || 'حدث خطأ غير معروف',
          });
        }
      }

      setResults(newResults);
      setDone(true);

      // Update the record's post IDs in database
      if (data.facebook_post_id && table !== 'transport_ads') {
        await supabase.from(table).update({
          facebook_post_id: data.facebook_post_id,
          ...(data.instagram_post_id ? { instagram_post_id: data.instagram_post_id } : {}),
          ...(data.telegram_message_id ? { telegram_message_id: String(data.telegram_message_id) } : {}),
        }).eq('id', item.id);
      }
    } catch (err: any) {
      setResults([{ platform: 'خطأ فني', success: false, error: err.message }]);
      setDone(true);
    } finally {
      setPublishing(false);
    }
  };

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(key);
      setTimeout(() => setCopied(''), 2000);
    });
  };

  const formatTokenDate = (unixTs?: number) => {
    if (!unixTs) return null;
    return new Date(unixTs * 1000).toLocaleDateString('ar-IQ', {
      year: 'numeric', month: 'long', day: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  };

  if (!isOpen) return null;

  const itemLink = item
    ? `https://www.souqbaghdad.store/${
        table === 'transport_ads' ? 'transport' : table === 'products' ? 'product' : 'product'
      }/${item.short_id || item.id}`
    : '';

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-700 bg-gradient-to-r from-blue-900/30 to-purple-900/30">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/20 rounded-xl">
              <Share2 className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <h2 className="text-white font-bold text-lg">نشر على المنصات</h2>
              <p className="text-gray-400 text-xs line-clamp-1">{item?.title || 'إعلان'}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-700 rounded-xl transition">
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">

          {/* رابط مباشر للإعلان */}
          {itemLink && (
            <div className="bg-gray-800/50 rounded-xl p-3 border border-gray-700">
              <p className="text-gray-400 text-xs mb-2 flex items-center gap-1">
                <Globe className="w-3 h-3" />
                رابط الإعلان المباشر
              </p>
              <div className="flex items-center gap-2">
                <a
                  href={itemLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 text-blue-400 text-sm hover:text-blue-300 truncate"
                >
                  {itemLink}
                </a>
                <button
                  onClick={() => copyToClipboard(itemLink, 'link')}
                  className="p-1.5 bg-gray-700 rounded-lg hover:bg-gray-600 transition"
                >
                  {copied === 'link' ? (
                    <Check className="w-4 h-4 text-green-400" />
                  ) : (
                    <Copy className="w-4 h-4 text-gray-400" />
                  )}
                </button>
                <a
                  href={itemLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-1.5 bg-gray-700 rounded-lg hover:bg-gray-600 transition"
                >
                  <ExternalLink className="w-4 h-4 text-gray-400" />
                </a>
              </div>
            </div>
          )}

          {/* حالة التوكن */}
          <div className="space-y-2">
            <p className="text-gray-400 text-xs flex items-center gap-1.5">
              <Info className="w-3 h-3" />
              حالة توكنات المنصات
            </p>
            {loadingTokens ? (
              <div className="flex items-center gap-2 text-gray-400 text-sm p-3">
                <Loader2 className="w-4 h-4 animate-spin" />
                جاري فحص التوكنات...
              </div>
            ) : tokenInfos.map((t) => (
              <div
                key={t.id}
                className={`p-3 rounded-xl border text-sm ${
                  t.is_active && t.last_status === 'active'
                    ? 'bg-green-900/20 border-green-700/40'
                    : 'bg-red-900/20 border-red-700/40'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-white font-medium flex items-center gap-1.5">
                    {t.category === 'facebook' ? (
                      <Facebook className="w-4 h-4 text-blue-400" />
                    ) : (
                      <Instagram className="w-4 h-4 text-pink-400" />
                    )}
                    {t.name}
                  </span>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${
                    t.is_active && t.last_status === 'active'
                      ? 'bg-green-500/20 text-green-400'
                      : 'bg-red-500/20 text-red-400'
                  }`}>
                    {t.is_active && t.last_status === 'active' ? '✅ فعال' : '❌ غير فعال'}
                  </span>
                </div>

                {t.isSystemUser && (
                  <p className="text-green-400 text-xs flex items-center gap-1 mt-1">
                    <CheckCircle2 className="w-3 h-3" />
                    System User Token — لا ينتهي تلقائياً ✨
                  </p>
                )}

                {t.issued_at && (
                  <p className="text-gray-400 text-xs flex items-center gap-1 mt-1">
                    <Clock className="w-3 h-3" />
                    تاريخ الإصدار: {formatTokenDate(t.issued_at)}
                  </p>
                )}

                {t.expires_at && t.expires_at > 0 ? (
                  <p className={`text-xs flex items-center gap-1 mt-1 ${
                    t.expires_at - Date.now() / 1000 < 7 * 86400
                      ? 'text-red-400'
                      : 'text-yellow-400'
                  }`}>
                    <AlertTriangle className="w-3 h-3" />
                    ينتهي في: {formatTokenDate(t.expires_at)}
                  </p>
                ) : t.isSystemUser ? null : (
                  <p className="text-gray-500 text-xs mt-1">مدة انتهاء التوكن: غير محدد</p>
                )}

                {t.last_error && (
                  <p className="text-red-400 text-xs mt-1 bg-red-900/20 rounded p-1.5">
                    ⚠️ {t.last_error}
                  </p>
                )}
              </div>
            ))}
          </div>

          {/* نتائج النشر */}
          {results.length > 0 && (
            <div className="space-y-2">
              <p className="text-gray-400 text-xs">نتائج النشر:</p>
              {results.map((r, i) => (
                <div
                  key={i}
                  className={`p-3 rounded-xl border flex items-start gap-3 ${
                    r.success
                      ? 'bg-green-900/20 border-green-700/40'
                      : 'bg-red-900/20 border-red-700/40'
                  }`}
                >
                  {r.success ? (
                    <CheckCircle2 className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                  ) : (
                    <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className={`font-bold text-sm ${r.success ? 'text-green-300' : 'text-red-300'}`}>
                      {r.platform} — {r.success ? 'تم النشر ✅' : 'فشل النشر ❌'}
                    </p>
                    {r.url && (
                      <a
                        href={r.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-400 text-xs hover:underline flex items-center gap-1 mt-1"
                      >
                        <ExternalLink className="w-3 h-3" />
                        عرض المنشور المباشر
                      </a>
                    )}
                    {r.postId && (
                      <div className="flex items-center gap-1 mt-1">
                        <p className="text-gray-400 text-xs truncate">ID: {r.postId}</p>
                        <button
                          onClick={() => copyToClipboard(r.postId!, `post_${i}`)}
                          className="p-0.5 hover:text-white"
                        >
                          {copied === `post_${i}` ? (
                            <Check className="w-3 h-3 text-green-400" />
                          ) : (
                            <Copy className="w-3 h-3 text-gray-500" />
                          )}
                        </button>
                      </div>
                    )}
                    {r.error && <p className="text-red-300 text-xs mt-1">سبب: {r.error}</p>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-gray-700 flex gap-3">
          {!done ? (
            <>
              <button
                onClick={onClose}
                className="flex-1 py-2.5 bg-gray-700 hover:bg-gray-600 text-white rounded-xl font-bold transition"
              >
                إلغاء
              </button>
              <button
                onClick={handlePublish}
                disabled={publishing}
                className="flex-1 py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white rounded-xl font-bold transition flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {publishing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    جاري النشر...
                  </>
                ) : (
                  <>
                    <Share2 className="w-4 h-4" />
                    🚀 نشر على كل المنصات
                  </>
                )}
              </button>
            </>
          ) : (
            <button
              onClick={onClose}
              className="flex-1 py-2.5 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl font-bold transition flex items-center justify-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4" />
              تم النشر — إغلاق
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
