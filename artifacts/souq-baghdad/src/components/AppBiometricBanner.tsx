import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Fingerprint, CheckCircle } from 'lucide-react';
import { Capacitor } from '@capacitor/core';
import { supabase } from '../lib/supabase';

interface AppBiometricBannerProps {
  showBiometricBanner: boolean;
  setShowBiometricBanner: (show: boolean) => void;
  playNotificationSound: (type: string) => void;
}

export const AppBiometricBanner: React.FC<AppBiometricBannerProps> = ({
  showBiometricBanner,
  setShowBiometricBanner,
  playNotificationSound,
}) => {
  return (
    <AnimatePresence>
      {showBiometricBanner && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          className="fixed bottom-[80px] left-4 right-4 z-[90] bg-[#0052ff] text-white p-4 rounded-2xl shadow-2xl flex flex-col gap-3 border border-blue-400/30"
          dir="rtl"
        >
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center shrink-0">
                <Fingerprint className="w-6 h-6 text-white" />
              </div>
              <div>
                <h4 className="font-bold">أمان وسرعة 🔒</h4>
                <p className="text-xs text-blue-100 mt-0.5">فعّل تسجيل الدخول بالبصمة للوصول السريع بدون كتابة الرمز كل مرة.</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 mt-2">
            <button
              onClick={async () => {
                playNotificationSound('click');
                if (!Capacitor.isNativePlatform()) {
                  try { await supabase.auth.registerPasskey(); } catch (err) {}
                }
                localStorage.setItem('biometricEnabled', 'true');
                localStorage.setItem('biometricPromptShown', 'true');
                setShowBiometricBanner(false);
              }}
              className="flex-1 py-2.5 bg-white text-[#0052ff] font-bold rounded-xl text-sm flex items-center justify-center gap-2 hover:bg-gray-100 transition-colors"
            >
              <CheckCircle className="w-4 h-4" /> تفعيل الآن
            </button>
            <button
              onClick={() => {
                playNotificationSound('click');
                setShowBiometricBanner(false);
                localStorage.setItem('biometricPromptShown', 'true');
              }}
              className="flex-1 py-2.5 bg-blue-600 text-white font-bold rounded-xl text-sm hover:bg-blue-700 transition-colors"
            >
              لاحقاً
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
