// ===========================================
// مسؤولية هذا الملف:
// يعرض بطاقة وهمية (Skeleton Loader) أثناء تحميل البيانات.
//
// لا يتصل بـ Supabase. مكوّن UI بحت.
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

export function SkeletonCard() {
  return (
    <div className="bg-gray-800 rounded-2xl overflow-hidden border border-gray-700/80 flex flex-col h-full animate-pulse select-none">
      {/* Thumbnail shimmer */}
      <div className="relative w-full aspect-[4/3] bg-gray-700/40 flex-shrink-0">
        <div className="absolute top-2 left-2 w-12 h-5 bg-gray-700/60 rounded-full" />
        <div className="absolute top-2 right-2 w-8 h-8 bg-gray-700/60 rounded-full" />
        <div className="absolute bottom-2 left-2 w-16 h-5 bg-gray-700/60 rounded-full" />
      </div>
      
      {/* Content wrapper */}
      <div className="p-3 flex-1 flex flex-col justify-between">
        <div>
          {/* Title bar */}
          <div className="h-4 bg-gray-700/60 rounded-md w-11/12 mb-2" />
          
          {/* Price bar */}
          <div className="h-5 bg-gray-700/60 rounded-md w-1/2 mb-3" />
          
          {/* Location line */}
          <div className="flex items-center gap-1.5 mb-2">
            <div className="w-3 h-3 bg-gray-700/60 rounded-full flex-shrink-0" />
            <div className="h-3 bg-gray-700/60 rounded-md w-2/3" />
          </div>
        </div>
        
        {/* Footer line */}
        <div className="flex items-center justify-between mt-auto pt-2 border-t border-gray-700/40">
          <div className="flex items-center gap-1.5">
            <div className="w-5 h-5 bg-gray-700/60 rounded-full" />
            <div className="h-3 bg-gray-700/60 rounded-md w-14" />
          </div>
          <div className="flex items-center gap-2">
            <div className="h-3 bg-gray-700/60 rounded-md w-10" />
            <div className="h-3 bg-gray-700/60 rounded-md w-8" />
          </div>
        </div>
      </div>
    </div>
  );
}
