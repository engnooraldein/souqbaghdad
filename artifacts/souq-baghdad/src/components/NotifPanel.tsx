import React, { useState, useEffect, useRef, useMemo, useCallback, Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, Heart, Share2, MapPin, Phone, Car, Home, Smartphone, Watch, 
  Bike, ShoppingBag, Wrench, Video, Store, Mail, ChevronRight, 
  ChevronLeft, Search, SlidersHorizontal, Grid, List, Check, 
  AlertCircle, AlertTriangle, Info, Bell, Settings, LogOut, 
  User as UserIcon, Plus, Camera, Trash2, Edit, Save, Upload, 
  MessageCircle, Star, Image as ImageIcon, Map, Calendar, 
  Shield, ShieldCheck, Activity, TrendingUp, Users, LogIn, 
  MessageSquare, ExternalLink, ThumbsUp, MoreVertical, Eye, Lock, Unlock, Zap, Sparkles, UserPlus, 
  Loader2, Wallet, EyeOff, ZoomOut, ZoomIn, CheckCircle, Key, Tag, Package, ImagePlus, Edit2, Phone as PhoneIcon, 
  RefreshCw, TrendingDown, Clock, HelpCircle, Archive, ShoppingCart, Target, 
  Globe, Search as SearchIcon, ArrowLeft, MoreHorizontal, LayoutGrid,
  FileText, Gamepad2, Copy, Crown, View, Eye as ViewIcon, 
} from 'lucide-react';
import { User, Ad, Product, TransportAd, SellerInfo } from '../types';
import { CATEGORIES, IRAQI_GOVERNORATES, EMPLOYEE_WORKPLACES, UNIVERSITIES, uploadImageToStorage, recordItemView, handleUniversalShare, ViewersModal, GAMES_DATA, compressImage } from '../App';
import { slugify, getWhatsAppLink, detectDevice, isNewItem, getWhatsAppResetLink, getGlowClass} from '../utils/helpers';
import { formatPrice } from '../utils/format';
import { useSound } from '../hooks/useSound';
import { supabase } from '../lib/supabase';
import { TimeAgo } from './TimeAgo';

import { ImageCropModal } from './ImageCropModal';
import { PasswordChangeModal } from './PasswordChangeModal';
import { LoadingScreen } from './LoadingScreen';
import { TransportFormModal } from './TransportFormModal';
import { SkeletonCard } from './SkeletonCard';
import { AdCard } from './AdCard';
import { ProductCard } from './ProductCard';
import { TransportAdCard } from './TransportAdCard';
import { InterestTimer } from './InterestTimer';
import { IraqiEagle } from './Icons';

export function NotifPanel({ isOpen, onClose, notifs, onNotifClick, onHistoryClick, onMarkRead, onArchiveAll }:{
  isOpen:boolean;
  onClose:()=>void;
  notifs:any[];
  onNotifClick:(senderId:string)=>void;
  onHistoryClick:(itemId: string | number, itemType: string)=>void;
  onMarkRead:(id: number | string, sourceTable?: 'ads' | 'user_notifications') => void;
  onArchiveAll:() => void;
}) {
  const [tab, setTab] = useState<'incoming' | 'history'>('incoming');
  const [selectedNotif, setSelectedNotif] = useState<any>(null);
  const playSound = useSound();

  const [dismissedAdmin, setDismissedAdmin] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem('dismissedAdminNotifs') || '[]'); } catch { return []; }
  });

  const ADMIN_NOTIFICATIONS = [
    { 
      id: 'admin_welcome_v1', 
      title: 'إشعار من الإدارة 👑', 
      message: 'مرحباً بك في تحديثات سوك بغداد! نعمل حالياً على تحسين سرعة التطبيق وإضافة ميزات جديدة لتسهيل عملك.',
      time: new Date().toISOString()
    }
  ];

  const fetchedAdminNotifs = notifs.filter(n => n.type === 'system' || n.sourceTable === 'user_notifications');
  const allAdminNotifs = [...ADMIN_NOTIFICATIONS, ...fetchedAdminNotifs];
  const visibleAdminNotifs = allAdminNotifs.filter(n => !dismissedAdmin.includes(String(n.id)));

  const handleDismissAdmin = (n: any) => {
    playSound('click');
    const updated = [...dismissedAdmin, String(n.id)];
    setDismissedAdmin(updated);
    localStorage.setItem('dismissedAdminNotifs', JSON.stringify(updated));
    if (n.sourceTable) {
       onMarkRead(n.id, n.sourceTable);
    }
  };

  const incomingNotifs = notifs.filter(n => n.targetType === 'owner' || !n.targetType);
  const historyNotifs = notifs.filter(n => n.targetType === 'viewer');
  const activeNotifs = tab === 'incoming' ? incomingNotifs : historyNotifs;

  return (
    <AnimatePresence>
      {isOpen&&<motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="fixed inset-0 z-50" onClick={onClose}>
        <div className="absolute inset-0 bg-black/60"/>
        <motion.div initial={{x:300}} animate={{x:0}} exit={{x:300}} onClick={e=>e.stopPropagation()} className="absolute right-0 top-0 bottom-0 w-80 bg-gray-900 p-5 overflow-y-auto border-l border-gray-700">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-bold text-white">الإشعارات</h2>
            <button onClick={onClose} className="p-2 bg-gray-800 rounded-xl text-gray-400" title="إغلاق" aria-label="إغلاق"><X className="w-5 h-5"/></button>
          </div>

          {visibleAdminNotifs.length > 0 && (
            <div className="mb-4 space-y-2">
              {visibleAdminNotifs.map(n => (
                <div key={n.id} onClick={() => handleDismissAdmin(n)} className="bg-gradient-to-r from-amber-500/20 to-yellow-600/10 border border-amber-500/30 rounded-xl p-3 cursor-pointer hover:bg-amber-500/30 transition-all relative group shadow-lg">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-amber-500/20 flex items-center justify-center flex-shrink-0">
                      <span className="text-lg">👑</span>
                    </div>
                    <div className="flex-1">
                      <p className="text-amber-400 text-sm font-bold">{n.title}</p>
                      <p className="text-gray-300 text-xs mt-1 leading-relaxed">{n.message}</p>
                      <p className="text-amber-500/60 text-[10px] mt-2 font-bold animate-pulse">👉 اضغط لإخفاء هذا الإشعار</p>
                    </div>
                  </div>
                  <div className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity">
                     <X className="w-4 h-4 text-gray-400" />
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="flex gap-2 mb-4 bg-gray-800 p-1 rounded-xl border border-gray-700">
            <button 
              onClick={() => setTab('incoming')} 
              className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${tab === 'incoming' ? 'bg-amber-500 text-black' : 'text-gray-400 hover:text-white'}`}
            >
              🔔 المهتمين بي ({incomingNotifs.length})
            </button>
            <button 
              onClick={() => setTab('history')} 
              className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${tab === 'history' ? 'bg-amber-500 text-black' : 'text-gray-400 hover:text-white'}`}
            >
              🕒 سجل مشاهداتي ({historyNotifs.length})
            </button>
          </div>

          {tab === 'incoming' && incomingNotifs.length > 0 && (
            <button 
              onClick={onArchiveAll}
              className="w-full mb-4 py-2 bg-gray-800 hover:bg-gray-750 border border-gray-700 text-gray-300 hover:text-white text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5"
            >
              <Check className="w-4 h-4 text-emerald-400" /> أرشفة كل الإشعارات
            </button>
          )}

          <div className="space-y-2">
            <div className="text-center py-10 bg-gray-800/30 rounded-2xl border border-gray-700/50 mt-4">
              <div className="w-12 h-12 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-3">
                {tab === 'history' ? <Clock className="w-6 h-6 text-gray-500" /> : <Bell className="w-6 h-6 text-gray-500" />}
              </div>
              <h3 className="text-white font-bold mb-2">{tab === 'history' ? 'سجل المشاهدات غير متوفر' : 'قسم المهتمين بي غير متوفر'}</h3>
              <p className="text-gray-400 text-xs px-6 leading-relaxed">
                سوف يعمل قريباً.. قم بترقية حسابك وتوثيقه للحصول على هذه الميزة! 🚀
              </p>
            </div>
            {false && activeNotifs.map((n, i) => (
                <div key={n.id || i} 
                  onClick={async () => {
                    // Mark as read/archive
                    if (n.id) onMarkRead(n.id, n.sourceTable);
                    
                    if (tab === 'incoming') {
                      if (n.type === 'message' || !n.senderId) {
                        setSelectedNotif(n);
                      } else if (n.senderId) {
                        onNotifClick(n.senderId);
                        onClose();
                      }
                    } else {
                      if (n.itemId) {
                        onHistoryClick(n.itemId, n.itemType);
                        onClose();
                      }
                    }
                  }}
                  className="bg-gray-800 rounded-xl p-3 border border-gray-700 transition-colors cursor-pointer hover:border-amber-500/50 hover:bg-gray-800/80"
                >
                  <div className="flex items-start gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${n.type === 'message' ? 'bg-blue-500/20' : n.type === 'interest' ? 'bg-red-500/20' : 'bg-emerald-500/20'}`}>
                      {n.type === 'message' ? <MessageSquare className="w-4 h-4 text-blue-400" /> : n.type === 'interest' ? <Heart className="w-4 h-4 text-red-400 fill-red-400" /> : <Eye className="w-4 h-4 text-emerald-400" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-sm font-bold truncate">{n.title}</p>
                      <p className="text-gray-400 text-xs mt-0.5 leading-relaxed break-words">{n.message}</p>
                      
                      <div className="flex items-center justify-between mt-2 flex-wrap gap-2">
                        <p className="text-gray-500 text-[10px]"><TimeAgo iso={n.time || new Date().toISOString()} /></p>
                        {tab === 'incoming' && (
                          <span className="text-[10px] text-amber-400 font-semibold">
                            {n.type === 'message' ? '🔍 تفاصيل الرسالة' : '👉 عرض الملف'}
                          </span>
                        )}
                        {tab === 'history' && n.itemId && (
                          <span className="text-[10px] text-emerald-400 font-semibold">🔍 فتح الإعلان</span>
                        )}
                      </div>

                      {tab === 'incoming' && n.senderPhone && (
                        <div className="mt-2 pt-2 border-t border-gray-700/50">
                          <a 
                            href={`https://wa.me/964${n.senderPhone.replace(/^0/, '')}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="inline-flex items-center gap-1 px-2.5 py-1 bg-green-500 hover:bg-green-600 text-white rounded-lg text-[10px] font-bold transition-all shadow-md shadow-green-500/10"
                          >
                            <MessageSquare className="w-3 h-3" /> مراسلة واتساب
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
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
                <button title="إغلاق" aria-label="إغلاق" 
                  onClick={() => setSelectedNotif(null)} 
                  className="absolute top-4 left-4 p-1.5 bg-gray-800 hover:bg-gray-750 text-gray-400 hover:text-white rounded-lg transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
                
                <div className="flex items-center gap-3 mb-4 mt-2">
                  <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
                    <Bell className="w-5 h-5 text-blue-400" />
                  </div>
                  <div>
                    <h3 className="text-white font-bold text-base leading-tight">{selectedNotif.title}</h3>
                    <p className="text-gray-500 text-[10px] mt-0.5"><TimeAgo iso={selectedNotif.time || new Date().toISOString()} /></p>
                  </div>
                </div>
                
                <p className="text-gray-300 text-sm leading-relaxed whitespace-pre-wrap mb-6">{selectedNotif.message}</p>
                
                <button 
                  onClick={() => setSelectedNotif(null)}
                  className="w-full py-2.5 bg-gray-800 hover:bg-gray-750 text-white font-bold text-xs rounded-xl border border-gray-700 transition-colors"
                >
                  إغلاق
                </button>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </motion.div>}
    </AnimatePresence>
  );
}
