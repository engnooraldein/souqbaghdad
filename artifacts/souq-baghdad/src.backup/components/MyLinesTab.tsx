// ===========================================
// مسؤولية هذا الملف:
// علامة تبويب "خطوطي" في ملف المستخدم الشخصي.
// يعرض خطوط النقل التي نشرها المستخدم.
//
// لا يجلب البيانات مباشرة.
// البيانات تأتيه عبر Props (allTransportAds مُفلترة).
//
// آمن للتعديل:
// نعم.
// ===========================================
import React, { useState, useEffect, useRef, useMemo, useCallback, Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import * as LucideIcons from 'lucide-react';
import { User, Ad, Product, TransportAd, SellerInfo } from '../types';
import { CATEGORIES, IRAQI_GOVERNORATES, EMPLOYEE_WORKPLACES, UNIVERSITIES, uploadImageToStorage, recordItemView, handleUniversalShare, ViewersModal, GAMES_DATA, compressImage } from '../App';
import { slugify, getWhatsAppLink, detectDevice, isNewItem, getWhatsAppResetLink, getGlowClass } from '../utils/helpers';
import { formatPrice } from '../utils/format';
import { useSound } from '../hooks/useSound';
import { supabase } from '../lib/supabase';

// Map all lucide icons to global scope to avoid missing imports
const {
  X, Heart, Share2, MapPin, Phone, Car, Home, Smartphone, Watch, 
  Bike, ShoppingBag, Wrench, Video, Store, Mail, ChevronRight, 
  ChevronLeft, Search, SlidersHorizontal, Grid, List, Check, 
  AlertCircle, AlertTriangle, Info, Bell, Settings, LogOut, 
  User: UserIcon, Plus, Camera, Trash2, Edit, Save, Upload, 
  MessageCircle, Star, Image: ImageIcon, Map, Calendar, 
  Shield, ShieldCheck, Activity, TrendingUp, Users, LogIn, 
  MessageSquare, ExternalLink, ThumbsUp, MoreVertical, Eye, Lock, Unlock, Zap, Sparkles, UserPlus, 
  Loader2, Wallet, EyeOff, ZoomOut, ZoomIn, CheckCircle, Key, Tag, Package, ImagePlus, Edit2, Phone: PhoneIcon,
  FileText, Gamepad2, Copy, Crown, View, Eye: ViewIcon
} = LucideIcons;

export function MyLinesTab({ userId, lines, onUpdateStatus, onDelete }: {
  userId: string;
  lines: TransportAd[];
  onUpdateStatus: (id: number, status: TransportAd['status'], reason?: TransportAd['completion_reason']) => void;
  onDelete: (id: number) => void;
}) {
  const [subTab, setSubTab] = useState<'published' | 'pending' | 'matched' | 'archived'>('published');
  const [showConfirmModal, setShowConfirmModal] = useState<{ id: number; action: 'found_line' | 'line_full' } | null>(null);

  const updateStatus = (id: number, status: TransportAd['status'], reason: TransportAd['completion_reason'] = null) => {
    onUpdateStatus(id, status, reason);
    setShowConfirmModal(null);
  };

  const activeLines = lines.filter(l => l.status === 'published');
  const completedLines = lines.filter(l => l.status === 'matched');
  const totalInteractions = lines.reduce((acc, l) => acc + (l.whatsappClicks || 0), 0);
  const totalViews = lines.reduce((acc, l) => acc + l.views, 0);

  const displayLines = lines.filter(l => l.status === subTab);

  return (
    <div className="space-y-4">
      {/* Stats Header */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
        <div className="bg-gray-800 p-3 rounded-xl border border-gray-700 text-center">
          <p className="text-xl font-bold text-emerald-400">{activeLines.length}</p>
          <p className="text-xs text-gray-400 mt-1">خطوط نشطة</p>
        </div>
        <div className="bg-gray-800 p-3 rounded-xl border border-gray-700 text-center">
          <p className="text-xl font-bold text-blue-400">{completedLines.length}</p>
          <p className="text-xs text-gray-400 mt-1">مكتملة</p>
        </div>
        <div className="bg-gray-800 p-3 rounded-xl border border-gray-700 text-center">
          <p className="text-xl font-bold text-amber-400">{totalInteractions}</p>
          <p className="text-xs text-gray-400 mt-1">تواصل (واتساب)</p>
        </div>
        <div className="bg-gray-800 p-3 rounded-xl border border-gray-700 text-center">
          <p className="text-xl font-bold text-purple-400">{totalViews}</p>
          <p className="text-xs text-gray-400 mt-1">المشاهدات</p>
        </div>
      </div>

      {/* Sub-tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {(
          [
            ['published', 'نشطة'],
            ['pending', 'بانتظار الموافقة'],
            ['matched', 'تم العثور / مكتمل'],
            ['archived', 'مؤرشفة']
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setSubTab(key)}
            className={`whitespace-nowrap px-4 py-2 rounded-xl text-sm font-bold transition-all ${subTab === key ? 'bg-amber-500 text-black' : 'bg-gray-800 text-gray-400 border border-gray-700 hover:text-white'}`}
          >
            {label} ({lines.filter(l => l.status === key).length})
          </button>
        ))}
      </div>

      {/* Lines List */}
      <div className="space-y-3">
        {displayLines.length === 0 ? (
          <div className="bg-gray-800 p-8 rounded-2xl border border-gray-700 text-center border-dashed">
            <div className="text-4xl mb-2">🚌</div>
            <p className="text-white font-bold">لا توجد خطوط في هذا القسم</p>
          </div>
        ) : (
          displayLines.map(line => (
            <div key={line.id} className="bg-gray-800 rounded-2xl p-4 border border-gray-700">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h3 className="text-white font-bold">
                    {line.type === 'offer' ? 'أوفر خط إلى' : 'أبحث عن خط إلى'} {line.university}
                  </h3>
                  <p className="text-sm text-gray-400 mt-1">{line.regions}</p>
                </div>
                {line.status === 'matched' && (
                  <span className={`px-2 py-1 rounded-md text-xs font-bold ${line.completion_reason === 'found_line' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-blue-500/20 text-blue-400'}`}>
                    {line.completion_reason === 'found_line' ? 'تم العثور على خط' : 'اكتمل العدد'}
                  </span>
                )}
              </div>
              
              <div className="grid grid-cols-2 gap-2 text-xs text-gray-400 mb-3 bg-gray-900/50 p-2 rounded-lg">
                <div className="flex justify-between"><span>المركبة:</span> <span className="text-white">{line.vehicleType}</span></div>
                <div className="flex justify-between"><span>الفئة:</span> <span className="text-white">{line.targetAudience}</span></div>
                <div className="flex justify-between"><span>المشاهدات:</span> <span className="text-white">{line.views}</span></div>
                <div className="flex justify-between"><span>الاهتمام:</span> <span className="text-white">{line.interest}</span></div>
              </div>

              {line.status === 'matched' && line.completedAt && (
                <p className="text-xs text-gray-500 mb-3">
                  تم إنهاء الإعلان بتاريخ: {new Date(line.completedAt).toLocaleDateString('ar-IQ')}
                </p>
              )}

              {/* Actions */}
              <div className="flex flex-wrap gap-2 pt-3 border-t border-gray-700">
                {line.status === 'published' && (
                  <>
                    <button onClick={() => updateStatus(line.id, 'archived')} className="flex-1 px-3 py-1.5 bg-gray-700 text-white rounded-lg text-xs hover:bg-gray-600">أرشفة</button>
                    <button onClick={() => setShowConfirmModal({ id: line.id, action: line.type === 'request' ? 'found_line' : 'line_full' })} className="flex-[2] px-3 py-1.5 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-lg text-xs font-bold hover:shadow-lg hover:shadow-emerald-500/20">
                      {line.type === 'request' ? 'حصلت على خط' : 'اكتمل العدد'}
                    </button>
                  </>
                )}
                {line.status === 'matched' && (
                  <>
                    <button onClick={() => updateStatus(line.id, 'published')} className="flex-1 px-3 py-1.5 bg-amber-500 text-black rounded-lg text-xs font-bold hover:bg-amber-400">إعادة فتح الخط</button>
                    <button onClick={() => updateStatus(line.id, 'archived')} className="flex-1 px-3 py-1.5 bg-gray-700 text-white rounded-lg text-xs hover:bg-gray-600">أرشفة</button>
                  </>
                )}
                {line.status === 'archived' && (
                  <>
                    <button onClick={() => updateStatus(line.id, 'published')} className="flex-1 px-3 py-1.5 bg-emerald-500 text-white rounded-lg text-xs font-bold hover:bg-emerald-400">تنشيط الإعلان</button>
                    <button onClick={() => onDelete(line.id)} className="flex-1 px-3 py-1.5 bg-red-500/20 text-red-400 rounded-lg text-xs hover:bg-red-500/30">حذف نهائي</button>
                  </>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Confirm Modal */}
      <AnimatePresence>
        {showConfirmModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[200] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} className="bg-gray-900 rounded-2xl w-full max-w-sm overflow-hidden border border-gray-800 shadow-2xl relative">
              <div className="p-6">
                <h3 className="text-xl font-bold text-white mb-2">
                  {showConfirmModal.action === 'found_line' ? 'هل حصلت على خط؟' : 'هل اكتمل الخط أو تم حجز المقاعد؟'}
                </h3>
                <p className="text-gray-400 text-sm mb-6 leading-relaxed">
                  {showConfirmModal.action === 'found_line'
                    ? 'شكراً على استخدامك سوق بغداد! سيتم إخفاء إعلانك من قائمة الخطوط العامة. سيتم خزن إعلانك في قسم خطوطي ويمكنك إعادة فتح الإعلان في أي وقت.'
                    : 'إذا تم إغلاق الخط، سيتم إخفاء الإعلان من قائمة الخطوط العامة ونقله إلى قسم "مكتمل" داخل حسابك.'}
                </p>
                <div className="flex gap-3">
                  <button onClick={() => setShowConfirmModal(null)} className="flex-1 py-3 bg-gray-800 text-gray-300 font-bold rounded-xl hover:bg-gray-700 transition-colors">إلغاء</button>
                  <button onClick={() => updateStatus(showConfirmModal.id, 'matched', showConfirmModal.action)} className="flex-1 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bold rounded-xl shadow-lg shadow-emerald-500/20 transition-all hover:scale-[1.02]">
                    {showConfirmModal.action === 'found_line' ? 'نعم، حصلت' : 'نعم، اكتمل العدد'}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
