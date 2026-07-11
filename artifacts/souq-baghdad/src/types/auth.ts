// Authentication Types
export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: 'user' | 'vendor' | 'admin';
  avatar: string;
  isVerified: boolean;
  storeName?: string;
  createdAt: string;
  cover?: string;
  points?: number;
  rating?: number;
  badges?: {
    isStudent?: boolean;
    hasID?: boolean;
    hasVehicle?: boolean;
    isPhoneVerified?: boolean;
  };
  stats: {
    ads: number;
    favorites: number;
    views: number;
  };
  bio?: string;
  location?: string;
  socialLinks?: {
    facebook?: string;
    twitter?: string;
    instagram?: string;
  };
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

// Ad Types
export interface Ad {
  id: string;
  title: string;
  description: string;
  price: string;
  category: string;
  images: string[];
  video?: string;
  location: string;
  city: string;
  sellerId: string;
  sellerName: string;
  sellerAvatar: string;
  createdAt: string;
  views: number;
  likes: number;
  isFeatured: boolean;
  isDemo: boolean; // Mark demo content
  status: 'active' | 'pending' | 'sold' | 'deleted';
}

// Game Types
export interface Game {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  category: 'card' | 'board' | 'puzzle' | 'arcade';
  players: '1' | '2' | 'multi';
  isDemo: boolean;
  popularity: number;
}

// Music Types
export interface Track {
  id: string;
  title: string;
  artist: string;
  duration: string;
  cover: string;
  audioUrl: string;
  category: string;
  plays: number;
  isDemo: boolean;
}

// Notification Types
export interface Notification {
  id: string;
  type: 'message' | 'ad' | 'system' | 'game';
  title: string;
  body: string;
  read: boolean;
  createdAt: string;
}

// Admin Stats
export interface AdminStats {
  totalUsers: number;
  totalAds: number;
  totalGames: number;
  totalRevenue: number;
  activeUsers: number;
  pendingAds: number;
  reportedContent: number;
  newUsersThisWeek: number;
}

// Report Types
export interface Report {
  id: string;
  type: 'ad' | 'user' | 'comment';
  reporterId: string;
  reportedId: string;
  reason: string;
  status: 'pending' | 'reviewed' | 'resolved';
  createdAt: string;
}