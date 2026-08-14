export interface SellerInfo {
  id?: string;
  name: string;
  avatar: string;
  isVerified: boolean;
  rating: number;
  ratingCount?: number;
  joinedDate: string;
  location: string;
}

export interface Ad {
  id: number;
  title: string;
  price: string;
  governorate: string;
  location: string;
  phone: string;
  category: string;
  images: string[];
  seller: SellerInfo;
  time: string;
  createdAtISO: string;
  views: number;
  status: string;
  type: string;
  condition?: 'new' | 'used';
  description: string;
  adCount: number;
  soldCount: number;
  responseRate?: number;
  avgResponseTime?: string;
  postedBy?: string;
  short_id?: string;
  favorites?: number;
  likes?: number;
  is_vip?: boolean;
  vip_days?: number;
  sync_status?: { facebook?: 'pending'|'success'|'failed', instagram?: 'pending'|'success'|'failed', telegram?: 'pending'|'success'|'failed' };
}

export interface Product {
  id: number;
  title: string;
  price: string;
  description: string;
  category: string;
  images: string[];
  governorate: string;
  phone: string;
  condition: 'new' | 'used';
  seller: SellerInfo;
  createdAtISO: string;
  views: number;
  postedBy: string;
  stock: number;
  status: string;
  short_id?: string;
  is_vip?: boolean;
  vip_days?: number;
  sync_status?: { facebook?: 'pending'|'success'|'failed', instagram?: 'pending'|'success'|'failed', telegram?: 'pending'|'success'|'failed' };
}

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  avatar: string;
  cover: string;
  bio: string;
  location: string;
  rating: number;
  isVerified: boolean;
  joinedDate: string;
  stats: { ads: number; favorites: number; views: number };
  sellerStats: { totalAds: number; sold: number; responseRate: number; avgResponseTime: string };
  badges?: { isStudent?: boolean; hasVehicle?: boolean; hasID?: boolean; isPhoneVerified?: boolean };
  points?: number;
  // Professional Store Fields
  username?: string;          // رابط مخصص: souqbaghdad.store/seller/[username]
  store_name?: string;        // اسم المتجر التجاري
  specialty?: string;         // التخصص المهني (طبيب، مهندس، متجر أحذية...)
  specialty_detail?: string;  // تفاصيل التخصص
  store_type?: string;        // نوع المتجر: 'personal' | 'business' | 'professional'
  store_template?: string;    // القالب: 'default'|'beauty'|'tech'|'medical'|'auto'
  whatsapp_business?: string; // واتساب تجاري منفصل
  store_language?: 'ar' | 'en' | 'auto'; // لغة عرض المتجر
  store_metadata?: any;       // الخصائص الديناميكية المخصصة للمهنة
}

export interface StoredUser {
  id: string;
  name: string;
  email: string;
  phone: string;
  location: string;
  role: string;
  avatar: string;
  registeredAt: string;
  lastSeen: string;
  adCount: number;
  isBanned: boolean;
  cover?: string;
  bio?: string;
  rating?: number;
  ratingCount?: number;
  points?: number;
}

export interface Visit {
  id: string;
  timestamp: string;
  device: 'mobile' | 'desktop' | 'tablet';
  location: string;
  userId?: string;
  userName?: string;
  page: string;
}

export interface SystemLog {
  id: string;
  timestamp: string;
  action: string;
  admin: string;
  details: string;
  target?: string;
}

export interface TransportAd {
  id: number;
  type: 'offer' | 'request'; // متوفر خط أو أبحث عن خط
  categoryType?: 'student' | 'employee' | 'emergency'; // طلاب أم موظفين أم طوارئ
  university: string;
  regions: string;
  price: string;
  seats: number;
  shift: string;
  vehicleType: string;
  targetAudience: string;
  phone: string;
  note: string;
  postedBy: string;
  sellerName: string;
  sellerAvatar: string;
  createdAt: string;
  status: 'pending' | 'published' | 'matched' | 'archived' | 'deleted_soft';
  completion_reason?: 'found_line' | 'line_full' | 'closed_by_owner' | null;
  completedAt?: string;
  views: number;
  interest?: number;
  whatsappClicks?: number;
  short_id?: string;
  sync_status?: { facebook?: 'pending'|'success'|'failed', instagram?: 'pending'|'success'|'failed', telegram?: 'pending'|'success'|'failed' };
}
