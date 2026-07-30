import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { JWT } from 'npm:google-auth-library';

serve(async (req) => {
  // CORS Headers
  const headers = new Headers({
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  });
  if (req.method === 'OPTIONS') return new Response('ok', { headers });

  try {
    const { token, title, body, data, imageUrl } = await req.json();

    if (!token) throw new Error('Missing FCM token');

    const serviceAccountStr = Deno.env.get('FIREBASE_SERVICE_ACCOUNT');
    if (!serviceAccountStr) throw new Error('Missing FIREBASE_SERVICE_ACCOUNT secret');
    const serviceAccount = JSON.parse(serviceAccountStr);

    const jwt = new JWT({
      email: serviceAccount.client_email,
      key: serviceAccount.private_key,
      scopes: ['https://www.googleapis.com/auth/firebase.messaging'],
    });

    const tokenResponse = await jwt.getAccessToken();
    const accessToken = tokenResponse.token;

    const projectId = serviceAccount.project_id;
    const fcmUrl = `https://fcm.googleapis.com/v1/projects/${projectId}/messages:send`;

    // ── FCM Message payload ─────────────────────────────────────────────────
    // CRITICAL: يجب وجود مفتاح "notification" في المستوى الأعلى
    // حتى يُعرض النظام (Android/iOS) الإشعار تلقائياً حتى لو التطبيق مغلق
    const fcmMessage = {
      message: {
        token: token,

        // ── الإشعار الأساسي (يجب أن يكون هنا دائماً) ─────────
        notification: {
          title: title || 'سوق بغداد',
          body: body || '',
          ...(imageUrl ? { image: imageUrl } : {}),
        },

        // ── إعدادات Android المتقدمة ────────────────────────────
        android: {
          priority: 'high',                    // أولوية عالية = يصل حتى لو الجهاز في وضع النوم
          notification: {
            channel_id: 'souq_baghdad_high_importance',  // يجب أن يطابق channel_id في التطبيق
            sound: 'default',
            default_sound: true,
            default_vibrate_timings: true,
            notification_priority: 'PRIORITY_HIGH',
            visibility: 'PUBLIC',              // يظهر على شاشة القفل
            tag: data?.type || 'general',
            click_action: 'FLUTTER_NOTIFICATION_CLICK',
            ...(imageUrl ? { image: imageUrl } : {}),
          },
          fcm_options: {
            analytics_label: data?.type || 'push',
          },
        },

        // ── إعدادات iOS ──────────────────────────────────────────
        apns: {
          headers: {
            'apns-priority': '10',             // أولوية قصوى على iOS
          },
          payload: {
            aps: {
              alert: {
                title: title || 'سوق بغداد',
                body: body || '',
              },
              sound: 'default',
              badge: 1,
              'content-available': 1,
              'mutable-content': 1,
            },
          },
        },

        // ── البيانات الإضافية (للـ Deep Linking وتحديد نوع الإشعار) ──
        data: {
          ...(data || {}),
          title: title || '',
          body: body || '',
          click_action: data?.click_action || 'home',
        },
      },
    };

    const res = await fetch(fcmUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(fcmMessage),
    });

    const fcmResponse = await res.json();
    return new Response(
      JSON.stringify({ success: res.ok, fcmResponse }),
      { headers, status: res.ok ? 200 : 400 }
    );

  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), { headers, status: 400 });
  }
});
