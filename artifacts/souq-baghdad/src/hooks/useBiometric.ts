import { useState, useEffect } from 'react';
import { Capacitor } from '@capacitor/core';
import { BiometricAuth } from '@aparajita/capacitor-biometric-auth';
import { User } from '../types';

export function useBiometric(user: User | null, playNotificationSound: any) {
  const [showBiometricBanner, setShowBiometricBanner] = useState(false);
  
  const [isBiometricLocked, setIsBiometricLocked] = useState<boolean>(() => {
    return localStorage.getItem('biometricEnabled') === 'true' && 
           localStorage.getItem('souqUser') !== null && 
           sessionStorage.getItem('biometricUnlocked') !== 'true';
  });

  useEffect(() => {
    const checkBiometric = async () => {
      if (isBiometricLocked) {
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
            console.log('Biometric failed or cancelled', e);
          }
        } else {
           setIsBiometricLocked(false);
        }
      }
    };
    checkBiometric();
  }, [isBiometricLocked]);

  useEffect(() => {
    if (user && !localStorage.getItem('biometricPromptShown') && !isBiometricLocked) {
      const t = setTimeout(() => {
        setShowBiometricBanner(true);
        try { playNotificationSound('info'); } catch(e){}
      }, 4000);
      return () => clearTimeout(t);
    }
    return undefined;
  }, [user, isBiometricLocked, playNotificationSound]);

  return {
    isBiometricLocked,
    showBiometricBanner,
    setShowBiometricBanner,
    setIsBiometricLocked
  };
}
