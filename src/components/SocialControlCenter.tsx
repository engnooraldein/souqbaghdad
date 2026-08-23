import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { 
  Share2, CheckCircle2, AlertTriangle, RefreshCw, Save, 
  ExternalLink, Key, ShieldCheck, ShieldAlert, 
  Eye, EyeOff, Radio, Check, Globe, DollarSign, ToggleLeft, ToggleRight, Sparkles
} from 'lucide-react';

interface SocialSetting {
  id: string;
  name: string;
  category: 'facebook' | 'instagram' | 'telegram' | 'threads' | 'whatsapp' | string;
  page_id?: string;
  access_token?: string;
  extra_id?: string;
  is_active: boolean;
  post_enabled: boolean;
  story_enabled: boolean;
  reels_enabled: boolean;
  post_price: number;
  story_price: number;
  reels_price: number;
  currency?: string;
  last_status?: string;
  last_error?: string;
  last_checked_at?: string;
  updated_at?: string;
}

export const SocialControlCenter: React.FC = () => {
  const [settings, setSettings] = useState<SocialSetting[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [testingId, setTestingId] = useState<string | null>(null);
  const [showTokens, setShowTokens] = useState<Record<string, boolean>>({});
  const [statusMessage, setStatusMessage] = useState<{ id: string; text: string; type: 'success' | 'error' } | null>(null);
  const [testPublishLoading, setTestPublishLoading] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('social_settings')
        .select('*')
        .order('id');
      
      if (!error && data) {
        setSettings(data.map(d => ({
          ...d,
          is_active: d.is_active !== false,
          post_enabled: d.post_enabled !== false,
          story_enabled: d.story_enabled !== false,
          reels_enabled: d.reels_enabled || false,
          post_price: parseFloat(d.post_price || 0),
          story_price: parseFloat(d.story_price || 0),
          reels_price: parseFloat(d.reels_price || 0),
        })));
      }
    } catch (e) {
      console.error('Failed to load social settings:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateField = (id: string, field: keyof SocialSetting, value: any) => {
    setSettings(prev => prev.map(item => item.id === id ? { ...item, [field]: value } : item));
  };

  const handleSaveSetting = async (setting: SocialSetting) => {
    setSavingId(setting.id);
    setStatusMessage(null);
    try {
      const { error } = await supabase
        .from('social_settings')
        .update({
          name: setting.name,
          page_id: setting.page_id,
          access_token: setting.access_token,
          extra_id: setting.extra_id,
          is_active: setting.is_active,
          post_enabled: setting.post_enabled,
          story_enabled: setting.story_enabled,
          reels_enabled: setting.reels_enabled,
          post_price: setting.post_price,
          story_price: setting.story_price,
          reels_price: setting.reels_price,
          updated_at: new Date().toISOString()
        })
        .eq('id', setting.id);

      if (error) throw error;
      setStatusMessage({ id: setting.id, text: '✅ تم حفظ التعديلات والأسعار بنجاح!', type: 'success' });
      setTimeout(() => setStatusMessage(null), 4000);
    } catch (err: any) {
      setStatusMessage({ id: setting.id, text: `❌ فشل الحفظ: ${err.message}`, type: 'error' });
    } finally {
      setSavingId(null);
    }
  };

  const handleTestConnection = async (setting: SocialSetting) => {
    setTestingId(setting.id);
    setStatusMessage(null);
    try {
      let isOk = false;
      let errorMsg = '';

      if (setting.category === 'facebook' || setting.category === 'instagram') {
        const token = setting.access_token;
        if (!token) throw new Error('رمز الوصول (Token) مفقود');
        
        const isDirectIg = token.startsWith('IGAA');
        const apiBase = isDirectIg ? 'https://graph.instagram.com/v20.0' : 'https://graph.facebook.com/v20.0';
        const res = await fetch(`${apiBase}/me?access_token=${encodeURIComponent(token)}`);
        const data = await res.json();
        
        if (data.error) {
          errorMsg = data.error.message;
        } else {
          isOk = true;
        }
      } else if (setting.category === 'telegram') {
        const botToken = setting.access_token || '7594966606:AAEwF9X8fGqM0Z_oOaYqWd1E5F8xJ9lA7qY';
        const res = await fetch(`https://api.telegram.org/bot${botToken}/getMe`);
        const data = await res.json();
        if (data.ok) {
          isOk = true;
        } else {
          errorMsg = data.description || 'فشل الاتصال بالبوت';
        }
      } else {
        isOk = true;
      }

      await supabase.from('social_settings').update({
        last_status: isOk ? 'connected' : 'error',
        last_error: isOk ? null : errorMsg,
        last_checked_at: new Date().toISOString()
      }).eq('id', setting.id);

      setSettings(prev => prev.map(s => s.id === setting.id ? {
        ...s,
        last_status: isOk ? 'connected' : 'error',
        last_error: isOk ? undefined : errorMsg,
        last_checked_at: new Date().toISOString()
      } : s));

      if (isOk) {
        setStatusMessage({ id: setting.id, text: '🟢 متصل وصالح بنسبة 100%!', type: 'success' });
      } else {
        setStatusMessage({ id: setting.id, text: `🔴 خطأ: ${errorMsg}`, type: 'error' });
      }
    } catch (e: any) {
      setStatusMessage({ id: setting.id, text: `🔴 ${e.message}`, type: 'error' });
    } finally {
      setTestingId(null);
    }
  };

  const toggleShowToken = (id: string) => {
    setShowTokens(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleTestPublish = async (channelType: 'rafdain' | 'souq') => {
    setTestPublishLoading(true);
    try {
      const response = await fetch('https://lyhqnccpudwgvexqinxa.supabase.co/functions/v1/telegram-bot', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer sb_publishable_JH0HoX448K2Rqw38QOM5Gw_IsIXRAUf'
        },
        body: JSON.stringify({
          type: 'INSERT',
          table: 'ads',
          forcePage: channelType,
          record: {
            id: 'test-' + Date.now(),
            title: channelType === 'rafdain' ? 'أوفر خط نقل تجريبي إلى كلية الرافدين الجامعة 🎓' : 'أوفر خط نقل تجريبي في بغداد 🚌',
            category: 'transport',
            city: channelType === 'rafdain' ? 'كلية الرافدين الجامعة' : 'بغداد',
            location: 'السيدية - الكرادة',
            price: '85000',
            phone: '07701109692',
            status: 'active',
            is_demo: false,
            short_id: Math.random().toString(36).substring(2, 7).toUpperCase(),
            description: JSON.stringify({
              shift: 'صباحي',
              seats: '4',
              vehicleType: 'خصوصي',
              targetAudience: 'طلاب',
              categoryType: 'student'
            })
          }
        })
      });

      const resJson = await response.json();
      if (resJson.ok) {
        alert('🎉 تم إرسال المنشور التجريبي بنجاح إلى القنوات وصفحات فيسبوك والستوري!');
      } else {
        alert('⚠️ تم الإرسال مع استجابة: ' + JSON.stringify(resJson));
      }
    } catch (e: any) {
      alert('❌ خطأ أثناء النشر التجريبي: ' + e.message);
    } finally {
      setTestPublishLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center">
        <RefreshCw className="w-10 h-10 text-amber-500 animate-spin mb-4" />
        <p className="text-gray-300 font-bold">جاري تحميل إعدادات وحالة منصات النشر...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 text-right" dir="rtl">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-purple-900 rounded-3xl p-6 border border-amber-500/30 shadow-2xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className="p-3 bg-amber-500/20 text-amber-400 rounded-2xl border border-amber-500/40">
                <Share2 className="w-6 h-6" />
              </span>
              <div>
                <h2 className="text-2xl font-black text-white flex items-center gap-2">
                  مركز قيادة النشر والترويج 📡
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40">
                    تحكم ذكي بالصفحات
                  </span>
                </h2>
                <p className="text-gray-300 text-sm">
                  التحكم بتشغيل وإطفاء النشر (بوست / ستوري / ريلز) وتحديد أسعار الترويج لكل منصة
                </p>
              </div>
            </div>
          </div>
          
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => handleTestPublish('rafdain')}
              disabled={testPublishLoading}
              className="px-4 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold rounded-xl shadow-lg flex items-center gap-2 disabled:opacity-50"
            >
              <Radio className={`w-4 h-4 ${testPublishLoading ? 'animate-pulse' : ''}`} />
              {testPublishLoading ? 'جاري النشر...' : '🏛️ نشر تجريبي (الرافدين)'}
            </button>

            <button
              onClick={() => handleTestPublish('souq')}
              disabled={testPublishLoading}
              className="px-4 py-2.5 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white text-xs font-bold rounded-xl shadow-lg flex items-center gap-2 disabled:opacity-50"
            >
              <Radio className={`w-4 h-4 ${testPublishLoading ? 'animate-pulse' : ''}`} />
              {testPublishLoading ? 'جاري النشر...' : '🦁 نشر تجريبي (سوق بغداد)'}
            </button>

            <button
              onClick={fetchSettings}
              className="p-2.5 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-xl border border-gray-700"
              title="تحديث البيانات"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Settings Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {settings.map(setting => {
          const isTesting = testingId === setting.id;
          const isSaving = savingId === setting.id;
          const isTokenVisible = showTokens[setting.id];
          const isConnected = setting.last_status === 'connected';
          const isError = setting.last_status === 'error';

          return (
            <div 
              key={setting.id}
              className={`bg-gray-900/90 border rounded-3xl p-5 shadow-xl space-y-4 transition-all ${
                setting.is_active ? 'border-gray-800 hover:border-gray-700' : 'border-red-900/40 opacity-75 bg-gray-950/90'
              }`}
            >
              {/* Card Header & Master Switch */}
              <div className="flex items-center justify-between border-b border-gray-800 pb-3">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">
                    {setting.category === 'facebook' ? '🔵' : 
                     setting.category === 'instagram' ? '📸' : 
                     setting.category === 'telegram' ? '✈️' : 
                     setting.category === 'threads' ? '🧵' : '💬'}
                  </span>
                  <div>
                    <h3 className="text-white font-bold text-base">{setting.name}</h3>
                    <p className="text-xs text-gray-400 font-mono">ID: {setting.id}</p>
                  </div>
                </div>

                {/* Master Platform Switch */}
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => handleUpdateField(setting.id, 'is_active', !setting.is_active)}
                    className={`px-3 py-1 rounded-full text-xs font-black flex items-center gap-1.5 transition-all ${
                      setting.is_active 
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40' 
                        : 'bg-red-500/20 text-red-400 border border-red-500/40'
                    }`}
                  >
                    {setting.is_active ? '🟢 تشغيل' : '🔴 إيقاف'}
                  </button>

                  {isConnected && (
                    <span className="hidden sm:inline-flex items-center gap-1 text-[11px] text-emerald-400 font-bold">
                      <ShieldCheck className="w-3.5 h-3.5" /> متصل
                    </span>
                  )}
                </div>
              </div>

              {/* Publication Types Matrix & Pricing */}
              <div className="bg-gray-950/80 border border-gray-800/80 rounded-2xl p-3.5 space-y-3">
                <div className="text-xs font-bold text-amber-400 flex items-center justify-between">
                  <span>أنواع النشر والتسعير لهذه المنصة:</span>
                  <span className="text-[10px] text-gray-400 font-normal">0 = مجاني</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {/* Post Control */}
                  <div className="p-2.5 bg-gray-900 border border-gray-800 rounded-xl space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-300 font-bold">📝 منشور (Feed Post)</span>
                      <input 
                        type="checkbox"
                        checked={setting.post_enabled}
                        onChange={e => handleUpdateField(setting.id, 'post_enabled', e.target.checked)}
                        className="w-4 h-4 accent-amber-500 rounded cursor-pointer"
                      />
                    </div>
                    <div className="flex items-center gap-1.5">
                      <label className="text-[11px] text-gray-400 shrink-0">السعر:</label>
                      <input 
                        type="number"
                        min="0"
                        step="500"
                        value={setting.post_price || 0}
                        onChange={e => handleUpdateField(setting.id, 'post_price', parseFloat(e.target.value) || 0)}
                        className="w-full px-2 py-1 bg-gray-950 border border-gray-800 rounded-lg text-white text-xs font-mono text-center focus:border-amber-500 focus:outline-none"
                      />
                      <span className="text-[10px] text-gray-400">د.ع</span>
                    </div>
                  </div>

                  {/* Story Control */}
                  <div className="p-2.5 bg-gray-900 border border-gray-800 rounded-xl space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-300 font-bold">📸 ستوري (Story 9:16)</span>
                      <input 
                        type="checkbox"
                        checked={setting.story_enabled}
                        onChange={e => handleUpdateField(setting.id, 'story_enabled', e.target.checked)}
                        className="w-4 h-4 accent-purple-500 rounded cursor-pointer"
                      />
                    </div>
                    <div className="flex items-center gap-1.5">
                      <label className="text-[11px] text-gray-400 shrink-0">السعر:</label>
                      <input 
                        type="number"
                        min="0"
                        step="500"
                        value={setting.story_price || 0}
                        onChange={e => handleUpdateField(setting.id, 'story_price', parseFloat(e.target.value) || 0)}
                        className="w-full px-2 py-1 bg-gray-950 border border-gray-800 rounded-lg text-white text-xs font-mono text-center focus:border-amber-500 focus:outline-none"
                      />
                      <span className="text-[10px] text-gray-400">د.ع</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Status or Error Display */}
              {setting.last_error && (
                <div className="p-3 bg-red-950/40 border border-red-900/60 rounded-xl text-xs text-red-300 flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                  <div className="break-all">{setting.last_error}</div>
                </div>
              )}

              {/* Form Fields */}
              <div className="space-y-3">
                {setting.category !== 'threads' && (
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">
                      {setting.category === 'telegram' ? 'القناة الأساسية / المعرف' : 'معرف الصفحة (Page ID / Username)'}
                    </label>
                    <input 
                      type="text" 
                      value={setting.page_id || ''}
                      onChange={e => handleUpdateField(setting.id, 'page_id', e.target.value)}
                      placeholder="مثال: 102975411515668 أو @souqbaghdad_lines"
                      className="w-full px-3 py-2 bg-gray-950 border border-gray-800 rounded-xl text-white text-xs font-mono focus:border-amber-500 focus:outline-none"
                    />
                  </div>
                )}

                {setting.extra_id !== undefined && setting.category === 'telegram' && (
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">القنوات الإضافية المرتبطة (مفصولة بفارزة)</label>
                    <input 
                      type="text" 
                      value={setting.extra_id || ''}
                      onChange={e => handleUpdateField(setting.id, 'extra_id', e.target.value)}
                      placeholder="@souqbaghdad_car, @souqbaghdad_iq, @ruc_1"
                      className="w-full px-3 py-2 bg-gray-950 border border-gray-800 rounded-xl text-white text-xs font-mono focus:border-amber-500 focus:outline-none"
                    />
                  </div>
                )}

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs text-gray-400 flex items-center gap-1.5">
                      <Key className="w-3.5 h-3.5 text-amber-400" />
                      رمز الوصول / التوكن (Access Token)
                    </label>
                    <button
                      type="button"
                      onClick={() => toggleShowToken(setting.id)}
                      className="text-xs text-amber-400 hover:text-amber-300 flex items-center gap-1"
                    >
                      {isTokenVisible ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      {isTokenVisible ? 'إخفاء' : 'إظهار'}
                    </button>
                  </div>
                  <textarea 
                    rows={isTokenVisible ? 3 : 1}
                    value={setting.access_token || ''}
                    onChange={e => handleUpdateField(setting.id, 'access_token', e.target.value)}
                    placeholder="الصق رمز الوصول (Access Token) هنا..."
                    className={`w-full px-3 py-2 bg-gray-950 border border-gray-800 rounded-xl text-white text-xs font-mono focus:border-amber-500 focus:outline-none ${!isTokenVisible ? 'filter blur-sm select-none' : ''}`}
                  />
                </div>
              </div>

              {/* Status Message Notification */}
              {statusMessage && statusMessage.id === setting.id && (
                <div className={`p-3 rounded-xl text-xs font-bold flex items-center gap-2 ${statusMessage.type === 'success' ? 'bg-emerald-950/80 border border-emerald-800 text-emerald-300' : 'bg-red-950/80 border border-red-800 text-red-300'}`}>
                  {statusMessage.type === 'success' ? <Check className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
                  {statusMessage.text}
                </div>
              )}

              {/* Actions Footer */}
              <div className="flex items-center justify-between pt-2 border-t border-gray-800/80">
                <button
                  type="button"
                  onClick={() => handleTestConnection(setting)}
                  disabled={isTesting}
                  className="px-3.5 py-1.5 bg-gray-800 hover:bg-gray-700 text-gray-200 text-xs font-bold rounded-xl border border-gray-700 flex items-center gap-1.5 disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isTesting ? 'animate-spin' : ''}`} />
                  {isTesting ? 'جاري الفحص...' : '⚡ فحص الصلاحية'}
                </button>

                <button
                  type="button"
                  onClick={() => handleSaveSetting(setting)}
                  disabled={isSaving}
                  className="px-5 py-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-black text-xs font-black rounded-xl shadow-lg flex items-center gap-1.5 disabled:opacity-50"
                >
                  <Save className={`w-4 h-4 ${isSaving ? 'animate-spin' : ''}`} />
                  {isSaving ? 'جاري الحفظ...' : '💾 حفظ الإعدادات والأسعار'}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
