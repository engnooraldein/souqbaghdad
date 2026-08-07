import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const botToken = Deno.env.get('TELEGRAM_BOT_TOKEN') || '';
const supportUserId = Deno.env.get('SUPPORT_USER_ID') || ''; // ID of "الدعم الفني" user in your DB

serve(async (req) => {
  try {
    const payload = await req.json();
    const record = payload.record; // The new transport ad

    // Only process transport ads
    if (payload.type !== 'INSERT' || record.category !== 'transport') {
      return new Response('Ignored', { status: 200 })
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const transportData = typeof record.description === 'string' ? JSON.parse(record.description) : record.description;
    const dest = transportData.university || '';
    const regions = transportData.regions || '';
    const catType = transportData.categoryType || ''; // student, employee, emergency

    // 1. Find matching alerts in DB
    const { data: alerts, error: alertsError } = await supabase
      .from('transport_alerts')
      .select('user_id, region_keyword')
      .eq('destination', dest)
      .eq('is_active', true);

    if (alertsError) throw alertsError;
    if (!alerts || alerts.length === 0) return new Response('No matches found', { status: 200 });

    const matchedUserIds: string[] = [];

    for (const alert of alerts) {
      if (regions.includes(alert.region_keyword)) {
        matchedUserIds.push(alert.user_id);
      }
    }

    if (matchedUserIds.length === 0) return new Response('No region matches found', { status: 200 });

    // 2. Send Notifications and Chat Messages
    const adTitle = record.title || 'خط نقل جديد';
    const messageText = `مرحباً بك! تود منصة سوق بغداد إعلامك بتوفر خط يطابق طلبك: "${adTitle}" من ${regions} إلى ${dest}. يمكنك مراجعته الآن في التطبيق.`;

    for (const uid of matchedUserIds) {
      // (a) Send Telegram Message if user linked their Telegram account
      const { data: tgUser } = await supabase
        .from('telegram_users')
        .select('telegram_chat_id')
        .eq('user_id', uid)
        .single();

      if (tgUser && botToken) {
        const tgUrl = `https://api.telegram.org/bot${botToken}/sendMessage`;
        await fetch(tgUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: tgUser.telegram_chat_id,
            text: messageText
          })
        });
      }
    }

    return new Response(JSON.stringify({ success: true, matchedCount: matchedUserIds.length }), { headers: { 'Content-Type': 'application/json' } });
  } catch (error: any) {
    console.error(error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
})
