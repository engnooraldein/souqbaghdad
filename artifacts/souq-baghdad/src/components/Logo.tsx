// ===========================================
// مسؤولية هذا الملف:
// يعرض شعار التطبيق (Logo).
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

export function Logo({ small }:{small?:boolean}) {
  return (
    <div className="flex items-center gap-2">
      <div className={`${small?'w-10 h-10':'w-14 h-14'} shrink-0 bg-blue-900 rounded-xl flex items-center justify-center border-2 border-amber-500/40 shadow-lg overflow-hidden`}>
        <img src="/logo.jpg" alt="سوق بغداد" className="w-full h-full object-cover" />
      </div>
      {!small && <div className="shrink-0"><h1 className="text-xl font-bold text-white leading-tight">سوك بغداد</h1><p className="text-amber-400 text-xs">السوق الرقمي العراقي</p></div>}
    </div>
  );
}
