import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bell, X, Settings, Volume2, VolumeX, Filter, Package, MessageSquare, Heart, Eye, CheckCircle, Check, Crown
} from 'lucide-react';

function getRelative(iso: string): string {
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 5)  return 'الآن';
  if (s < 60) return `منذ ${s} ثانية`;
  const m = Math.floor(s/60);
  if (m < 60) return `منذ ${m} دقيقة`;
  const h = Math.floor(m/60);
  if (h < 24) return `منذ ${h} ساعة`;
  const d = Math.floor(h/24);
  if (d < 7)  return `منذ ${d} يوم`;
  const w = Math.floor(d/7);
  if (w < 5)  return `منذ ${w} أسبوع`;
  return `منذ ${Math.floor(d/30)} شهر`;
}

function useRelativeTime(iso: string) {
  const [rel, setRel] = useState(() => getRelative(iso));
  useEffect(() => {
    setRel(getRelative(iso));
    const iv = setInterval(() => setRel(getRelative(iso)), 10_000);
    return () => clearInterval(iv);
  }, [iso]);
  return rel;
}

function TimeAgo({ iso, className }: { iso:string; className?:string }) {
  return <span className={className}>{useRelativeTime(iso)}</span>;
}

export function NotifPanel({ isOpen, onClose, notifs, onNotifClick, onHistoryClick, onMarkRead, onArchiveAll }:{
  isOpen:boolean;
  onClose:()=>void;
  notifs:any[];
  onNotifClick:(senderId:string)=>void;
  onHistoryClick:(itemId: string | number, itemType: string)=>void;
  onMarkRead:(id: number | string) => void;
  onArchiveAll:() => void;
}) {
  const [tab, setTab] = useState<'incoming' | 'history' | 'archived'>('incoming');
  const [archiveSubTab, setArchiveSubTab] = useState<'all' | 'incoming' | 'history'>('all');
  const [selectedNotif, setSelectedNotif] = useState<any>(null);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(
    () => localStorage.getItem('souq_notif_sound') !== 'disabled'
  );
  const [interestFilterLevel, setInterestFilterLevel] = useState<'all' | 'high_only'>(
    () => (localStorage.getItem('souq_notif_filter_interest') as any) || 'all'
  );
  const [archivedIds, setArchivedIds] = useState<Set<string | number>>(new Set());
  const [retentionPeriod, setRetentionPeriod] = useState<'24h' | '1m' | '3m' | '6m' | 'forever'>(
    () => (localStorage.getItem('souq_notif_retention') as any) || '24h'
  );

  const handleSoundToggle = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    localStorage.setItem('souq_notif_sound', next ? 'enabled' : 'disabled');
  };

  const handleInterestFilterChange = (level: 'all' | 'high_only') => {
    setInterestFilterLevel(level);
    localStorage.setItem('souq_notif_filter_interest', level);
  };

  const handleRetentionChange = (period: '24h' | '1m' | '3m' | '6m' | 'forever') => {
    setRetentionPeriod(period);
    localStorage.setItem('souq_notif_retention', period);
  };

  const getWhatsAppUrl = (n: any) => {
    const phoneRaw = n.senderPhone || n.phone || '';
    const cleanPhone = phoneRaw.replace(/[^0-9]/g, '').replace(/^0/, '');
    if (!cleanPhone) return null;

    const isHigh = (n.duration || 0) >= 15;
    const interestTag = isHigh ? "مهتم جداً 🔥" : "مهتم 👍";
    const durationText = n.duration ? `${n.duration} ثوانٍ` : 'عدة ثوانٍ';
    const itemTitle = n.itemTitle || n.title || 'الإعلان';
    const displayId = n.shortId ? `#${n.shortId}` : (n.itemId ? `#${n.itemId}` : '');

    const text = 
`سلام عليكم ورحمة الله 👋
أتواصل معك بخصوص اهتمامك على منصة سوق بغداد 🛒

لاحظنا اهتمامك بالإعلان:
📌 ${itemTitle} ${displayId}
⏱️ وقت المشاهدة: ${durationText} (${interestTag})

يسعدنا تزويدك بكافة التفاصيل المطلوبة والرد على جميع استفساراتك حول هذا الإعلان.
نتمنى لك تجربة ممتعة وموفقة على سوق بغداد! ✨`;

    return `https://wa.me/964${cleanPhone}?text=${encodeURIComponent(text)}`;
  };

  const getCutoffMs = (period: string) => {
    if (period === '24h') return 24 * 60 * 60 * 1000;
    if (period === '1m') return 30 * 24 * 60 * 60 * 1000;
    if (period === '3m') return 90 * 24 * 60 * 60 * 1000;
    if (period === '6m') return 180 * 24 * 60 * 60 * 1000;
    return Infinity;
  };

  const now = Date.now();
  const cutoffMs = getCutoffMs(retentionPeriod);

  const isExpiredOrArchived = (n: any) => {
    if (n.isArchived || archivedIds.has(n.id)) return true;
    if (cutoffMs === Infinity) return false;
    const itemTime = new Date(n.time || Date.now()).getTime();
    return (now - itemTime) > cutoffMs;
  };

  const allIncoming = notifs.filter(n => n.targetType === 'owner' || !n.targetType || n.type === 'message' || n.type === 'interest');
  const allHistory = notifs.filter(n => n.targetType === 'viewer');

  const incomingNotifs = allIncoming.filter(n => !isExpiredOrArchived(n));
  const historyNotifs = allHistory.filter(n => !isExpiredOrArchived(n));

  const archivedIncoming = allIncoming.filter(n => isExpiredOrArchived(n));
  const archivedHistory = allHistory.filter(n => isExpiredOrArchived(n));
  const archivedNotifs = [...allIncoming, ...allHistory].filter(n => isExpiredOrArchived(n));

  const filteredArchived = archiveSubTab === 'incoming' ? archivedIncoming : archiveSubTab === 'history' ? archivedHistory : archivedNotifs;
  const activeNotifs = tab === 'incoming' ? incomingNotifs : tab === 'history' ? historyNotifs : filteredArchived;

  return (
    <AnimatePresence>
      {isOpen&&<motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="fixed inset-0 z-50" onClick={onClose}>
        <div className="absolute inset-0 bg-black/60"/>
        <motion.div initial={{x:300}} animate={{x:0}} exit={{x:300}} onClick={e=>e.stopPropagation()} className="absolute right-0 top-0 bottom-0 w-84 bg-gray-900 p-5 overflow-y-auto border-l border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-white flex items-center gap-2"><Bell className="w-5 h-5 text-amber-400"/>الإشعارات والتنبيهات</h2>
            <div className="flex items-center gap-1.5">
              <button 
                onClick={() => setShowSettingsModal(!showSettingsModal)} 
                className={`p-2 rounded-xl transition-all ${showSettingsModal ? 'bg-amber-500 text-black shadow-md' : 'bg-gray-800 text-gray-400 hover:text-white'}`}
                title="إعدادات الإشعارات والتنبيهات"
              >
                <Settings className="w-5 h-5"/>
              </button>
              <button onClick={onClose} className="p-2 bg-gray-800 rounded-xl text-gray-400 hover:text-white"><X className="w-5 h-5"/></button>
            </div>
          </div>

          {/* Embedded Notification Settings Panel */}
          {showSettingsModal && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-4 bg-gradient-to-br from-gray-800 to-gray-900 p-3.5 rounded-2xl border border-amber-500/40 shadow-xl space-y-3">
              <div className="flex items-center justify-between border-b border-gray-700/80 pb-2">
                <h4 className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                  <Settings className="w-4 h-4" /> إعدادات وتصنيفات التنبيهات
                </h4>
                <button onClick={() => setShowSettingsModal(false)} className="text-[10px] text-gray-400 hover:text-white">إغلاق ✕</button>
              </div>

              {/* Sound toggle */}
              <div className="flex items-center justify-between bg-gray-900/80 p-2.5 rounded-xl border border-gray-700/60">
                <div className="flex items-center gap-2">
                  {soundEnabled ? <Volume2 className="w-4 h-4 text-emerald-400" /> : <VolumeX className="w-4 h-4 text-red-400" />}
                  <div>
                    <div className="text-xs font-bold text-white">التنبيهات الصوتية</div>
                    <div className="text-[10px] text-gray-400">تشغيل الصوت عند وصول إشعار جديد</div>
                  </div>
                </div>
                <button 
                  onClick={handleSoundToggle}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${soundEnabled ? 'bg-emerald-500 text-black' : 'bg-gray-700 text-gray-400'}`}
                >
                  {soundEnabled ? 'مفعل 🔊' : 'معطل 🔇'}
                </button>
              </div>

              {/* Interest Filter */}
              <div className="bg-gray-900/80 p-2.5 rounded-xl border border-gray-700/60 space-y-1.5">
                <div className="flex items-center justify-between text-xs font-bold text-white">
                  <span className="flex items-center gap-1.5"><Filter className="w-3.5 h-3.5 text-amber-400" /> تصفية إشعارات الاهتمام الواردة:</span>
                </div>
                <select
                  value={interestFilterLevel}
                  onChange={(e) => handleInterestFilterChange(e.target.value as any)}
                  className="w-full bg-gray-800 text-white text-xs font-bold p-2 rounded-lg border border-gray-700 outline-none focus:border-amber-500"
                >
                  <option value="all">👍 جميع درجات الاهتمام (مهتم ومهتم جداً)</option>
                  <option value="high_only">🔥 المتابعات العالية فقط (مهتم جداً ≥ 15ث)</option>
                </select>
              </div>
            </motion.div>
          )}

          {/* Retention Selector */}
          <div className="mb-4 bg-gray-800/80 p-2.5 rounded-xl border border-gray-700/80">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[11px] font-bold text-amber-300 flex items-center gap-1">
                <Package className="w-3.5 h-3.5" /> فترة الحفظ والتصفية التلقائية:
              </span>
            </div>
            <select 
              value={retentionPeriod} 
              onChange={(e) => handleRetentionChange(e.target.value as any)}
              className="w-full bg-gray-900 text-white text-xs font-bold p-2 rounded-lg border border-gray-700 outline-none focus:border-amber-500 transition-colors"
            >
              <option value="24h">🕒 كل 24 ساعة (رئيسي وتلقائي)</option>
              <option value="1m">📅 شهر واحد (30 يوم)</option>
              <option value="3m">📅 3 أشهر (90 يوم)</option>
              <option value="6m">📅 6 أشهر (180 يوم)</option>
              <option value="forever">♾️ حفظ دائم بدون أرشفة تلقائية</option>
            </select>
          </div>

          <div className="flex gap-1 mb-4 bg-gray-800 p-1 rounded-xl border border-gray-700 text-[11px]">
            <button 
              onClick={() => setTab('incoming')} 
              className={`flex-1 py-2 rounded-lg font-bold transition-all ${tab === 'incoming' ? 'bg-amber-500 text-black shadow-sm' : 'text-gray-400 hover:text-white'}`}
            >
              🔔 الواردة ({incomingNotifs.length})
            </button>
            <button 
              onClick={() => setTab('history')} 
              className={`flex-1 py-2 rounded-lg font-bold transition-all ${tab === 'history' ? 'bg-amber-500 text-black shadow-sm' : 'text-gray-400 hover:text-white'}`}
            >
              🕒 مشاهداتي ({historyNotifs.length})
            </button>
            <button 
              onClick={() => setTab('archived')} 
              className={`flex-1 py-2 rounded-lg font-bold transition-all ${tab === 'archived' ? 'bg-amber-500 text-black shadow-sm' : 'text-gray-400 hover:text-white'}`}
            >
              📦 الأرشيف ({archivedNotifs.length})
            </button>
          </div>

          {tab === 'archived' && (
            <div className="flex gap-1 mb-4 bg-gray-900 p-1 rounded-xl border border-gray-800 text-[10px]">
              <button
                onClick={() => setArchiveSubTab('all')}
                className={`flex-1 py-1.5 rounded-lg font-bold transition-all ${archiveSubTab === 'all' ? 'bg-gray-700 text-white' : 'text-gray-400 hover:text-white'}`}
              >
                الكل ({archivedNotifs.length})
              </button>
              <button
                onClick={() => setArchiveSubTab('incoming')}
                className={`flex-1 py-1.5 rounded-lg font-bold transition-all ${archiveSubTab === 'incoming' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' : 'text-gray-400 hover:text-white'}`}
              >
                🔔 الواردة ({archivedIncoming.length})
              </button>
              <button
                onClick={() => setArchiveSubTab('history')}
                className={`flex-1 py-1.5 rounded-lg font-bold transition-all ${archiveSubTab === 'history' ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30' : 'text-gray-400 hover:text-white'}`}
              >
                🕒 مشاهداتي ({archivedHistory.length})
              </button>
            </div>
          )}

          {tab === 'incoming' && incomingNotifs.length > 0 && (
            <button 
              onClick={() => {
                incomingNotifs.forEach(n => { if (n.id) setArchivedIds(prev => new Set(prev).add(n.id)); });
                onArchiveAll();
              }}
              className="w-full mb-4 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2 shadow-md"
            >
              <CheckCircle className="w-4 h-4" /> رأيت جميع الإشعارات (أرشفة الكل)
            </button>
          )}

          <div className="space-y-2.5">
            {activeNotifs.length === 0 ? (
              <div className="text-center py-12 text-gray-500 text-xs bg-gray-800/40 rounded-2xl border border-gray-800">
                {tab === 'incoming' ? 'لا توجد إشعارات واردة جديدة حالياً' : tab === 'history' ? 'لم تقم بمشاهدة أي إعلانات بعد' : 'سجل الأرشيف فارغ'}
              </div>
            ) : (
              activeNotifs.map((n, i) => {
                const isAdminBroadcast = n.type === 'broadcast' || n.senderId === 'ALL' || n.senderName === 'إدارة الموقع';
                return (
                  <div key={n.id || i} 
                    className={`rounded-2xl p-3.5 border transition-all cursor-pointer relative group ${isAdminBroadcast ? 'bg-gradient-to-br from-amber-950/60 via-gray-900 to-amber-950/40 border-amber-500/90 shadow-[0_0_20px_rgba(245,158,11,0.3)] hover:border-amber-400' : 'bg-gray-800/90 border-gray-700/80 hover:border-amber-500/50 hover:bg-gray-800'}`}
                  >
                    {isAdminBroadcast && (
                      <div className="mb-2 inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-gradient-to-r from-amber-500 to-yellow-500 text-black text-[10px] font-black rounded-lg shadow-md">
                        <Crown className="w-3 h-3 text-black fill-black"/> 👑 إشعار رسمي موجه من إدارة سوق بغداد
                      </div>
                    )}
                    <div className="flex items-start gap-3">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${isAdminBroadcast ? 'bg-amber-500 text-black font-bold shadow-lg' : n.type === 'message' ? 'bg-blue-500/20 text-blue-400' : n.type === 'interest' ? 'bg-amber-500/20 text-amber-400' : 'bg-emerald-500/20 text-emerald-400'}`}>
                        {isAdminBroadcast ? <Crown className="w-5 h-5 fill-black"/> : n.type === 'message' ? <MessageSquare className="w-4 h-4" /> : n.type === 'interest' ? <Heart className="w-4 h-4 fill-amber-400" /> : <Eye className="w-4 h-4" />}
                      </div>
                      <div className="flex-1 min-w-0" onClick={async () => {
                        if (tab === 'incoming') {
                          setSelectedNotif(n);
                        } else {
                          if (n.itemId) {
                            onHistoryClick(n.itemId, n.itemType);
                            onClose();
                          }
                        }
                      }}>
                        <div className="flex items-center justify-between gap-2">
                          <p className={`text-sm font-bold truncate ${isAdminBroadcast ? 'text-amber-300' : 'text-white'}`}>{n.title}</p>
                        </div>
                        <p className="text-gray-300 text-xs mt-1 leading-relaxed break-words">{n.message}</p>
                      
                        <div className="flex items-center justify-between mt-2.5 flex-wrap gap-2 pt-2 border-t border-gray-700/40">
                          <p className="text-gray-500 text-[10px]"><TimeAgo iso={n.time || new Date().toISOString()} /></p>
                          <div className="flex items-center gap-1.5">
                            {tab === 'incoming' && (
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (n.id) {
                                    setArchivedIds(prev => new Set(prev).add(n.id));
                                    onMarkRead(n.id);
                                  }
                                }}
                                className="text-[10px] px-2 py-0.5 bg-gray-700 hover:bg-emerald-600 text-gray-300 hover:text-white font-bold rounded-lg transition-colors flex items-center gap-1"
                              >
                                <Check className="w-3 h-3 text-emerald-400" /> تمت الرؤية
                              </button>
                            )}
                            {tab !== 'archived' && (
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (n.id) {
                                    setArchivedIds(prev => new Set(prev).add(n.id));
                                    onMarkRead(n.id);
                                  }
                                }}
                                className="text-[10px] px-2 py-0.5 bg-amber-500/20 hover:bg-amber-500 text-amber-300 hover:text-black font-bold rounded-lg transition-all flex items-center gap-1 border border-amber-500/30"
                                title="أرشفة هذا الإشعار"
                              >
                                <Package className="w-3 h-3" /> أرشفة
                              </button>
                            )}
                          </div>
                        </div>

                        {tab === 'incoming' && getWhatsAppUrl(n) && (
                          <div className="mt-2.5 pt-2 border-t border-gray-700/50 flex items-center justify-between gap-2">
                            <a 
                              href={getWhatsAppUrl(n)!}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-green-600/20"
                            >
                              <MessageSquare className="w-3.5 h-3.5" /> مراسلة عبر واتساب
                            </a>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </motion.div>

        {/* Selected Notification Detail Modal inside notifications view */}
        <AnimatePresence>
          {selectedNotif && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80" onClick={() => setSelectedNotif(null)}>
              <motion.div 
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className="w-full max-w-sm bg-gray-900 border border-gray-800 rounded-2xl p-6 shadow-2xl relative overflow-hidden"
              >
                <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-blue-500 to-amber-500" />
                <button 
                  onClick={() => setSelectedNotif(null)} 
                  className="absolute top-4 left-4 p-1.5 bg-gray-800 hover:bg-gray-750 text-gray-400 hover:text-white rounded-lg transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
                
                <div className="flex items-center gap-3 mb-4 mt-2">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
                    <Bell className="w-5 h-5 text-amber-400" />
                  </div>
                  <div>
                    <h3 className="text-white font-bold text-base leading-tight">{selectedNotif.title}</h3>
                    <p className="text-gray-500 text-[10px] mt-0.5"><TimeAgo iso={selectedNotif.time || new Date().toISOString()} /></p>
                  </div>
                </div>
                
                <p className="text-gray-300 text-sm leading-relaxed whitespace-pre-wrap mb-6">{selectedNotif.message}</p>

                {getWhatsAppUrl(selectedNotif) && (
                  <a 
                    href={getWhatsAppUrl(selectedNotif)!}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full mb-3 py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-green-600/20 transition-all"
                  >
                    <MessageSquare className="w-4 h-4" /> مراسلة الزبون المهتم عبر واتساب
                  </a>
                )}

                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => {
                      if (selectedNotif?.id) {
                        setArchivedIds(prev => new Set(prev).add(selectedNotif.id));
                        onMarkRead(selectedNotif.id);
                        setSelectedNotif(null);
                      }
                    }}
                    className="flex-1 py-2.5 bg-amber-500/20 hover:bg-amber-500 text-amber-300 hover:text-black font-bold text-xs rounded-xl border border-amber-500/30 transition-all flex items-center justify-center gap-1.5"
                  >
                    <Package className="w-4 h-4" /> أرشفة الإشعار
                  </button>
                  <button 
                    onClick={() => setSelectedNotif(null)}
                    className="flex-1 py-2.5 bg-gray-800 hover:bg-gray-750 text-white font-bold text-xs rounded-xl border border-gray-700 transition-colors"
                  >
                    إغلاق
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </motion.div>}
    </AnimatePresence>
  );
}
