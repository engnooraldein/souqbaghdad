import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Settings, Heart, ShoppingBag, MessageCircle, Bell, LogOut, Edit3, Camera, Share2, Star, MapPin, Calendar, Facebook, Twitter, Instagram, Check, Crown, ChevronLeft, ChevronRight, Globe, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';

interface UserProfileProps {
  onBack: () => void;
}

export function UserProfile({ onBack }: UserProfileProps) {
  const { user, updateProfile, logout } = useAuth();
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncTime, setSyncTime] = useState(localStorage.getItem('souq_profiles_sync_time') || '');

  const handleManualSync = async () => {
    setIsSyncing(true);
    try {
      const { data, error } = await supabase.from('profiles')
        .select('id, full_name, name, avatar_url, avatar, phone, city, location, created_at, role')
        .limit(1000);
      if (error) throw error;
      if (data) {
        localStorage.setItem('souq_cached_profiles', JSON.stringify(data));
        const now = new Date().toISOString();
        localStorage.setItem('souq_profiles_sync_time', now);
        setSyncTime(now);
        window.dispatchEvent(new CustomEvent('profiles-synced'));
        alert('تم تحديث دليل الحسابات بالكامل يدوياً بنجاح! 🔄');
      }
    } catch (e) {
      console.error(e);
      alert('حدث خطأ أثناء مزامنة الحسابات.');
    } finally {
      setIsSyncing(false);
    }
  };
  const [activeTab, setActiveTab] = useState('overview');
  const [isEditing, setIsEditing] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);

  // Edit form state
  const [editForm, setEditForm] = useState({
    name: user?.name || '',
    bio: user?.bio || '',
    location: user?.location || '',
    facebook: user?.socialLinks?.facebook || '',
    twitter: user?.socialLinks?.twitter || '',
    instagram: user?.socialLinks?.instagram || '',
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        updateProfile({ avatar: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  if (!user) return null;

  const handleSaveProfile = () => {
    updateProfile({
      name: editForm.name,
      bio: editForm.bio,
      location: editForm.location,
      socialLinks: {
        facebook: editForm.facebook,
        twitter: editForm.twitter,
        instagram: editForm.instagram,
      },
    });
    setIsEditing(false);
  };

  const handleLogout = () => {
    logout();
    onBack();
  };

  const shareToSocial = (platform: 'facebook' | 'twitter' | 'linkedin') => {
    const shareUrl = encodeURIComponent(window.location.href);
    const shareText = encodeURIComponent(`تحقق من ملفي في سوك بغداد - ${user.name}`);

    const urls: Record<string, string> = {
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${shareUrl}&quote=${shareText}`,
      twitter: `https://twitter.com/intent/tweet?url=${shareUrl}&text=${shareText}`,
      linkedin: `https://www.linkedin.com/shareArticle?mini=true&url=${shareUrl}&title=${shareText}`,
    };

    window.open(urls[platform], '_blank', 'width=600,height=400');
  };

  const tabs = [
    { id: 'overview', label: 'نظرة عامة', icon: User },
    { id: 'ads', label: 'إعلاناتي', icon: ShoppingBag },
    { id: 'favorites', label: 'المفضلة', icon: Heart },
    { id: 'messages', label: 'الرسائل', icon: MessageCircle },
    { id: 'settings', label: 'الإعدادات', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Banner & Header */}
      <div className="relative w-full">
        {/* Banner with 3:1 aspect ratio (or default bg) */}
        <div className="w-full aspect-[3/1] md:aspect-[4/1] bg-gray-800 relative overflow-hidden">
          {user.cover ? (
            <img src={user.cover} alt="Cover" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-gradient-to-r from-blue-900 via-blue-800 to-blue-900" />
          )}
          <button
            onClick={onBack}
            className="absolute top-4 right-4 p-2 bg-black/40 backdrop-blur-md rounded-xl text-white hover:bg-black/60 transition"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          
          <button className="absolute top-4 left-4 p-2 bg-black/40 backdrop-blur-md rounded-xl text-white hover:bg-black/60 transition">
            <Camera className="w-5 h-5" />
          </button>
        </div>

        <div className="container mx-auto px-4 relative">
          {/* Avatar & Actions Container */}
          <div className="flex justify-between items-end -mt-10 sm:-mt-16 mb-4 relative z-10">
            {/* Avatar */}
            <div className="relative">
              <img
                src={user.avatar || `data:image/svg+xml,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"><rect width="100" height="100" fill="#1e3a5f"/><circle cx="50" cy="38" r="18" fill="#4b7ab5"/><ellipse cx="50" cy="82" rx="28" ry="20" fill="#4b7ab5"/></svg>')}`}
                alt={user.name}
                className="w-24 h-24 sm:w-32 sm:h-32 rounded-full border-4 border-gray-900 object-cover bg-gray-800"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = `data:image/svg+xml,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"><rect width="100" height="100" fill="#1e3a5f"/><circle cx="50" cy="38" r="18" fill="#4b7ab5"/><ellipse cx="50" cy="82" rx="28" ry="20" fill="#4b7ab5"/></svg>')}`;
                }}
              />
              <input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={handleAvatarChange} />
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="absolute bottom-0 right-0 w-8 h-8 sm:w-10 sm:h-10 bg-amber-500 rounded-full flex items-center justify-center border-2 border-gray-900 hover:bg-amber-600 transition-colors shadow-lg cursor-pointer z-20">
                <Camera className="w-4 h-4 sm:w-5 sm:h-5 text-black" />
              </button>
            </div>
            {/* Action Buttons */}
            <div className="flex gap-2">
              <button
                onClick={() => setShowShareModal(true)}
                className="flex items-center gap-1 sm:gap-2 px-3 py-2 sm:px-4 sm:py-2 bg-gray-800 rounded-xl text-white hover:bg-gray-700 text-sm font-medium border border-gray-700"
              >
                <Share2 className="w-4 h-4" />
                <span className="hidden sm:inline">مشاركة</span>
              </button>
              <button
                onClick={() => setIsEditing(true)}
                className="flex items-center gap-1 sm:gap-2 px-3 py-2 sm:px-4 sm:py-2 bg-amber-500 rounded-xl text-black font-bold hover:bg-amber-600 text-sm border border-amber-500"
              >
                <Edit3 className="w-4 h-4" />
                <span>تعديل</span>
              </button>
            </div>
          </div>

          {/* User Details */}
          <div className="mb-4">
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-xl sm:text-2xl font-bold text-white leading-none">{user.name}</h1>
              {user.isVerified && (
                <div className="text-blue-500" title="موثق">
                  <Check className="w-4 h-4" />
                </div>
              )}
            </div>
            
            {/* Badges */}
            <div className="flex flex-wrap items-center gap-2 mt-2">
               {user.role === 'vendor' && (
                 <span className="px-2 py-1 bg-amber-500/20 text-amber-400 rounded-md text-xs font-semibold flex items-center gap-1">
                   <Crown className="w-3 h-3" /> تاجر موثق
                 </span>
               )}
               {user.badges?.isStudent && (
                 <span className="px-2 py-1 bg-blue-500/20 text-blue-400 rounded-md text-xs font-semibold flex items-center gap-1">
                   🎓 طالب موثق
                 </span>
               )}
               {user.badges?.hasVehicle && (
                 <span className="px-2 py-1 bg-green-500/20 text-green-400 rounded-md text-xs font-semibold flex items-center gap-1">
                   🚗 مركبة موثقة
                 </span>
               )}
               {user.badges?.hasID && (
                 <span className="px-2 py-1 bg-purple-500/20 text-purple-400 rounded-md text-xs font-semibold flex items-center gap-1">
                   🪪 هوية موثقة
                 </span>
               )}
               {user.badges?.isPhoneVerified && (
                 <span className="px-2 py-1 bg-sky-500/20 text-sky-400 rounded-md text-xs font-semibold flex items-center gap-1">
                   📱 هاتف موثق
                 </span>
               )}
            </div>

            <div className="flex flex-wrap gap-4 mt-3 text-sm text-gray-400">
              <div className="flex items-center gap-1">
                <MapPin className="w-4 h-4" />
                <span>{user.location || 'العراق'}</span>
              </div>
              {user.rating && (
                <div className="flex items-center gap-1 text-amber-400">
                  <Star className="w-4 h-4 fill-current" />
                  <span className="font-bold">{user.rating}</span>
                </div>
              )}
              <div className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                <span>انضم {user.createdAt}</span>
              </div>
            </div>
          </div>
          
          {/* Stats Bar */}
          <div className="grid grid-cols-3 gap-2 sm:gap-4 mb-6">
            <div className="bg-gray-800 rounded-xl p-3 border border-gray-700 text-center flex flex-col justify-center">
              <p className="text-xl font-bold text-white">{user.stats.ads}</p>
              <p className="text-gray-400 text-xs mt-1">إعلاناتي</p>
            </div>
            <div className="bg-gray-800 rounded-xl p-3 border border-gray-700 text-center flex flex-col justify-center">
              <p className="text-xl font-bold text-white">{user.stats.favorites}</p>
              <p className="text-gray-400 text-xs mt-1">مفضلة</p>
            </div>
            <div className="bg-gray-800 rounded-xl p-3 border border-gray-700 text-center flex flex-col justify-center">
              <p className="text-xl font-bold text-white">{user.stats.views}</p>
              <p className="text-gray-400 text-xs mt-1">مشاهدة</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="container mx-auto px-4 py-8">
        <div className="flex overflow-x-auto scrollbar-hide gap-2 pb-4">
          {tabs.map((tab) => (
            <motion.button
              key={tab.id}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-3 rounded-xl whitespace-nowrap transition-colors ${
                activeTab === tab.id
                  ? 'bg-amber-500 text-black font-semibold'
                  : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
              }`}
            >
              <tab.icon className="w-5 h-5" />
              <span>{tab.label}</span>
            </motion.button>
          ))}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-3 rounded-xl bg-red-500/20 text-red-400 hover:bg-red-500/30"
          >
            <LogOut className="w-5 h-5" />
            <span>خروج</span>
          </motion.button>
        </div>

        {/* Tab Content */}
        <div className="mt-6">
          {activeTab === 'overview' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              {/* Bio */}
              <div className="bg-gray-800 rounded-2xl p-6 border border-gray-700">
                <h3 className="text-white font-bold mb-4">نبذة عني</h3>
                <p className="text-gray-400">
                  {user.bio || 'لم تتم إضافة نبذة بعد'}
                </p>
              </div>

              {/* Recent Activity */}
              <div className="bg-gray-800 rounded-2xl p-6 border border-gray-700">
                <h3 className="text-white font-bold mb-4">النشاط الأخير</h3>
                <div className="space-y-4">
                  <div className="flex items-center gap-4 p-4 bg-gray-700/50 rounded-xl">
                    <div className="w-12 h-12 bg-amber-500/20 rounded-xl flex items-center justify-center">
                      <ShoppingBag className="w-6 h-6 text-amber-400" />
                    </div>
                    <div className="flex-1">
                      <p className="text-white">نشر إعلان جديد</p>
                      <p className="text-gray-400 text-sm">Mercedes AMG GT 2024</p>
                    </div>
                    <span className="text-gray-500 text-sm">منذ يوم</span>
                  </div>
                  <div className="flex items-center gap-4 p-4 bg-gray-700/50 rounded-xl">
                    <div className="w-12 h-12 bg-green-500/20 rounded-xl flex items-center justify-center">
                      <Heart className="w-6 h-6 text-green-400" />
                    </div>
                    <div className="flex-1">
                      <p className="text-white">إضافة للمفضلة</p>
                      <p className="text-gray-400 text-sm">فيلا في المنصور</p>
                    </div>
                    <span className="text-gray-500 text-sm">منذ 3 أيام</span>
                  </div>
                </div>
              </div>

              {/* Member Since */}
              <div className="bg-gray-800 rounded-2xl p-6 border border-gray-700">
                <h3 className="text-white font-bold mb-4">معلومات الحساب</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-3">
                    <Calendar className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-gray-400 text-sm">تاريخ التسجيل</p>
                      <p className="text-white">{user.createdAt}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Star className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-gray-400 text-sm">نوع الحساب</p>
                      <p className="text-white">
                        {user.role === 'admin' ? 'مدير' : user.role === 'vendor' ? 'تاجر' : 'مستخدم'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'ads' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="bg-gray-800 rounded-2xl p-6 border border-gray-700 text-center">
                <ShoppingBag className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                <p className="text-gray-400">لا توجد إعلانات نشطة</p>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="mt-4 px-6 py-3 bg-amber-500 text-black font-semibold rounded-xl"
                >
                  رفع إعلان جديد
                </motion.button>
              </div>
            </motion.div>
          )}

          {activeTab === 'favorites' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="bg-gray-800 rounded-2xl p-6 border border-gray-700 text-center">
                <Heart className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                <p className="text-gray-400">لا توجد مفضلات</p>
              </div>
            </motion.div>
          )}

          {activeTab === 'messages' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="bg-gray-800 rounded-2xl p-6 border border-gray-700 text-center">
                <MessageCircle className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                <p className="text-gray-400">لا توجد رسائل</p>
              </div>
            </motion.div>
          )}

          {activeTab === 'settings' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              {/* Data Usage & Sync Card */}
              <div className="bg-gray-800 rounded-2xl p-6 border border-gray-700">
                <h3 className="text-white font-bold flex items-center gap-2 mb-3">
                  <Globe className="w-4 h-4 text-emerald-400"/> استهلاك البيانات والمزامنة
                </h3>
                <p className="text-gray-400 text-xs mb-4 leading-relaxed">
                  يتم تلقائياً تحميل الحسابات الموثقة فقط لتوفير استهلاك بيانات الإنترنت (الإنترنت الخلوي). يمكنك مزامنة الدليل بالكامل يدوياً وحفظه محلياً لتصفح كافة الحسابات.
                </p>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-4 border-t border-gray-700">
                  <div className="text-right">
                    <span className="text-gray-400 text-xs block">تاريخ المزامنة اليدوية</span>
                    <span className="text-white text-xs font-bold font-mono">
                      {syncTime 
                        ? new Date(syncTime).toLocaleString('ar-IQ') 
                        : 'لم تتم المزامنة الكاملة بعد'}
                    </span>
                  </div>
                  <button
                    onClick={handleManualSync}
                    disabled={isSyncing}
                    className="py-2 px-4 bg-emerald-500 hover:bg-emerald-600 disabled:bg-gray-700 text-black font-bold rounded-xl text-xs flex items-center gap-1.5 transition-colors self-end sm:self-center shadow-lg"
                  >
                    {isSyncing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <span>🔄 مزامنة الحسابات الآن</span>}
                  </button>
                </div>
              </div>

              <div className="bg-gray-800 rounded-2xl p-6 border border-gray-700">
                <h3 className="text-white font-bold mb-4">إعدادات الحساب</h3>
                <div className="space-y-4">
                  <button className="w-full flex items-center justify-between p-4 bg-gray-700/50 rounded-xl hover:bg-gray-700 transition-colors">
                    <span className="text-white">تغيير كلمة المرور</span>
                    <ChevronLeft className="w-5 h-5 text-gray-400" />
                  </button>
                  <button className="w-full flex items-center justify-between p-4 bg-gray-700/50 rounded-xl hover:bg-gray-700 transition-colors">
                    <span className="text-white">الإشعارات</span>
                    <ChevronLeft className="w-5 h-5 text-gray-400" />
                  </button>
                  <button className="w-full flex items-center justify-between p-4 bg-gray-700/50 rounded-xl hover:bg-gray-700 transition-colors">
                    <span className="text-white">الخصوصية</span>
                    <ChevronLeft className="w-5 h-5 text-gray-400" />
                  </button>
                  <button className="w-full flex items-center justify-between p-4 bg-red-500/10 rounded-xl hover:bg-red-500/20 transition-colors">
                    <span className="text-red-400">حذف الحساب</span>
                    <ChevronLeft className="w-5 h-5 text-red-400" />
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </div>

      {/* Edit Profile Modal */}
      <AnimatePresence>
        {isEditing && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
            onClick={() => setIsEditing(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-gray-800 rounded-2xl p-6 max-w-md w-full border border-gray-700"
            >
              <h2 className="text-xl font-bold text-white mb-6">تعديل الملف الشخصي</h2>

              <div className="space-y-4">
                <div>
                  <label className="text-gray-400 text-sm mb-2 block">الاسم</label>
                  <input
                    type="text"
                    value={editForm.name}
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                    className="w-full bg-gray-700 text-white rounded-xl py-3 px-4 border border-gray-600 focus:border-amber-400"
                  />
                </div>
                <div>
                  <label className="text-gray-400 text-sm mb-2 block">نبذة</label>
                  <textarea
                    value={editForm.bio}
                    onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })}
                    rows={3}
                    className="w-full bg-gray-700 text-white rounded-xl py-3 px-4 border border-gray-600 focus:border-amber-400"
                  />
                </div>
                <div>
                  <label className="text-gray-400 text-sm mb-2 block">الموقع</label>
                  <input
                    type="text"
                    value={editForm.location}
                    onChange={(e) => setEditForm({ ...editForm, location: e.target.value })}
                    className="w-full bg-gray-700 text-white rounded-xl py-3 px-4 border border-gray-600 focus:border-amber-400"
                  />
                </div>

                <div className="border-t border-gray-700 pt-4">
                  <label className="text-gray-400 text-sm mb-2 block">روابط التواصل</label>
                  <div className="space-y-2">
                    <input
                      type="url"
                      placeholder="رابط فيسبوك"
                      value={editForm.facebook}
                      onChange={(e) => setEditForm({ ...editForm, facebook: e.target.value })}
                      className="w-full bg-gray-700 text-white rounded-xl py-3 px-4 border border-gray-600 focus:border-amber-400"
                    />
                    <input
                      type="url"
                      placeholder="رابط تويتر"
                      value={editForm.twitter}
                      onChange={(e) => setEditForm({ ...editForm, twitter: e.target.value })}
                      className="w-full bg-gray-700 text-white rounded-xl py-3 px-4 border border-gray-600 focus:border-amber-400"
                    />
                    <input
                      type="url"
                      placeholder="رابط إنستغرام"
                      value={editForm.instagram}
                      onChange={(e) => setEditForm({ ...editForm, instagram: e.target.value })}
                      className="w-full bg-gray-700 text-white rounded-xl py-3 px-4 border border-gray-600 focus:border-amber-400"
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleSaveProfile}
                  className="flex-1 py-3 bg-amber-500 text-black font-semibold rounded-xl"
                >
                  حفظ التغييرات
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setIsEditing(false)}
                  className="px-6 py-3 bg-gray-700 text-white rounded-xl"
                >
                  إلغاء
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Share Modal */}
      <AnimatePresence>
        {showShareModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
            onClick={() => setShowShareModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-gray-800 rounded-2xl p-6 max-w-sm w-full border border-gray-700"
            >
              <h2 className="text-xl font-bold text-white mb-6 text-center">مشاركة الملف الشخصي</h2>

              <div className="grid grid-cols-3 gap-4">
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  onClick={() => shareToSocial('facebook')}
                  className="flex flex-col items-center gap-2 p-4 bg-blue-600 rounded-xl text-white"
                >
                  <Facebook className="w-8 h-8" />
                  <span className="text-sm">فيسبوك</span>
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  onClick={() => shareToSocial('twitter')}
                  className="flex flex-col items-center gap-2 p-4 bg-sky-500 rounded-xl text-white"
                >
                  <Twitter className="w-8 h-8" />
                  <span className="text-sm">تويتر</span>
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  onClick={() => {
                    navigator.clipboard.writeText(window.location.href);
                    setShowShareModal(false);
                  }}
                  className="flex flex-col items-center gap-2 p-4 bg-gray-600 rounded-xl text-white"
                >
                  <Share2 className="w-8 h-8" />
                  <span className="text-sm">نسخ الرابط</span>
                </motion.button>
              </div>

              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowShareModal(false)}
                className="w-full mt-4 py-3 bg-gray-700 text-white rounded-xl"
              >
                إغلاق
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}