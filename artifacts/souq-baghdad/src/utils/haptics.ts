import { Capacitor } from '@capacitor/core';

export const triggerHaptic = async (type: 'light' | 'medium' | 'heavy' | 'success' | 'warning' = 'light') => {
  try {
    // 1. If Capacitor native Haptics plugin is available via Plugins bridge
    if (Capacitor.isNativePlatform() && (Capacitor as any).Plugins?.Haptics) {
      const HapticsPlugin = (Capacitor as any).Plugins.Haptics;
      if (type === 'light') {
        await HapticsPlugin.impact({ style: 'LIGHT' });
      } else if (type === 'medium') {
        await HapticsPlugin.impact({ style: 'MEDIUM' });
      } else if (type === 'heavy') {
        await HapticsPlugin.impact({ style: 'HEAVY' });
      } else if (type === 'success' || type === 'warning') {
        await HapticsPlugin.notification({ type: type.toUpperCase() });
      }
      return;
    }

    // 2. Fallback to Web Vibration API (supported natively in Android WebView & Mobile browsers)
    if (typeof window !== 'undefined' && 'vibrate' in navigator) {
      if (type === 'light') {
        navigator.vibrate(12);
      } else if (type === 'medium') {
        navigator.vibrate(28);
      } else if (type === 'heavy') {
        navigator.vibrate(45);
      } else if (type === 'success') {
        navigator.vibrate([15, 30, 20]);
      } else if (type === 'warning') {
        navigator.vibrate([35, 50, 35]);
      }
    }
  } catch (e) {
    console.debug('Haptic feedback error:', e);
  }
};
