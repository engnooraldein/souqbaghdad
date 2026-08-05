import { useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Capacitor } from '@capacitor/core';
import { LocalNotifications } from '@capacitor/local-notifications';
import { PushNotifications } from '@capacitor/push-notifications';
import { App as CapacitorApp } from '@capacitor/app';
import { User } from '../types';

export function useNativeNotifications(user: User | null) {
  // Initialize Native Permissions & Notification Channel
  useEffect(() => {
    const initPermissions = async () => {
      if (Capacitor.isNativePlatform()) {
        setTimeout(async () => {
          try {
            // Local Notifications Setup
            const notifStatus = await LocalNotifications.checkPermissions();
            if (notifStatus.display !== 'granted') {
              await LocalNotifications.requestPermissions();
            }
            // Create High Importance Android Notification Channel for sound and lockscreen alert
            await LocalNotifications.createChannel({
              id: 'souq_baghdad_high_importance',
              name: 'إشعارات سوق بغداد',
              description: 'إشعارات الهواتف العاجلة والرسائل',
              importance: 5,
              visibility: 1,
              sound: 'default',
              vibration: true
            });

            // Push Notifications Setup (FCM)
            let permStatus = await PushNotifications.checkPermissions();
            if (permStatus.receive === 'prompt') {
              permStatus = await PushNotifications.requestPermissions();
            }
            if (permStatus.receive !== 'granted') {
              console.warn('User denied push notifications');
            } else {
              await PushNotifications.register();
            }

            PushNotifications.addListener('registration', async (token) => {
              console.log('Push registration success, token: ' + token.value);
              localStorage.setItem('fcm_token', token.value);
              
              // If user is already logged in, update it in DB
              const sessionStr = localStorage.getItem('souqUser');
              if (sessionStr) {
                try {
                  const { user } = JSON.parse(sessionStr);
                  if (user && user.id) {
                     supabase.from('profiles').update({ fcm_token: token.value }).eq('id', user.id).then();
                  }
                } catch(e) {}
              }
            });

            PushNotifications.addListener('registrationError', (error: any) => {
              console.error('Error on registration: ' + JSON.stringify(error));
            });

            PushNotifications.addListener('pushNotificationReceived', (notification) => {
              console.log('Push received: ', notification);
            });

            PushNotifications.addListener('pushNotificationActionPerformed', (notification) => {
              console.log('Push action performed: ', notification);
            });

            // ── إشعارات التفاعل الذكية عند الخروج من التطبيق ──────────────
            const RE_ENGAGEMENT_MESSAGES = [
              {
                title: '📢 نصيحة سريعة لإعلانك!',
                body: 'إضافة صور واضحة تزيد فرصة البيع للضعف! حدّث إعلانك هسه 🚀',
                delay: 600,
              },
              {
                title: '⏰ هل نسيت إعلانك؟',
                body: 'إعلانك بانتظار المشتري! سوّي إعادة نشر وخليه يتصدر 🔄',
                delay: 3600,
              },
              {
                title: '🔥 عرض نهاية الأسبوع!',
                body: '30% خصم على الإعلانات المميزة ✨ خلي إعلانك يتصدر سوق بغداد 🌟',
                delay: 86400,
              },
            ];

            let backgroundEnteredAt = 0;

            CapacitorApp.addListener('appStateChange', async ({ isActive }) => {
              if (!isActive) {
                backgroundEnteredAt = Date.now();

                try {
                  await LocalNotifications.cancel({ notifications: [
                    { id: 1001 }, { id: 1002 }, { id: 1003 }
                  ]});

                  const sessionStr = localStorage.getItem('souqUser');
                  const isLoggedIn = !!sessionStr;

                  const msgs = isLoggedIn
                    ? RE_ENGAGEMENT_MESSAGES
                    : [
                        { title: '👋 مرحباً بك في سوق بغداد!', body: 'سجّل دخولك واستمتع بآلاف الإعلانات 🎉', delay: 300 },
                        { title: '🏠 آلاف العقارات بانتظارك!', body: 'عقارات متاحة في جميع المحافظات العراقية 🌍', delay: 3600 },
                      ];

                  const notifications = msgs.map((msg, idx) => ({
                    id: 1001 + idx,
                    title: msg.title,
                    body: msg.body,
                    channelId: 'souq_baghdad_high_importance',
                    schedule: { at: new Date(Date.now() + msg.delay * 1000) },
                    sound: 'default',
                    smallIcon: 'ic_launcher_foreground',
                    largeIcon: 'ic_launcher',
                    extra: { type: 're_engagement' },
                  }));

                  await LocalNotifications.schedule({ notifications });
                } catch (e) {
                  console.warn('Local notification schedule failed:', e);
                }

              } else {
                if (backgroundEnteredAt > 0) {
                  try {
                    await LocalNotifications.cancel({ notifications: [
                      { id: 1001 }, { id: 1002 }, { id: 1003 }
                    ]});
                  } catch { /* ignore */ }
                  backgroundEnteredAt = 0;
                }
              }
            });

          } catch (e) {
            console.warn('Native permissions/channel error:', e);
          }
        }, 1500);
      } else {
        if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
          navigator.serviceWorker.register('/firebase-messaging-sw.js')
            .then(reg => console.log('FCM Service Worker registered:', reg.scope))
            .catch(err => console.warn('FCM SW registration error:', err));
        }
      }
    };
    initPermissions();
  }, []);

  // ── مزامنة الـ FCM Token التلقائية ──
  useEffect(() => {
    if (user?.id) {
      const token = localStorage.getItem('fcm_token');
      if (token) {
        supabase.from('profiles').update({ fcm_token: token }).eq('id', user.id).then();
      }
    }
  }, [user?.id]);
}
