// ===========================================
// AuthModal v2 — نافذة تسجيل الدخول المحسّنة
//
// تحتوي على خيار استعادة كلمة المرور عبر تيليكرام وواتساب المباشر
// ===========================================

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, Mail, Phone, Lock, Eye, EyeOff, CheckCircle, Fingerprint, Key, ChevronRight, ChevronLeft, User as UserIcon } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useSound } from '../hooks/useSound';

interface AuthModalProps {
  onClose: () => void;
}

export function AuthModal({ onClose }: AuthModalProps) {
  const [isRecovery, setIsRecovery] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [step, setStep] = useState<'choose' | 'phone_enter' | 'email_enter' | 'password'>('choose');
  const [phoneLocal, setPhoneLocal] = useState('');
  const [emailInput, setEmailInput] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const whatsappLink = "https://wa.me/15551975975?text=" + encodeURIComponent("نسيت كلمة السر وأريد استعادة حسابي من فضلكم");
  const telegramLink = "https://t.me/SOUQBAGHDA";

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
    >
      <div className="fixed inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        className="relative bg-gray-900 rounded-3xl p-6 w-full max-w-md border border-gray-700 shadow-2xl z-10 my-auto"
      >
        <button onClick={onClose} className="absolute top-4 left-4 p-2 bg-gray-800 rounded-xl text-gray-400 hover:text-white transition-colors">
          <X className="w-5 h-5" />
        </button>

        <div className="text-center mb-5">
          <div className="text-5xl mb-3">{isRecovery ? '🔑' : '📱'}</div>
          <h2 className="text-2xl font-bold text-white">
            {isRecovery ? 'استعادة كلمة المرور' : 'سوق بغداد الرقمي'}
          </h2>
        </div>

        {/* ══ شاشة استعادة الحساب المحدثة مع خيار واتساب وتيليكرام ══ */}
        {isRecovery ? (
          <div className="text-center py-2 space-y-4">
            <p className="text-gray-300 text-sm leading-relaxed px-2">
              اختر الوسيلة المفضلة لاستعادة حسابك وتلقي رمز التحقق السري (OTP) فوراً:
            </p>

            <div className="space-y-3 pt-2">
              {/* خيار الواتساب المباشر */}
              <a
                href={whatsappLink}
                target="_blank" rel="noopener noreferrer"
                className="flex w-full items-center justify-center gap-3 py-4 bg-emerald-600 text-white font-bold rounded-2xl hover:bg-emerald-500 transition-all shadow-lg shadow-emerald-600/20 active:scale-[0.98]"
              >
                <span className="text-xl">💬</span>
                <span>الذهاب إلى البوت على واتساب (OTP)</span>
              </a>

              {/* خيار تيليكرام */}
              <a
                href={telegramLink}
                target="_blank" rel="noopener noreferrer"
                className="flex w-full items-center justify-center gap-3 py-3.5 bg-[#2AABEE] text-white font-bold rounded-2xl hover:bg-[#229ED9] transition-all shadow-lg shadow-blue-500/20 active:scale-[0.98]"
              >
                <span className="text-xl">✈️</span>
                <span>الذهاب إلى البوت على تيليغرام</span>
              </a>
            </div>

            <button type="button" onClick={() => setIsRecovery(false)} className="w-full text-center text-gray-400 hover:text-white text-sm pt-3">
              ← العودة لتسجيل الدخول
            </button>
          </div>
        ) : (
          <div className="space-y-4 text-center">
            <p className="text-gray-400 text-sm">مرحباً بك في المنصة الرقمية الأولى بالإعلانات المبوبة</p>
            <button
              onClick={() => setIsRecovery(true)}
              className="w-full py-3 bg-amber-500/10 text-amber-400 font-bold rounded-xl hover:bg-amber-500/20 transition-all border border-amber-500/30"
            >
              🔑 نسيت كلمة المرور؟ استعادة عبر الواتساب وتيليكرام
            </button>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}
