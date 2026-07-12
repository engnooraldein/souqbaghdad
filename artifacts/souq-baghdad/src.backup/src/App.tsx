import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, EyeOff, Mail, Lock, User, Phone, AlertCircle, Check, ArrowLeft, Facebook, Chrome, Gamepad2, ShoppingBag, Home, Smartphone, Car, Video, Heart, MessageCircle, Bell, Plus, Sun, Moon, Settings, LogOut, Crown, Shield, Star, Sparkles, ChevronLeft, Play, X, Search, Filter, MapPin, Clock, Eye as ViewIcon, Phone as PhoneIcon, Send, Camera, Image, MapPin as LocationIcon, Tag, DollarSign, Grid, List, SlidersHorizontal, ChevronDown, UserCircle, Cpu, Menu, ArrowRight, MessageSquare } from 'lucide-react';
import { useAuth } from './context/AuthContext';
import { useFeatureFlags } from './context/FeatureFlagsContext';
import { supabase } from './lib/supabase';
import { UserProfile } from './components/UserProfile';
import { AICenter } from './components/AICenter';

// Logo Component with Iraqi Eagle
function Logo() {
  return (
    <div className="flex items-center gap-3">
      <div className="w-14 h-14 bg-gradient-to-br from-blue-900 to-blue-950 rounded-xl flex items-center justify-center shadow-lg golden-glow border-2 border-amber-500/30">
        <svg viewBox="0 0 120 120" className="w-10 h-10">
          <defs>
            <linearGradient id="eagleGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#d4af37" />
              <stop offset="50%" stopColor="#f4d03f" />
              <stop offset="100%" stopColor="#d4af37" />
            </linearGradient>
          </defs>
          <ellipse cx="60" cy="50" rx="25" ry="20" fill="url(#eagleGrad)" />
          <path d="M35 50 Q20 35 15 55 Q10 75 30 70" fill="url(#eagleGrad)" opacity="0.9" />
          <path d="M85 50 Q100 35 105 55 Q110 75 90 70" fill="url(#eagleGrad)" opacity="0.9" />
          <circle cx="60" cy="35" r="12" fill="url(#eagleGrad)" />
          <path d="M72 33 L85 38 L72 42 Z" fill="#d4af37" />
          <path d="M50 25 Q60 15 70 25 Q60 20 50 25" fill="#d4af37" />
          <path d="M45 55 L75 55 L75 85 L60 95 L45 85 Z" fill="#1e3a8a" stroke="#d4af37" strokeWidth="2" />
          <rect x="48" y="60" width="24" height="6" fill="#ffffff" />
          <rect x="48" y="66" width="24" height="6" fill="#000000" />
          <rect x="48" y="72" width="24" height="6" fill="#ce1126" />
          <path d="M50 90 Q45 100 40 105 M55 92 Q52 102 48 107" stroke="url(#eagleGrad)" strokeWidth="3" strokeLinecap="round" fill="none" />
          <path d="M70 90 Q75 100 80 105 M65 92 Q68 102 72 107" stroke="url(#eagleGrad)" strokeWidth="3" strokeLinecap="round" fill="none" />
        </svg>
      </div>
      <div>
        <h1 className="text-2xl font-bold text-white">سوك بغداد</h1>
        <p className="text-amber-400 text-sm">السوق الرقمي العراقي</p>
      </div>
    </div>
  );
}

function normalizeIraqiPhone(phone: string) {
  const digits = phone.replace(/\D/g, '');
  if (!digits) return '';
  if (digits.startsWith('964')) return digits;
  if (digits.startsWith('0')) return `964${digits.slice(1)}`;
  return digits;
}

function buildAdWhatsAppMessage(ad: any) {
  const title = ad?.title || 'الإعلان';
  const location = ad?.location || 'غير محدد';
  const listingType = ad?.type === 'rent' ? 'إعلان إيجار' : 'إعلان';

  return [
    'السلام عليكم 🌹',
    '',
    `شفت ${listingType} (${title}) وحاب أستفسر عنه إذا متوفر حالياً.`,
    '',
    'تفاصيل الإعلان:',
    `📌 ${title}`,
    `📍 ${location}`,
    '',
    'تم إرسال هذه الرسالة مباشرة من خلال منصة سوك بغداد لتسهيل التواصل بين البائع والمشتري.',
    '',
    'بانتظار ردكم، شكراً 🙏',
    '',
    'تم الإرسال عبر سوك بغداد.',
    'منصة تجمع الخدمات والإعلانات والفرص المحلية في مكان واحد.',
  ].join('\n');
}

// Auth Page Component
function AuthPage() {
  const { login, register, demoLogin } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [registerName, setRegisterName] = useState('');
  const [registerEmail, setRegisterEmail] = useState('');
  const [registerPassword, setRegisterPassword] = useState('');
  const [registerPhone, setRegisterPhone] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsLoading(true);

    const result = await login(loginEmail.trim(), loginPassword);
    if (result.success) {
      setSuccess('تم تسجيل الدخول بنجاح!');
    } else {
      setError(result.message || 'فشل تسجيل الدخول، تأكد من البريد أو كلمة المرور');
    }

    setIsLoading(false);
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsLoading(true);

    const result = await register(registerName.trim(), registerEmail.trim(), registerPassword, registerPhone.trim());
    if (result.success) {
      setSuccess('تم إنشاء حسابك بنجاح!');
    } else {
      setError(result.message || 'فشل التسجيل، حاول مرة أخرى أو تأكد من المعلومات');
    }

    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-blue-900 flex items-center justify-center p-4">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-20 left-20 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-blue-400/10 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] border border-blue-500/10 rounded-full" />
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md relative z-10"
      >
        <div className="text-center mb-8">
          <Logo />
        </div>

        <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-8 border border-white/20">
          <div className="text-center mb-6">
            <motion.div
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="text-5xl mb-3"
            >
              🔐
            </motion.div>
            <h1 className="text-2xl font-bold text-white mb-2">
              {isLogin ? 'تسجيل الدخول' : 'إنشاء حساب جديد'}
            </h1>
            <p className="text-gray-400 text-sm">
              {isLogin ? 'مرحباً بعودتك!' : 'انضم إلينا اليوم'}
            </p>
          </div>

          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="bg-red-500/20 border border-red-500/30 rounded-xl p-3 mb-4 flex items-center gap-2"
              >
                <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
                <span className="text-red-400 text-sm">{error}</span>
              </motion.div>
            )}
            {success && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="bg-green-500/20 border border-green-500/30 rounded-xl p-3 mb-4 flex items-center gap-2"
              >
                <Check className="w-5 h-5 text-green-400 flex-shrink-0" />
                <span className="text-green-400 text-sm">{success}</span>
              </motion.div>
            )}
          </AnimatePresence>

          {isLogin ? (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="text-gray-300 text-sm mb-2 block">البريد الإلكتروني أو الهاتف</label>
                <div className="relative">
                  <Mail className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    placeholder="example@email.com"
                    required
                    className="w-full bg-gray-800/50 text-white placeholder-gray-400 rounded-xl py-3 pr-12 pl-4 border border-gray-700 focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="text-gray-300 text-sm mb-2 block">كلمة المرور</label>
                <div className="relative">
                  <Lock className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    className="w-full bg-gray-800/50 text-white placeholder-gray-400 rounded-xl py-3 pr-12 pl-4 border border-gray-700 focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <motion.button
                type="submit"
                disabled={isLoading}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full py-4 bg-gradient-to-r from-amber-500 to-yellow-500 text-black font-bold rounded-xl hover:shadow-lg hover:shadow-amber-500/30 transition-all disabled:opacity-50"
              >
                {isLoading ? 'جاري التحميل...' : 'تسجيل الدخول'}
              </motion.button>

              <button
                type="button"
                onClick={() => {
                  demoLogin();
                  setSuccess('تم دخولك كحساب تجريبي');
                }}
                className="w-full py-3 rounded-xl border border-amber-400/40 text-amber-100 bg-amber-400/10 hover:bg-amber-400/20 transition-colors text-sm"
              >
                الدخول بحساب تجريبي
              </button>
            </form>
          ) : (
            <form onSubmit={handleRegister} className="space-y-4">
              <div>
                <label className="text-gray-300 text-sm mb-2 block">الاسم الكامل</label>
                <div className="relative">
                  <User className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    value={registerName}
                    onChange={(e) => setRegisterName(e.target.value)}
                    placeholder="أحمد محمد"
                    required
                    className="w-full bg-gray-800/50 text-white placeholder-gray-400 rounded-xl py-3 pr-12 pl-4 border border-gray-700 focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="text-gray-300 text-sm mb-2 block">البريد الإلكتروني</label>
                <div className="relative">
                  <Mail className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="email"
                    value={registerEmail}
                    onChange={(e) => setRegisterEmail(e.target.value)}
                    placeholder="example@email.com"
                    required
                    className="w-full bg-gray-800/50 text-white placeholder-gray-400 rounded-xl py-3 pr-12 pl-4 border border-gray-700 focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="text-gray-300 text-sm mb-2 block">رقم الهاتف</label>
                <div className="relative">
                  <Phone className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="tel"
                    value={registerPhone}
                    onChange={(e) => setRegisterPhone(e.target.value)}
                    placeholder="07XXXXXXXXX"
                    required
                    className="w-full bg-gray-800/50 text-white placeholder-gray-400 rounded-xl py-3 pr-12 pl-4 border border-gray-700 focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="text-gray-300 text-sm mb-2 block">كلمة المرور</label>
                <div className="relative">
                  <Lock className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={registerPassword}
                    onChange={(e) => setRegisterPassword(e.target.value)}
                    placeholder="4 أحرف على الأقل"
                    required
                    minLength={4}
                    className="w-full bg-gray-800/50 text-white placeholder-gray-400 rounded-xl py-3 pr-12 pl-4 border border-gray-700 focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <motion.button
                type="submit"
                disabled={isLoading}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full py-4 bg-gradient-to-r from-amber-500 to-yellow-500 text-black font-bold rounded-xl hover:shadow-lg hover:shadow-amber-500/30 transition-all disabled:opacity-50"
              >
                {isLoading ? 'جاري التحميل...' : 'إنشاء حساب'}
              </motion.button>
            </form>
          )}

          <div className="mt-6">
            <div className="flex items-center gap-4 mb-4">
              <div className="flex-1 h-px bg-gray-700" />
              <span className="text-gray-400 text-sm">أو</span>
              <div className="flex-1 h-px bg-gray-700" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="flex items-center justify-center gap-2 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
              >
                <Facebook className="w-5 h-5" />
                <span className="text-sm">فيسبوك</span>
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="flex items-center justify-center gap-2 py-3 bg-white text-gray-800 rounded-xl hover:bg-gray-100 transition-colors"
              >
                <Chrome className="w-5 h-5" />
                <span className="text-sm">جوجل</span>
              </motion.button>
            </div>
          </div>

          <div className="mt-6 text-center">
            <button
              onClick={() => {
                setIsLogin(!isLogin);
                setError('');
                setSuccess('');
              }}
              className="text-gray-400 hover:text-amber-400 text-sm transition-colors"
            >
              {isLogin ? 'ليس لديك حساب؟ سجل الآن' : 'لديك حساب؟ تسجيل الدخول'}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

// Ads Data - Real looking ads
const adsData = [
  { id: 1, title: 'Toyota Land Cruiser 2024', price: '850,000,000', location: 'بغداد - المنصور', phone: '07701234567', category: 'cars', image: 'https://images.unsplash.com/photo-1625231334168-2e3c5d7d6b88?w=400', seller: 'أحمد العاني', time: 'منذ ساعة', views: 234, type: 'sell' },
  { id: 2, title: 'فيلا 400 متر للبيع', price: '1,200,000,000', location: 'أربيل - مركز المدينة', phone: '07501234567', category: 'real-estate', image: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=400', seller: 'محمد الركابي', time: 'منذ 3 ساعات', views: 456, type: 'sell' },
  { id: 3, title: 'iPhone 15 Pro Max 256GB', price: '950,000', location: 'بغداد - الكرادة', phone: '07801234567', category: 'phones', image: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=400', seller: 'Ali Hassan', time: 'منذ 5 ساعات', views: 123, type: 'sell' },
  { id: 4, title: 'Mercedes G63 AMG 2023', price: '1,500,000,000', location: 'البصرة', phone: '07721234567', category: 'cars', image: 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=400', seller: 'سعد المالكي', time: 'منذ يوم', views: 567, type: 'sell' },
  { id: 5, title: 'Samsung Galaxy S24 Ultra', price: '800,000', location: 'نينوى', phone: '07531234567', category: 'phones', image: 'https://images.unsplash.com/photo-1610945415295-d9bbf67e5972?w=400', seller: 'Omar Khalid', time: 'منذ يوم', views: 89, type: 'sell' },
  { id: 6, title: 'شقة 150 متر للإيجار', price: '1,500,000', location: 'كربلاء', phone: '07841234567', category: 'real-estate', image: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=400', seller: 'حسن الموسوي', time: 'منذ يومين', views: 234, type: 'rent' },
  { id: 7, title: 'BMW X7 2024', price: '950,000,000', location: 'دهوك', phone: '07751234567', category: 'cars', image: 'https://images.unsplash.com/photo-1555215695-3004980ad54e?w=400', seller: 'Rebaz Ali', time: 'منذ يومين', views: 345, type: 'sell' },
  { id: 8, title: 'MacBook Pro M3 14"', price: '1,200,000', location: 'السليمانية', phone: '07561234567', category: 'electronics', image: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=400', seller: 'Zana Kareem', time: 'منذ 3 أيام', views: 167, type: 'sell' },
];

const initialAds = adsData.map((ad) => ({
  ...ad,
  publishedAt: ad.publishedAt || new Date().toISOString(),
  lastUpdated: ad.lastUpdated || new Date().toISOString(),
  status: ad.status || 'active',
  images: ad.images || (ad.image ? [ad.image] : []),
  interestedCount: ad.interestedCount || 0,
}));

const mapDbRowToAd = (row: any) => ({
  id: Number(row.id) || Date.now() + Math.random(),
  title: row.title || 'إعلان',
  price: String(row.price || '0'),
  location: row.location || row.city || 'بغداد',
  city: row.city || row.location || 'بغداد',
  phone: row.phone || '',
  category: row.category || 'other',
  image: row.image || row.images?.[0] || '',
  images: Array.isArray(row.images) && row.images.length ? row.images : row.image ? [row.image] : [],
  seller: row.seller_name || 'بائع سوك بغداد',
  sellerRating: Number(row.seller_rating) || 4.8,
  sellerFollowers: Number(row.seller_followers) || 0,
  time: row.published_at ? 'الآن' : 'منذ فترة',
  views: Number(row.views) || 0,
  interestedCount: Number(row.interested_count) || 0,
  type: row.type || 'sell',
  currency: row.currency || 'IQD',
  visibility: row.visibility || 'public',
  publishedAt: row.published_at || row.created_at || new Date().toISOString(),
  lastUpdated: row.last_updated || row.created_at || new Date().toISOString(),
  status: row.status || 'active',
  isFeatured: !!row.is_featured,
  isDemo: !!row.is_demo,
  video: row.video_url || '',
});

const mapAdToDbRow = (ad: any, seller: any) => ({
  title: ad.title,
  description: ad.description || '',
  price: ad.price,
  category: ad.category,
  location: ad.location,
  city: ad.city || ad.location,
  images: ad.images || (ad.image ? [ad.image] : []),
  image: ad.image || ad.images?.[0] || '',
  seller_id: seller?.id || null,
  seller_name: seller?.name || ad.seller || 'بائع سوك بغداد',
  seller_avatar: seller?.avatar || '',
  seller_rating: ad.sellerRating || 4.8,
  seller_followers: ad.sellerFollowers || 0,
  type: ad.type || 'sell',
  currency: ad.currency || 'IQD',
  visibility: ad.visibility || 'public',
  views: ad.views || 0,
  likes: ad.likes || 0,
  interested_count: ad.interestedCount || 0,
  status: ad.status || 'active',
  published_at: ad.publishedAt || new Date().toISOString(),
  last_updated: ad.lastUpdated || new Date().toISOString(),
  is_featured: !!ad.isFeatured,
  is_demo: !!ad.isDemo,
  video_url: ad.video || null,
});

// Games Data
const gamesData = [
  { id: 1, title: 'ضارب الدجاج', emoji: '🐔💥', players: '1', rating: 4.9, description: 'لعبة ممتعة لضرب الدجاج' },
  { id: 2, title: 'ورق طاولي', emoji: '🃏', players: '2-4', rating: 4.8, description: 'لعبة ورق كلاسيكية' },
  { id: 3, title: 'داما', emoji: '🎲', players: '2', rating: 4.6, description: 'لعبة الداما الشهيرة' },
  { id: 4, title: 'سودوكو', emoji: '🧩', players: '1', rating: 4.5, description: 'لغز الأرقام' },
  { id: 5, title: 'شطرنج', emoji: '♟️', players: '2', rating: 4.7, description: 'لعبة الشطرنج' },
  { id: 6, title: 'بورت', emoji: '🎴', players: '2-4', rating: 4.4, description: 'لعبة البورت' },
];

// Create Ad Modal
function CreateAdModal({ isOpen, onClose, onSubmit }: { isOpen: boolean; onClose: () => void; onSubmit: (data: any) => void }) {
  const [formData, setFormData] = useState({
    title: '',
    price: '',
    currency: 'IQD',
    visibility: 'public',
    description: '',
    category: 'cars',
    city: 'بغداد',
    phone: '',
    type: 'sell',
  });

  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [status, setStatus] = useState<string>('');
  const [progress, setProgress] = useState<number>(0);
  const categories = [
    { id: 'cars', name: 'سيارات', icon: Car },
    { id: 'real-estate', name: 'عقارات', icon: Home },
    { id: 'phones', name: 'هواتف', icon: Smartphone },
    { id: 'electronics', name: 'إلكترونيات', icon: Phone },
    { id: 'furniture', name: 'أثاث', icon: Home },
  ];

  const cities = ['بغداد', 'أربيل', 'البصرة', 'نينوى', 'كربلاء', 'النجف', 'دهوك', 'السليمانية', 'بابل', 'ديالى'];

  const compressImage = async (file: File) => {
    if (!file.type.startsWith('image/')) return file;
    const bitmap = await createImageBitmap(file);
    const maxWidth = 1400;
    const scale = Math.min(1, maxWidth / bitmap.width);
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    const ctx = canvas.getContext('2d');
    if (!ctx) return file;
    ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    return new Promise<File>((resolve) => {
      canvas.toBlob((blob) => {
        if (!blob) {
          resolve(file);
          return;
        }
        resolve(new File([blob], file.name, { type: blob.type }));
      }, 'image/jpeg', 0.78);
    });
  };

  const formatPriceInput = (value: string) => {
    const onlyDigits = value.replace(/[^0-9]/g, '');
    if (!onlyDigits) return '';
    return onlyDigits.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    (async () => {
      try {
        if (files.length === 0) {
          setStatus('يجب إضافة صورة واحدة على الأقل');
          return;
        }
        setStatus('جاري رفع الإعلان...');
        playTone(660, 0.12);

        const uploadedUrls: string[] = [];
        for (let i = 0; i < files.length; i++) {
          const file = files[i];
          const compressedFile = await compressImage(file);
          const path = `ads/${Date.now()}_${Math.random().toString(36).slice(2,9)}_${compressedFile.name}`;
          const { error } = await supabase.storage.from('ads').upload(path, compressedFile, { upsert: true });
          if (error) throw error;
          const { data: urlData } = supabase.storage.from('ads').getPublicUrl(path);
          uploadedUrls.push(urlData.publicUrl);
          setProgress(Math.round(((i + 1) / files.length) * 100));
        }

        const createdAd = {
          id: Date.now(),
          title: formData.title,
          price: formData.price,
          currency: formData.currency,
          visibility: formData.visibility,
          description: formData.description,
          location: formData.city,
          city: formData.city,
          phone: formData.phone,
          category: formData.category,
          image: uploadedUrls[0] || '',
          images: uploadedUrls,
          seller: 'أنت',
          sellerRating: 4.8,
          sellerFollowers: 0,
          time: 'الآن',
          views: 0,
          interestedCount: 0,
          type: formData.type,
          publishedAt: new Date().toISOString(),
          lastUpdated: new Date().toISOString(),
          status: 'active',
        };

        setStatus('تم نشر الإعلان بنجاح');
        playTone(880, 0.15);
        onSubmit(createdAd);

        setTimeout(() => {
          onClose();
          setStatus('');
          setFiles([]);
          setPreviews([]);
          setProgress(0);
          setFormData({
            title: '',
            price: '',
            currency: 'IQD',
            visibility: 'public',
            description: '',
            category: 'cars',
            city: 'بغداد',
            phone: '',
            type: 'sell',
          });
        }, 800);
      } catch (err) {
        console.error('Upload error', err);
        setStatus('حدث خطأ في الرفع');
        playTone(220, 0.2);
      }
    })();
  };

  function playTone(freq = 440, duration = 0.1) {
    try {
      const AudioCtx = (window as any).AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioCtx();
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = 'sine';
      o.frequency.value = freq;
      o.connect(g);
      g.connect(ctx.destination);
      g.gain.setValueAtTime(0.0001, ctx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.08, ctx.currentTime + 0.01);
      o.start();
      g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);
      setTimeout(() => { o.stop(); ctx.close(); }, (duration + 0.05) * 1000);
    } catch (e) {
      // ignore audio errors
    }
  }

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
    >
      <div className="absolute inset-0 bg-black/70" onClick={onClose} />
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="relative bg-gray-900 rounded-3xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto border border-gray-700"
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-white">رفع إعلان جديد</h2>
          <button onClick={onClose} className="p-2 bg-gray-800 rounded-xl text-gray-400 hover:text-white">
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-gray-300 text-sm mb-2 block">نوع الإعلان</label>
            <div className="grid grid-cols-2 gap-2">
              {['sell', 'rent'].map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setFormData({ ...formData, type })}
                  className={`py-2 rounded-xl font-medium ${formData.type === type ? 'bg-amber-500 text-black' : 'bg-gray-800 text-gray-400'}`}
                >
                  {type === 'sell' ? 'للبيع' : 'للإيجار'}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-gray-300 text-sm mb-2 block">التصنيف</label>
            <div className="grid grid-cols-3 gap-2">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setFormData({ ...formData, category: cat.id })}
                  className={`p-3 rounded-xl flex flex-col items-center gap-1 ${formData.category === cat.id ? 'bg-amber-500 text-black' : 'bg-gray-800 text-gray-400'}`}
                >
                  <cat.icon className="w-5 h-5" />
                  <span className="text-xs">{cat.name}</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-gray-300 text-sm mb-2 block">عنوان الإعلان</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="مثال: Toyota Land Cruiser 2024"
              required
              className="w-full bg-gray-800 text-white rounded-xl py-3 px-4 border border-gray-700 focus:border-amber-400"
            />
          </div>

          <div>
            <label className="text-gray-300 text-sm mb-2 block">السعر (دينار عراقي)</label>
            <input
              type="text"
              value={formData.price}
              onChange={(e) => setFormData({ ...formData, price: e.target.value })}
              placeholder="مثال: 850,000,000"
              required
              className="w-full bg-gray-800 text-white rounded-xl py-3 px-4 border border-gray-700 focus:border-amber-400"
            />
          </div>

          <div>
            <label className="text-gray-300 text-sm mb-2 block">المدينة</label>
            <select
              value={formData.city}
              onChange={(e) => setFormData({ ...formData, city: e.target.value })}
              className="w-full bg-gray-800 text-white rounded-xl py-3 px-4 border border-gray-700 focus:border-amber-400"
            >
              {cities.map((city) => (
                <option key={city} value={city}>{city}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-gray-300 text-sm mb-2 block">رقم الهاتف للتواصل</label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="07XXXXXXXXX"
              required
              className="w-full bg-gray-800 text-white rounded-xl py-3 px-4 border border-gray-700 focus:border-amber-400"
            />
          </div>

          <div>
            <label className="text-gray-300 text-sm mb-2 block">وصف الإعلان</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="اكتب وصفاً مفصلاً..."
              rows={4}
              className="w-full bg-gray-800 text-white rounded-xl py-3 px-4 border border-gray-700 focus:border-amber-400 resize-none"
            />
          </div>

          <div className="flex items-center gap-4">
            <input
              id="ad-images"
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={(e) => {
                const selected = e.target.files ? Array.from(e.target.files) : [];
                setFiles(selected);
                setPreviews(selected.map((f) => URL.createObjectURL(f)));
              }}
            />
            <label htmlFor="ad-images" className="flex-1 py-3 bg-gray-800 text-white rounded-xl flex items-center justify-center gap-2 cursor-pointer">
              <Camera className="w-5 h-5" />
              <span>إضافة صور</span>
            </label>
            <div className="flex gap-2">
              {previews.map((p, i) => (
                <img key={i} src={p} className="w-14 h-14 object-cover rounded-lg" />
              ))}
            </div>
          </div>

          {status && (
            <div className="mt-2 text-sm text-gray-300">
              <div className="flex items-center gap-2">
                <div className="text-xs text-amber-300 font-semibold">{status}</div>
                {progress > 0 && progress < 100 && <div className="text-xs text-gray-400">{progress}%</div>}
              </div>
            </div>
          )}

          <motion.button
            type="submit"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="w-full py-4 bg-gradient-to-r from-amber-500 to-yellow-500 text-black font-bold rounded-xl"
          >
            نشر الإعلان
          </motion.button>
        </form>
      </motion.div>
    </motion.div>
  );
}

// Ad Detail Modal
function AdDetailModal({ ad, onClose }: { ad: any; onClose: () => void }) {
  if (!ad) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
    >
      <div className="absolute inset-0 bg-black/70" onClick={onClose} />
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="relative bg-gray-900 rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-gray-700"
      >
        {/* Image */}
        <div className="relative aspect-video">
          <img src={ad.image} alt={ad.title} className="w-full h-full object-cover" />
          <button onClick={onClose} className="absolute top-4 right-4 p-2 bg-black/50 rounded-xl text-white">
            <X className="w-6 h-6" />
          </button>
          <div className="absolute top-4 left-4 px-3 py-1 bg-amber-500 rounded-full text-sm font-bold text-black">
            {ad.type === 'sell' ? 'للبيع' : 'للإيجار'}
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          <h2 className="text-2xl font-bold text-white mb-2">{ad.title}</h2>

          <div className="flex items-center gap-4 mb-4">
            <span className="text-3xl font-bold text-amber-400">{ad.price} د.ع</span>
            <div className="flex items-center gap-1 text-gray-400">
              <ViewIcon className="w-4 h-4" />
              <span>{ad.views}</span>
            </div>
          </div>

          <div className="flex items-center gap-2 text-gray-400 mb-6">
            <MapPin className="w-4 h-4" />
            <span>{ad.location}</span>
            <span className="mx-2">•</span>
            <Clock className="w-4 h-4" />
            <span>{ad.time}</span>
          </div>

          <div className="bg-gray-800 rounded-2xl p-4 mb-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 bg-amber-500/20 rounded-full flex items-center justify-center">
                <User className="w-6 h-6 text-amber-400" />
              </div>
              <div>
                <h3 className="text-white font-bold">{ad.seller}</h3>
                <p className="text-gray-400 text-sm">بائع</p>
              </div>
            </div>
          </div>

          {/* Contact Buttons */}
          <div className="grid grid-cols-2 gap-4">
            {(() => {
              const whatsappNumber = normalizeIraqiPhone(ad.phone || '');
              return (
            <motion.a
              href={whatsappNumber ? `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(buildAdWhatsAppMessage(ad))}` : '#'}
              target="_blank"
              rel="noopener noreferrer"
              whileHover={{ scale: 1.02 }}
              className="flex items-center justify-center gap-2 py-4 bg-green-500 text-white font-bold rounded-xl"
            >
              <MessageSquare className="w-5 h-5" />
              <span>واتساب</span>
            </motion.a>
              );
            })()}
            <motion.a
              href={`tel:${ad.phone}`}
              whileHover={{ scale: 1.02 }}
              className="flex items-center justify-center gap-2 py-4 bg-blue-500 text-white font-bold rounded-xl"
            >
              <PhoneIcon className="w-5 h-5" />
              <span>اتصال</span>
            </motion.a>
          </div>

          <button className="w-full mt-4 py-3 bg-gray-800 text-white rounded-xl flex items-center justify-center gap-2">
            <Heart className="w-5 h-5" />
            <span>إضافة للمفضلة</span>
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// Main App after Login
function MainApp({ user, onLogout }: { user: any; onLogout: () => void }) {
  const { isEnabled } = useFeatureFlags();
  const [darkMode, setDarkMode] = useState(true);
  const [currentView, setCurrentView] = useState('home');
  const [bottomNavActive, setBottomNavActive] = useState('home');
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showCreateAd, setShowCreateAd] = useState(false);
  const [showCreateProduct, setShowCreateProduct] = useState(false);
  const [selectedAd, setSelectedAd] = useState<any>(null);
  const [viewStartAt, setViewStartAt] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedType, setSelectedType] = useState('all');
  const [selectedRegion, setSelectedRegion] = useState('all');
  const [sortBy, setSortBy] = useState('recommended');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [isScrolled, setIsScrolled] = useState(false);
  const [ads, setAds] = useState(initialAds);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<Array<{ id: number; title: string; body: string; read: boolean; createdAt: string }>>([]);

  // listen for new ad event to insert into state
  useEffect(() => {
    const handler = (e: any) => {
      const newAd = e.detail;
      setAds((prev) => [newAd, ...prev]);
    };
    window.addEventListener('souq:new-ad', handler as EventListener);
    return () => window.removeEventListener('souq:new-ad', handler as EventListener);
  }, []);

  useEffect(() => {
    let active = true;
    void (async () => {
      try {
        const { data, error } = await supabase.from('ads').select('*').order('created_at', { ascending: false });
        if (!active || error || !data?.length) return;
        setAds(data.map(mapDbRowToAd));
      } catch {
        // keep local demo ads when remote loading is unavailable
      }
    })();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 24);
    handleScroll();
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (!isEnabled('ai_assist') && currentView === 'ai-center') {
      setCurrentView('home');
    }
    if (!isEnabled('games') && currentView === 'games') {
      setCurrentView('home');
    }
  }, [currentView, isEnabled]);

  const categories = [
    { id: 'all', name: 'الكل', emoji: '📦' },
    { id: 'cars', name: 'السيارات', emoji: '🚗' },
    { id: 'real-estate', name: 'العقارات', emoji: '🏠' },
    { id: 'phones', name: 'الهواتف', emoji: '📱' },
    { id: 'electronics', name: 'إلكترونيات', emoji: '💻' },
    { id: 'games', name: 'الألعاب', emoji: '🎮' },
  ];
  const visibleCategories = categories.filter((cat) => cat.id !== 'games' || isEnabled('games'));

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
    document.documentElement.classList.toggle('dark');
    localStorage.setItem('souqTheme', darkMode ? 'light' : 'dark');
  };

  const handleLogout = () => {
    localStorage.removeItem('souqUser');
    onLogout();
  };

  // ranking: combine views, recency, and interestedCount
  const scoreAd = (ad: any) => {
    const ageHours = (Date.now() - new Date(ad.publishedAt).getTime()) / (1000 * 60 * 60);
    const recencyScore = Math.max(0, 48 - ageHours) / 48; // favors ads within 48h
    const viewsScore = Math.log10((ad.views || 0) + 1);
    const interestedScore = Math.log10((ad.interestedCount || 0) + 1);
    return recencyScore * 0.5 + viewsScore * 0.3 + interestedScore * 0.2;
  };

  const filteredAds = ads
    .filter((ad) => {
      const matchesSearch = ad.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           ad.location.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === 'all' || ad.category === selectedCategory;
      const matchesType = selectedType === 'all' || ad.type === selectedType;
      const matchesRegion = selectedRegion === 'all' || ad.region === selectedRegion;
      return matchesSearch && matchesCategory && matchesType && matchesRegion && ad.status !== 'deleted';
    })
    .sort((a, b) => {
      if (sortBy === 'views') return (b.views || 0) - (a.views || 0);
      if (sortBy === 'recent') return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();
      if (sortBy === 'rating') return (b.sellerRating || 0) - (a.sellerRating || 0);
      return scoreAd(b) - scoreAd(a);
    });

  // track view duration when opening ad detail
  useEffect(() => {
    if (selectedAd) {
      setViewStartAt(Date.now());
    } else if (viewStartAt) {
      const duration = (Date.now() - viewStartAt) / 1000; // seconds
      // if long view (>10s) mark interested
      if (duration > 10 && selectedAd && (selectedAd.id)) {
        setAds((prev) => prev.map((a) => a.id === selectedAd.id ? { ...a, interestedCount: (a.interestedCount || 0) + 1 } : a));
      }
      setViewStartAt(null);
    }
  }, [selectedAd]);

  // Games View
  if (currentView === 'profile') {
    return <UserProfile onBack={() => setCurrentView('home')} />;
  }

  if (currentView === 'ai-center') {
    return <AICenter onBack={() => setCurrentView('home')} />;
  }

  if (currentView === 'games') {
    return (
      <div className="min-h-screen bg-gray-900">
        <div className="bg-gradient-to-r from-purple-900 via-blue-900 to-purple-900 pt-8 pb-16 relative overflow-hidden">
          <div className="container mx-auto px-4 relative z-10">
            <button
              onClick={() => setCurrentView('home')}
              className="flex items-center gap-2 text-white hover:text-amber-400 mb-4"
            >
              <ArrowLeft className="w-6 h-6" />
              <span>رجوع</span>
            </button>

            <div className="text-center">
              <motion.div
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="text-6xl mb-4"
              >
                🎮
              </motion.div>
              <h1 className="text-3xl font-bold text-white mb-2">منصة الألعاب</h1>
              <p className="text-gray-300">استمتع بأفضل الألعاب الترفيهية!</p>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {gamesData.map((game) => (
              <motion.div
                key={game.id}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="bg-gray-800 rounded-2xl p-6 text-center border border-gray-700 hover:border-amber-500/50 cursor-pointer"
              >
                <div className="text-5xl mb-3">{game.emoji}</div>
                <h3 className="text-white font-bold mb-2">{game.title}</h3>
                <p className="text-gray-400 text-sm mb-3">{game.description}</p>
                <div className="flex items-center justify-center gap-2 text-gray-400 text-sm mb-4">
                  <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                  <span>{game.rating}</span>
                  <span>•</span>
                  <span>{game.players} لاعبين</span>
                </div>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="w-full py-2 bg-amber-500 text-black font-semibold rounded-xl flex items-center justify-center gap-2"
                >
                  <Play className="w-4 h-4" />
                  <span>لعب الآن</span>
                </motion.button>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Navigation */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${isScrolled ? 'bg-slate-950/95 backdrop-blur-2xl shadow-2xl shadow-black/20 border-b border-gray-800/80' : 'bg-transparent border-b border-transparent'}`}>
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3 cursor-pointer" onClick={() => setCurrentView('home')}>
              <div className="w-10 h-10 bg-gradient-to-br from-blue-900 to-blue-950 rounded-xl flex items-center justify-center border border-amber-500/30">
                <span className="text-amber-400 text-xl">🇮🇶</span>
              </div>
              <div className="hidden sm:block">
                <h1 className="text-lg font-bold text-white">سوك بغداد</h1>
              </div>
            </div>

            {/* Search Bar */}
            <div className="hidden md:flex flex-1 max-w-xl mx-8">
              <div className="relative w-full">
                <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="ابحث عن سيارة، عقار، هاتف..."
                  className="w-full bg-gray-800 text-white placeholder-gray-400 rounded-xl py-2 pr-12 pl-4 border border-gray-700 focus:border-amber-400"
                />
              </div>
            </div>

            {/* Desktop Menu */}
            <div className="hidden lg:flex items-center gap-3">
              <button
                onClick={toggleDarkMode}
                className="p-2 rounded-xl bg-gray-800 text-amber-400 hover:bg-gray-700"
              >
                {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </button>
              <button className="p-2 rounded-xl bg-gray-800 text-white hover:bg-gray-700 relative" onClick={() => setCurrentView('profile')}>
                <UserCircle className="w-5 h-5" />
              </button>
              {isEnabled('ai_assist') && (
                <button className="p-2 rounded-xl bg-gray-800 text-white hover:bg-gray-700 relative" onClick={() => setCurrentView('ai-center')}>
                  <Cpu className="w-5 h-5" />
                </button>
              )}
              <button className="p-2 rounded-xl bg-gray-800 text-white hover:bg-gray-700 relative">
                <Heart className="w-5 h-5" />
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-xs text-white">3</span>
              </button>
              <button
                onClick={() => setShowNotifications((prev) => !prev)}
                className="p-2 rounded-xl bg-gray-800 text-white hover:bg-gray-700 relative"
              >
                <Bell className="w-5 h-5" />
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-amber-500 rounded-full text-xs text-black">{notifications.filter((n) => !n.read).length || 0}</span>
              </button>
              <button
                onClick={() => setShowCreateAd(true)}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-500 to-yellow-500 text-black font-bold rounded-xl"
              >
                <Plus className="w-5 h-5" />
                <span>رفع إعلان</span>
              </button>
              <button
                onClick={handleLogout}
                className="p-2 rounded-xl bg-red-500/20 text-red-400 hover:bg-red-500/30"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setShowMobileMenu(!showMobileMenu)}
              className="lg:hidden p-2 rounded-xl bg-gray-800 text-white"
            >
              <Menu className="w-6 h-6" />
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Menu */}
      {showMobileMenu && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/60" onClick={() => setShowMobileMenu(false)} />
          <div className="absolute right-0 top-0 bottom-0 w-80 bg-gray-900 p-6 overflow-y-auto">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-900 rounded-xl flex items-center justify-center">
                  <span className="text-amber-400">🇮🇶</span>
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white">سوك بغداد</h2>
                  <p className="text-xs text-amber-400">مرحباً {user.name}</p>
                </div>
              </div>
              <button onClick={() => setShowMobileMenu(false)} className="p-2 bg-gray-800 rounded-xl text-white">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="bg-gray-800 rounded-2xl p-4 mb-6">
              <div className="flex items-center gap-4 mb-4">
                <img src={user.avatar} alt={user.name} className="w-12 h-12 rounded-full" />
                <div>
                  <h3 className="text-white font-bold">{user.name}</h3>
                  <p className="text-gray-400 text-sm">{user.phone}</p>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-xl font-bold text-amber-400">0</p>
                  <p className="text-xs text-gray-400">إعلان</p>
                </div>
                <div>
                  <p className="text-xl font-bold text-amber-400">0</p>
                  <p className="text-xs text-gray-400">مفضلة</p>
                </div>
                <div>
                  <p className="text-xl font-bold text-amber-400">0</p>
                  <p className="text-xs text-gray-400">مشاهدة</p>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              {visibleCategories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => {
                    setSelectedCategory(cat.id);
                    if (cat.id === 'games' && isEnabled('games')) setCurrentView('games');
                    setShowMobileMenu(false);
                  }}
                  className="w-full flex items-center gap-4 p-3 rounded-xl hover:bg-gray-800 transition-colors"
                >
                  <span className="text-2xl">{cat.emoji}</span>
                  <span className="text-white font-medium">{cat.name}</span>
                </button>
              ))}
            </div>

            <div className="mt-6 pt-6 border-t border-gray-800 space-y-2">
              <button
                onClick={() => {
                  setCurrentView('profile');
                  setShowMobileMenu(false);
                }}
                className="w-full flex items-center gap-4 p-3 rounded-xl bg-gray-800 text-white hover:bg-gray-700"
              >
                <UserCircle className="w-5 h-5" />
                <span>صفحتي</span>
              </button>
              <button
                onClick={() => {
                  setCurrentView('ai-center');
                  setShowMobileMenu(false);
                }}
                className="w-full flex items-center gap-4 p-3 rounded-xl bg-gray-800 text-white hover:bg-gray-700"
              >
                <Cpu className="w-5 h-5" />
                <span>AI Center</span>
              </button>
              <button
                onClick={() => {
                  setShowCreateAd(true);
                  setShowMobileMenu(false);
                }}
                className="w-full flex items-center gap-4 p-3 rounded-xl bg-amber-500 text-black font-bold"
              >
                <Plus className="w-5 h-5" />
                <span>رفع إعلان</span>
              </button>
              <button onClick={toggleDarkMode} className="w-full flex items-center gap-4 p-3 rounded-xl hover:bg-gray-800">
                {darkMode ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5 text-blue-400" />}
                <span className="text-white">{darkMode ? 'الوضع الفاتح' : 'الوضع الداكن'}</span>
              </button>
              <button onClick={handleLogout} className="w-full flex items-center gap-4 p-3 rounded-xl hover:bg-gray-800 text-red-400">
                <LogOut className="w-5 h-5" />
                <span>تسجيل الخروج</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="pt-24 pb-12">
        {/* Hero Section */}
        <section className="relative overflow-hidden pt-24 pb-16">
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-6 left-[10%] h-72 w-72 rounded-full bg-amber-500/10 blur-3xl" />
            <div className="absolute top-24 right-[10%] h-96 w-96 rounded-full bg-sky-500/10 blur-3xl" />
            <div className="absolute bottom-0 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-cyan-500/10 blur-3xl" />
            <div className="absolute inset-x-0 top-16 h-1 bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-40" />
          </div>
          <div className="container mx-auto px-4 relative z-10">
            <div className="grid gap-12 lg:grid-cols-[1.1fr_0.9fr] items-center">
              <div className="space-y-8">
                <div className="inline-flex items-center gap-2 rounded-full border border-amber-400/20 bg-amber-400/10 px-4 py-2 text-sm font-semibold text-amber-300 backdrop-blur-xl">
                  منصة عراقية ذكية بتصميم عالمي
                </div>
                <motion.h1
                  initial={{ opacity: 0, y: 24 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6 }}
                  className="text-5xl md:text-6xl font-bold tracking-tight text-white leading-tight"
                >
                  تجربة سوق رقمية
                  <span className="block text-amber-400">فاخرة ومستقبلية</span>
                </motion.h1>
                <motion.p
                  initial={{ opacity: 0, y: 24 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.7, delay: 0.1 }}
                  className="max-w-2xl text-lg text-slate-200/90 leading-relaxed"
                >
                  تصميم مستوحى من HONOR AI مع واجهة زجاجية، هياكل ناعمة، وحركة سلسة تناسب تجربة مستخدم عالمية.
                </motion.p>
                <motion.div
                  initial={{ opacity: 0, y: 24 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.7, delay: 0.2 }}
                  className="flex flex-wrap gap-4"
                >
                  <button onClick={() => setCurrentView('profile')} className="rounded-3xl bg-amber-400 px-8 py-4 text-black font-semibold shadow-xl shadow-amber-500/20 transition hover:-translate-y-0.5">
                    صفحتي
                  </button>
                  {isEnabled('ai_assist') && (
                    <button onClick={() => setCurrentView('ai-center')} className="rounded-3xl border border-white/20 bg-white/5 px-8 py-4 text-white transition hover:bg-white/10">
                      AI Center
                    </button>
                  )}
                </motion.div>
                <div className="grid gap-4 sm:grid-cols-3">
                  <motion.div whileHover={{ y: -6 }} className="glass rounded-3xl border border-white/10 p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="inline-flex items-center justify-center h-12 w-12 rounded-2xl bg-amber-500/15 text-amber-300">
                        <Sparkles className="w-6 h-6" />
                      </div>
                      <span className="text-xs uppercase tracking-[0.2em] text-gray-300">Premium</span>
                    </div>
                    <h3 className="text-lg font-semibold text-white">تصميم فاخر</h3>
                    <p className="mt-3 text-sm text-gray-300">واجهة واضحة وسلسة مع تأثير زجاجي ودرجات ألوان متطورة.</p>
                  </motion.div>
                  <motion.div whileHover={{ y: -6 }} className="glass rounded-3xl border border-white/10 p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="inline-flex items-center justify-center h-12 w-12 rounded-2xl bg-cyan-500/15 text-cyan-300">
                        <Search className="w-6 h-6" />
                      </div>
                      <span className="text-xs uppercase tracking-[0.2em] text-gray-300">Smooth</span>
                    </div>
                    <h3 className="text-lg font-semibold text-white">تفاعل ذكي</h3>
                    <p className="mt-3 text-sm text-gray-300">حركة دقيقة وانتقالات ناعمة تجعل كل قسم تجربة مصقولة.</p>
                  </motion.div>
                  <motion.div whileHover={{ y: -6 }} className="glass rounded-3xl border border-white/10 p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="inline-flex items-center justify-center h-12 w-12 rounded-2xl bg-blue-500/15 text-blue-300">
                        <Shield className="w-6 h-6" />
                      </div>
                      <span className="text-xs uppercase tracking-[0.2em] text-gray-300">Modern</span>
                    </div>
                    <h3 className="text-lg font-semibold text-white">أمان ومصداقية</h3>
                    <p className="mt-3 text-sm text-gray-300">تصميم يحافظ على هدوء واجهة المستخدم ويعزز الثقة في المنصة.</p>
                  </motion.div>
                </div>
              </div>

              <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.25 }} className="relative">
                <div className="glass-panel absolute inset-0 -z-10 rounded-[40px]" />
                <div className="glass-panel relative overflow-hidden rounded-[40px] border border-white/10 p-6 shadow-2xl shadow-slate-950/40">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-sm uppercase tracking-[0.25em] text-amber-300">مرحباً بك</p>
                      <h2 className="text-3xl font-bold text-white">سوق مُصمم لوظائف المستقبل</h2>
                    </div>
                    <div className="rounded-3xl bg-amber-500/15 px-3 py-2 text-amber-200 text-sm">AI Ready</div>
                  </div>
                  <div className="mt-6 space-y-4">
                    <div className="rounded-3xl bg-white/5 p-5 border border-white/10">
                      <p className="text-sm text-gray-300">واجهة مستخدم متجانسة، سريع التحميل، وتشغيل سلس لكل الأجهزة.</p>
                    </div>
                    <div className="rounded-3xl bg-white/5 p-5 border border-white/10">
                      <p className="text-sm text-gray-300">أزرار واضحة، نصوص مختارة، وتدرجات تليق بالهوية العراقية المتطورة.</p>
                    </div>
                    <div className="rounded-3xl bg-white/5 p-5 border border-white/10">
                      <p className="text-sm text-gray-300">تجربة متكاملة بين السوق والخدمات مع انسيابية مستوحاة من صفحات التقنية العالمية.</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        <section className="py-12">
          <div className="container mx-auto px-4">
            <div className="grid gap-8 xl:grid-cols-[1.15fr_0.85fr] items-center">
              <div className="glass-panel rounded-[40px] border border-white/10 p-8 shadow-[0_30px_80px_rgba(15,23,41,0.35)]">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm uppercase tracking-[0.25em] text-amber-300">هندسة تجربة</p>
                    <h2 className="text-4xl font-bold text-white">واجهة سوق فاخر مع أصالة عراقية</h2>
                  </div>
                  <div className="rounded-full bg-white/10 px-4 py-2 text-sm text-gray-300">Premium Design</div>
                </div>

                <div className="mt-8 grid gap-4 md:grid-cols-3">
                  <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
                    <div className="inline-flex items-center justify-center h-14 w-14 rounded-3xl bg-amber-500/15 text-amber-300 mb-4">
                      <Shield className="w-6 h-6" />
                    </div>
                    <h3 className="text-lg font-semibold text-white">تصميم راقٍ</h3>
                    <p className="mt-3 text-sm text-gray-300">لوحات زجاجية متداخلة، تدرجات ذهبية، وانسيابية مرئية في كل واجهة.</p>
                  </div>
                  <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
                    <div className="inline-flex items-center justify-center h-14 w-14 rounded-3xl bg-cyan-500/15 text-cyan-300 mb-4">
                      <Cpu className="w-6 h-6" />
                    </div>
                    <h3 className="text-lg font-semibold text-white">مركز AI متكامل</h3>
                    <p className="mt-3 text-sm text-gray-300">واجهة تجمع تجربة الذكاء الاصطناعي والتجارة الرقمية بدون تعقيد تقني.</p>
                  </div>
                  <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
                    <div className="inline-flex items-center justify-center h-14 w-14 rounded-3xl bg-blue-500/15 text-blue-300 mb-4">
                      <Star className="w-6 h-6" />
                    </div>
                    <h3 className="text-lg font-semibold text-white">سرعة ووضوح</h3>
                    <p className="mt-3 text-sm text-gray-300">تحكم مرئي سريع، فلاتر دقيقة، وتقديم بيانات سلس لكل مستخدم.</p>
                  </div>
                </div>
              </div>

              <div className="relative rounded-[40px] overflow-hidden border border-white/10 bg-gradient-to-br from-slate-950/80 via-slate-900/80 to-slate-950/90 p-6 shadow-2xl shadow-slate-950/40">
                <div className="absolute inset-0 bg-gradient-to-br from-amber-500/10 via-transparent to-cyan-500/10 pointer-events-none" />
                <div className="relative z-10">
                  <p className="text-sm uppercase tracking-[0.25em] text-amber-300 mb-4">ترند السوق</p>
                  <h3 className="text-3xl font-bold text-white mb-4">لوحة تحكم السوق الذكي</h3>
                  <p className="text-gray-300 leading-relaxed mb-8">لوحة عرض مصممة لتبرز مزايا المشروع وتمنح المستخدمين شعوراً بالقوة والرقي في كل خطوة.</p>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="rounded-3xl bg-gray-900/80 p-5 border border-white/10">
                      <p className="text-sm text-gray-400">الشعبية اليوم</p>
                      <p className="mt-2 text-white font-semibold">السيارات الفاخرة في المقدمة</p>
                    </div>
                    <div className="rounded-3xl bg-gray-900/80 p-5 border border-white/10">
                      <p className="text-sm text-gray-400">أقوى العروض</p>
                      <p className="mt-2 text-white font-semibold">هواتف الألعاب الأعلى بحثاً</p>
                    </div>
                  </div>

                  <div className="mt-8 rounded-[32px] border border-white/10 bg-white/5 p-6 shadow-xl shadow-slate-950/20">
                    <div className="flex items-center justify-between gap-4 mb-4">
                      <div>
                        <p className="text-sm text-amber-300">نظرة سريعة</p>
                        <h4 className="text-xl text-white font-semibold">تجربة فاخرة للمستخدم</h4>
                      </div>
                      <div className="rounded-3xl bg-amber-500/15 px-4 py-2 text-sm text-amber-200">AI Ready</div>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="rounded-3xl bg-gray-900/90 p-4">
                        <p className="text-sm text-gray-400">بحث أسرع</p>
                        <p className="mt-2 text-white font-semibold">دقيقة وسلسة</p>
                      </div>
                      <div className="rounded-3xl bg-gray-900/90 p-4">
                        <p className="text-sm text-gray-400">إشعارات ذكية</p>
                        <p className="mt-2 text-white font-semibold">تصميم مدمج مع نشاط المستخدم</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Ads Section */}
        <section className="py-12">
          <div className="container mx-auto px-4">
            {/* Filter Bar */}
            <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
              <h2 className="text-2xl font-bold text-white">
                {selectedCategory === 'all' ? 'جميع الإعلانات' : categories.find(c => c.id === selectedCategory)?.name}
                <span className="text-gray-400 text-lg mr-2">({filteredAds.length})</span>
              </h2>

              <div className="flex items-center gap-3">
                {/* Category Filter */}
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="bg-gray-800 text-white rounded-xl px-4 py-2 border border-gray-700"
                >
                  {visibleCategories.map((cat) => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>

                {/* View Mode Toggle */}
                <div className="flex bg-gray-800 rounded-xl p-1">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`p-2 rounded-lg ${viewMode === 'grid' ? 'bg-amber-500 text-black' : 'text-gray-400'}`}
                  >
                    <Grid className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`p-2 rounded-lg ${viewMode === 'list' ? 'bg-amber-500 text-black' : 'text-gray-400'}`}
                  >
                    <List className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Ads Grid/List */}
            <div className={viewMode === 'grid' ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6' : 'space-y-4'}>
              {filteredAds.map((ad) => (
                <motion.div
                  key={ad.id}
                  whileHover={{ y: -5 }}
                  onClick={() => setSelectedAd(ad)}
                  className={`premium-card bg-gray-900/90 rounded-[32px] overflow-hidden border border-white/10 hover:border-amber-500/50 cursor-pointer transition-all ${viewMode === 'list' ? 'flex' : ''}`}
                >
                  <div className={`relative ${viewMode === 'list' ? 'w-48' : 'aspect-[4/3]'} ${viewMode === 'list' ? 'h-48' : ''}`}>
                    <img src={ad.image} alt={ad.title} className="w-full h-full object-cover" />
                    {ad.type === 'rent' && (
                      <div className="absolute top-3 left-3 px-2 py-1 bg-blue-500 rounded-full text-xs font-bold text-white">
                        للإيجار
                      </div>
                    )}
                  </div>
                  <div className={`p-4 ${viewMode === 'list' ? 'flex-1' : ''}`}>
                    <h3 className="text-white font-bold mb-2 line-clamp-1">{ad.title}</h3>
                    <p className="text-xl font-bold text-amber-400 mb-2">{ad.price} د.ع</p>
                    <div className="flex items-center gap-2 text-gray-400 text-sm mb-3">
                      <MapPin className="w-4 h-4" />
                      <span className="line-clamp-1">{ad.location}</span>
                    </div>
                    <div className="flex items-center justify-between text-gray-500 text-xs">
                      <span>{ad.time}</span>
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1">
                          <ViewIcon className="w-3 h-3" />
                          <span>{ad.views}</span>
                        </div>
                        <span className="px-2 py-1 rounded-full bg-gray-800 text-gray-300 text-[11px]">{ad.status}</span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Entertainment Section */}
        <section className="hidden py-12 bg-gradient-to-br from-purple-900 via-blue-900 to-purple-900">
          <div className="container mx-auto px-4">
            <div className="text-center mb-8">
              <span className="inline-flex items-center gap-2 bg-amber-500/20 px-4 py-2 rounded-full mb-4">
                <Gamepad2 className="w-5 h-5 text-amber-400" />
                <span className="text-amber-400 font-semibold">قسم الترفيه</span>
              </span>
              <h2 className="text-3xl font-bold text-white mb-2">🎮 الألعاب الترفيهية</h2>
              <p className="text-gray-300">اضغط وابدأ اللعب مباشرة!</p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {gamesData.map((game) => (
                <motion.div
                  key={game.id}
                  whileHover={{ scale: 1.05, y: -5 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setCurrentView('games')}
                  className="bg-white/10 backdrop-blur rounded-2xl p-4 text-center border border-white/20 cursor-pointer hover:bg-white/20"
                >
                  <div className="text-4xl mb-2">{game.emoji}</div>
                  <h3 className="text-white font-bold text-sm mb-1">{game.title}</h3>
                  <div className="flex items-center justify-center gap-1 text-gray-300 text-xs">
                    <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                    <span>{game.rating}</span>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 border-t border-gray-800 py-8">
        <div className="container mx-auto px-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <span className="text-2xl">🇮🇶</span>
            <span className="text-xl font-bold text-white">سوك بغداد</span>
          </div>
          <p className="text-gray-400 text-sm">© 2024 سوك بغداد - السوق الرقمي العراقي</p>
          <div className="flex items-center justify-center gap-4 mt-4">
            <div className="w-4 h-4 bg-white rounded-full" />
            <div className="w-4 h-4 bg-black rounded-full" />
            <div className="w-4 h-4 bg-red-600 rounded-full" />
          </div>
          <p className="text-gray-500 text-xs mt-2">🇮🇶 العراق</p>
        </div>
      </footer>

      {/* Modals */}
      <CreateAdModal
        isOpen={showCreateAd}
        onClose={() => setShowCreateAd(false)}
        onSubmit={(data) => {
          setAds((prev) => [data, ...prev]);
          setNotifications((prev) => [
            { id: Date.now(), title: 'نشر إعلان جديد', body: 'تم نشر إعلانك بنجاح.', read: false, createdAt: 'الآن' },
            ...prev,
          ]);
          void (async () => {
            try {
              const { error } = await supabase.from('ads').insert(mapAdToDbRow(data, user));
              if (error) {
                console.error('Failed to sync new ad to Supabase', error);
              }
            } catch (syncError) {
              console.error('Unexpected ad sync error', syncError);
            }
          })();
        }}
      />
      {showNotifications && (
        <div className="fixed right-4 top-20 z-50 w-96 bg-gray-900/95 border border-gray-700 rounded-3xl p-4 shadow-2xl">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-white font-bold">الإشعارات</h3>
            <button onClick={() => setShowNotifications(false)} className="text-gray-400 hover:text-white">إغلاق</button>
          </div>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {notifications.map((note) => (
              <div key={note.id} className={`rounded-3xl p-4 border ${note.read ? 'border-gray-700 bg-gray-900' : 'border-amber-500 bg-amber-500/10'}`}>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <h4 className="text-white font-semibold">{note.title}</h4>
                  <span className="text-xs text-gray-400">{note.createdAt}</span>
                </div>
                <p className="text-gray-300 text-sm">{note.body}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      <AdDetailModal
        ad={selectedAd}
        onClose={() => setSelectedAd(null)}
      />

      {/* Bottom Navigation Bar - Fixed Mobile First */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-gray-900/95 backdrop-blur-xl border-t border-gray-800 lg:hidden safe-area-bottom">
        <div className="flex items-center justify-around h-16 px-2">
          {/* الرئيسية */}
          <button
            onClick={() => { setBottomNavActive('home'); setCurrentView('home'); }}
            className={`flex flex-col items-center justify-center flex-1 py-2 transition-all ${bottomNavActive === 'home' ? 'text-amber-400' : 'text-gray-400'}`}
          >
            <div className={`p-2 rounded-xl ${bottomNavActive === 'home' ? 'bg-amber-500/20' : ''}`}>
              <Home className="w-6 h-6" />
            </div>
            <span className="text-[10px] mt-1 font-medium">الرئيسية</span>
          </button>

          {/* الخطوط */}
          <button
            onClick={() => { setBottomNavActive('transport'); setCurrentView('transport'); }}
            className={`flex flex-col items-center justify-center flex-1 py-2 transition-all ${bottomNavActive === 'transport' ? 'text-emerald-400' : 'text-gray-400'}`}
          >
            <div className={`p-2 rounded-xl ${bottomNavActive === 'transport' ? 'bg-emerald-500/20' : ''}`}>
              <Car className="w-6 h-6" />
            </div>
            <span className="text-[10px] mt-1 font-medium">الخطوط</span>
          </button>

          {/* إضافة إعلان */}
          <button
            onClick={() => { setBottomNavActive('create-ad'); setShowCreateAd(true); }}
            className="flex flex-col items-center justify-center flex-1 py-2"
          >
            <div className="p-3 bg-gradient-to-r from-amber-500 to-yellow-500 rounded-full -mt-6 shadow-lg shadow-amber-500/30">
              <Plus className="w-6 h-6 text-black" />
            </div>
            <span className="text-[10px] mt-1 font-medium text-amber-400">إعلان</span>
          </button>

          {/* إضافة منتج */}
          <button
            onClick={() => { setBottomNavActive('create-product'); setShowCreateProduct(true); }}
            className={`flex flex-col items-center justify-center flex-1 py-2 transition-all ${bottomNavActive === 'create-product' ? 'text-blue-400' : 'text-gray-400'}`}
          >
            <div className={`p-2 rounded-xl ${bottomNavActive === 'create-product' ? 'bg-blue-500/20' : ''}`}>
              <ShoppingBag className="w-6 h-6" />
            </div>
            <span className="text-[10px] mt-1 font-medium">منتج</span>
          </button>

          {/* الملف الشخصي */}
          <button
            onClick={() => { setBottomNavActive('profile'); }}
            className={`flex flex-col items-center justify-center flex-1 py-2 transition-all ${bottomNavActive === 'profile' ? 'text-purple-400' : 'text-gray-400'}`}
          >
            <div className={`p-2 rounded-xl ${bottomNavActive === 'profile' ? 'bg-purple-500/20' : ''}`}>
              <UserCircle className="w-6 h-6" />
            </div>
            <span className="text-[10px] mt-1 font-medium">حسابي</span>
          </button>
        </div>
      </nav>
    </div>
  );
}

// Main App Component
export default function App() {
  const { user, isAuthenticated, isLoading, logout } = useAuth();

  useEffect(() => {
    const savedTheme = localStorage.getItem('souqTheme');
    if (savedTheme === 'light') {
      document.documentElement.classList.remove('dark');
    }
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-white">
        <p>جارٍ التحقق من حالة تسجيل الدخول...</p>
      </div>
    );
  }

  return (
    <div className="dark">
      <AnimatePresence mode="wait">
        {isAuthenticated && user ? (
          <motion.div
            key="main"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <MainApp user={user} onLogout={logout} />
          </motion.div>
        ) : (
          <motion.div
            key="auth"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <AuthPage />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
