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
    const { token, title, body, data } = await req.json();

    if (!token) throw new Error('Missing FCM token');

    // Get Service Account from Environment Variable
    // In Supabase, you add this by running:
    // supabase secrets set FIREBASE_SERVICE_ACCOUNT='{...json content...}'
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

    const fcmMessage = {
      message: {
        token: token,
        notification: { title, body },
        android: {
          notification: {
            sound: 'default'
          }
        },
        apns: {
          payload: {
            aps: {
              sound: 'default'
            }
          }
        },
        data: data || {},
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
    return new Response(JSON.stringify({ success: res.ok, fcmResponse }), { headers, status: res.ok ? 200 : 400 });

  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), { headers, status: 400 });
  }
});
