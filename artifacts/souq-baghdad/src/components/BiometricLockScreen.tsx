import React from 'react';
import { Helmet } from 'react-helmet-async';
import { Lock } from 'lucide-react';
import { Capacitor } from '@capacitor/core';
import { BiometricAuth } from '@aparajita/capacitor-biometric-auth';
import { supabase } from '../lib/supabase';

interface BiometricLockScreenProps {
  isDarkMode: boolean;
  setIsBiometricLocked: (s: boolean) => void;
}

export const BiometricLockScreen: React.FC<BiometricLockScreenProps> = ({ isDarkMode, setIsBiometricLocked }) => {
  return (
    <div className={`min-h-screen flex flex-col items-center justify-center p-4 transition-colors duration-300 ${isDarkMode ? 'dark bg-[#0a0a0a] text-white' : 'bg-slate-50 text-slate-900'}`}>
      <Helmet>
        <title>قفل التطبيق | سوك بغداد</title>
      </Helmet>
      <div className="w-24 h-24 bg-[#0052ff]/10 rounded-full flex items-center justify-center mb-6">
         <Lock className="w-12 h-12 text-[#0052ff] animate-pulse" />
      </div>
      <h2 className="text-2xl font-bold mb-2">تسجيل الدخول بالبصمة</h2>
      <p className={`text-sm mb-8 ${isDarkMode ? 'text-gray-400' : 'text-slate-500'}`}>يرجى تأكيد هويتك للوصول إلى التطبيق</p>
      <button 
        onClick={async () => {
           if (Capacitor.isNativePlatform()) {
              try {
                const { isAvailable } = await BiometricAuth.checkBiometry();
                if (isAvailable) {
                  await BiometricAuth.authenticate({
                    reason: "يرجى تأكيد هويتك للوصول إلى التطبيق",
                    androidTitle: "المصادقة بالبصمة",
                  });
                  setIsBiometricLocked(false);
                  sessionStorage.setItem('biometricUnlocked', 'true');
                } else {
                  setIsBiometricLocked(false);
                }
              } catch (e) {
                // user cancelled or failed
              }
           } else {
              setIsBiometricLocked(false);
           }
        }}
        className="px-8 py-3 bg-[#0052ff] text-white font-bold rounded-xl shadow-lg shadow-blue-500/20 hover:bg-blue-600 transition-colors flex items-center gap-2 mb-4"
      >
         <Lock className="w-5 h-5" /> المحاولة مرة أخرى
      </button>
      <button 
        onClick={async () => {
           if (window.confirm('هل أنت متأكد من تسجيل الخروج؟')) {
              await supabase.auth.signOut();
              localStorage.setItem('biometricEnabled', 'false');
              window.location.reload();
           }
        }}
        className="text-red-500 text-sm font-semibold hover:underline"
      >
        تسجيل الخروج
      </button>
    </div>
  );
};
