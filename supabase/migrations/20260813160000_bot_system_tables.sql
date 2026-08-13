-- 1. جدول سياق المحادثات لجميع المنصات
CREATE TABLE IF NOT EXISTS bot_conversations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  platform TEXT NOT NULL,           -- 'telegram', 'facebook', 'instagram', 'threads'
  sender_id TEXT NOT NULL,          -- معرف المستخدم على المنصة
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL, -- معرف المستخدم في سوق بغداد (إن وُجد)
  context JSONB DEFAULT '{}'::jsonb, -- سياق المحادثة وتاريخها ورغبات البحث
  last_message TEXT,
  last_reply TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(platform, sender_id)
);

-- 2. جدول تنبيهات البحث المخصصة للمستخدمين
CREATE TABLE IF NOT EXISTS search_alerts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  platform TEXT NOT NULL DEFAULT 'telegram',
  sender_id TEXT NOT NULL,          -- chat_id أو messenger id
  query TEXT NOT NULL,              -- الكلمة المفتاحية مثل "تويوتا"
  max_price NUMERIC,                -- السعر الأقصى
  category TEXT,                    -- الفئة (اختياري)
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. جدول إحصائيات البوت والنشاط اليومي
CREATE TABLE IF NOT EXISTS bot_stats (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  date DATE DEFAULT CURRENT_DATE,
  platform TEXT NOT NULL,
  new_users INTEGER DEFAULT 0,
  messages_received INTEGER DEFAULT 0,
  messages_sent INTEGER DEFAULT 0,
  ads_published INTEGER DEFAULT 0,
  deals_closed INTEGER DEFAULT 0,
  complaints INTEGER DEFAULT 0,
  UNIQUE(date, platform)
);

-- RLS Policies
ALTER TABLE bot_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE search_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE bot_stats ENABLE ROW LEVEL SECURITY;

-- السماح لـ Service Role بكامل الصلاحيات
CREATE POLICY "Service Role full access on bot_conversations" ON bot_conversations FOR ALL USING (true);
CREATE POLICY "Service Role full access on search_alerts" ON search_alerts FOR ALL USING (true);
CREATE POLICY "Service Role full access on bot_stats" ON bot_stats FOR ALL USING (true);

-- السماح للمستخدمين برؤية وإدارة تنبيهاتهم فقط
CREATE POLICY "Users manage own search_alerts" ON search_alerts FOR ALL USING (auth.uid() = user_id);
