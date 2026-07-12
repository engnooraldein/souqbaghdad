import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Settings, Heart, ShoppingBag, MessageCircle, Bell, LogOut, Edit3, Camera, Share2, Star, MapPin, Calendar, Facebook, Twitter, Instagram, Check, Crown, ChevronLeft, ChevronRight, ToggleLeft, ToggleRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useFeatureFlags } from '../context/FeatureFlagsContext';

interface UserProfileProps {
  onBack: () => void;
}

export function UserProfile({ onBack }: UserProfileProps) {
  const { user, updateProfile, logout } = useAuth();
  const { flags, labels, updateFlag, resetFlags, isEnabled } = useFeatureFlags();
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
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-900 via-blue-800 to-blue-900 pt-8 pb-20 relative overflow-hidden">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-10 right-10 w-40 h-40 bg-amber-400 rounded-full blur-3xl" />
          <div className="absolute bottom-10 left-10 w-60 h-60 bg-blue-400 rounded-full blur-3xl" />
        </div>

        <div className="container mx-auto px-4 relative z-10">
          <button
            onClick={onBack}
            className="p-2 bg-white/10 rounded-xl text-white hover:bg-white/20 mb-4"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>

          <div className="flex flex-col md:flex-row items-center gap-6">
            {/* Avatar */}
            <div className="relative">
              <motion.div
                whileHover={{ scale: 1.05 }}
                className="relative"
              >
                <img
                  src={user.avatar}
                  alt={user.name}
                  className="w-32 h-32 rounded-full border-4 border-amber-400 object-cover"
                />
                {user.isVerified && (
                  <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center border-4 border-gray-900">
                    <Check className="w-6 h-6 text-white" />
                  </div>
                )}
                {user.role === 'admin' && (
                  <div className="absolute -top-2 -left-2 w-10 h-10 bg-amber-500 rounded-full flex items-center justify-center border-4 border-gray-900">
                    <Crown className="w-5 h-5 text-black" />
                  </div>
                )}
              </motion.div>
              <button className="absolute bottom-0 right-0 w-10 h-10 bg-amber-500 rounded-full flex items-center justify-center border-4 border-gray-900 hover:bg-amber-600 transition-colors">
                <Camera className="w-5 h-5 text-black" />
              </button>
            </div>

            {/* User Info */}
            <div className="text-center md:text-right flex-1">
              <div className="flex items-center justify-center md:justify-start gap-2 mb-2">
                <h1 className="text-2xl font-bold text-white">{user.name}</h1>
                {user.role === 'vendor' && (
                  <span className="px-2 py-1 bg-amber-500/20 text-amber-400 rounded-full text-xs font-semibold">
                    تاجر موثق
                  </span>
                )}
              </div>
              <p className="text-gray-400 mb-2">{user.email}</p>
              {user.location && (
                <div className="flex items-center justify-center md:justify-start gap-1 text-gray-400 text-sm">
                  <MapPin className="w-4 h-4" />
                  <span>{user.location}</span>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowShareModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-white/10 rounded-xl text-white hover:bg-white/20"
              >
                <Share2 className="w-5 h-5" />
                <span className="hidden sm:inline">مشاركة</span>
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsEditing(true)}
                className="flex items-center gap-2 px-4 py-2 bg-amber-500 rounded-xl text-black font-semibold hover:bg-amber-600"
              >
                <Edit3 className="w-5 h-5" />
                <span className="hidden sm:inline">تعديل</span>
              </motion.button>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="container mx-auto px-4 -mt-10 relative z-10">
        <div className="bg-gray-800 rounded-2xl p-6 border border-gray-700">
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <p className="text-3xl font-bold text-amber-400">{user.stats.ads}</p>
              <p className="text-gray-400 text-sm">إعلان</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-amber-400">{user.stats.favorites}</p>
              <p className="text-gray-400 text-sm">مفضلة</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-amber-400">{user.stats.views}</p>
              <p className="text-gray-400 text-sm">مشاهدة</p>
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
              {user.role === 'admin' && (
                <div className="bg-gray-800 rounded-2xl p-6 border border-gray-700">
                  <div className="flex items-center justify-between gap-4 mb-4">
                    <div>
                      <h3 className="text-white font-bold">لوحة مفاتيح الميزات</h3>
                      <p className="text-gray-400 text-sm mt-1">تفعيل أو إخفاء الخصائص من مكان واحد.</p>
                    </div>
                    <button
                      onClick={() => void resetFlags()}
                      className="px-3 py-2 rounded-xl bg-gray-700 text-white text-sm hover:bg-gray-600"
                    >
                      استعادة الافتراضي
                    </button>
                  </div>
                  <div className="grid gap-3 md:grid-cols-2">
                    {(Object.keys(flags) as Array<keyof typeof flags>).map((key) => (
                      <button
                        key={String(key)}
                        onClick={() => void updateFlag(key, !isEnabled(key))}
                        className="flex items-center justify-between gap-3 rounded-xl border border-gray-700 bg-gray-700/50 p-4 text-right hover:border-amber-400/40 hover:bg-gray-700"
                      >
                        <div>
                          <p className="text-white font-medium">{labels[key]}</p>
                          <p className="text-gray-400 text-xs mt-1">{isEnabled(key) ? 'مفعلة' : 'مخفية'}</p>
                        </div>
                        {isEnabled(key) ? (
                          <ToggleRight className="w-6 h-6 text-emerald-400" />
                        ) : (
                          <ToggleLeft className="w-6 h-6 text-gray-500" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}

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
              onClick={(e: React.MouseEvent) => e.stopPropagation()}
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
              onClick={(e: React.MouseEvent) => e.stopPropagation()}
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
