import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0'

const TIKTOK_CLIENT_KEY = Deno.env.get('TIKTOK_CLIENT_KEY')!
const TIKTOK_CLIENT_SECRET = Deno.env.get('TIKTOK_CLIENT_SECRET')!
const REDIRECT_URI = 'https://lyhqnccpudwgvexqinxa.supabase.co/functions/v1/tiktok-oauth'

serve(async (req) => {
  try {
    const url = new URL(req.url)
    
    // 1. إذا كان الطلب لا يحتوي على code، نقوم بتوجيه المستخدم لصفحة تسجيل دخول تيك توك
    if (!url.searchParams.has('code')) {
      const state = Math.random().toString(36).substring(7)
      const authorizeUrl = `https://www.tiktok.com/v2/auth/authorize/?client_key=${TIKTOK_CLIENT_KEY}&response_type=code&scope=user.info.basic,video.publish&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&state=${state}`
      
      return new Response(null, {
        status: 302,
        headers: { Location: authorizeUrl },
      })
    }

    // 2. تيك توك أعاد توجيه المستخدم إلينا مع الرمز (code)
    const code = url.searchParams.get('code')!
    
    // 3. نستبدل الرمز بـ Access Token
    const tokenResponse = await fetch('https://open.tiktokapis.com/v2/oauth/token/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Cache-Control': 'no-cache'
      },
      body: new URLSearchParams({
        client_key: TIKTOK_CLIENT_KEY,
        client_secret: TIKTOK_CLIENT_SECRET,
        code: code,
        grant_type: 'authorization_code',
        redirect_uri: REDIRECT_URI,
      })
    })

    const tokenData = await tokenResponse.json()

    if (!tokenResponse.ok || tokenData.error) {
      console.error('TikTok Token Error:', tokenData)
      return new Response(`Failed to get TikTok token: ${JSON.stringify(tokenData)}`, { status: 400 })
    }

    const { access_token, refresh_token, open_id, expires_in } = tokenData

    // 4. حفظ التوكن في قاعدة بيانات Supabase
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const expiresAt = new Date(Date.now() + expires_in * 1000).toISOString()

    const { error: dbError } = await supabaseAdmin
      .from('social_integrations')
      .upsert({
        platform: 'tiktok',
        access_token: access_token,
        refresh_token: refresh_token,
        open_id: open_id,
        expires_at: expiresAt,
        updated_at: new Date().toISOString()
      }, { onConflict: 'platform' })

    if (dbError) {
      console.error('Database Error:', dbError)
      return new Response('Failed to save token to database', { status: 500 })
    }

    return new Response(
      'TikTok authorization successful! Tokens saved. You can close this window.', 
      { headers: { "Content-Type": "text/html; charset=utf-8" } }
    )

  } catch (error) {
    console.error('Unexpected error:', error)
    return new Response('Internal Server Error', { status: 500 })
  }
})
