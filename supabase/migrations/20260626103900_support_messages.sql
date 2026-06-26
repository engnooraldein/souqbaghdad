-- Create support messages table
CREATE TABLE IF NOT EXISTS support_messages (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  contact_info text not null,
  message text not null,
  status text not null default 'pending', -- 'pending', 'resolved'
  created_at timestamptz not null default now()
);

-- Enable RLS
ALTER TABLE support_messages ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can insert support messages
DROP POLICY IF EXISTS "Anyone can insert support messages" ON support_messages;
CREATE POLICY "Anyone can insert support messages" ON support_messages
  FOR INSERT WITH CHECK (true);

-- Policy: Owner and admin can read support messages
DROP POLICY IF EXISTS "Owner/Admin can select support messages" ON support_messages;
CREATE POLICY "Owner/Admin can select support messages" ON support_messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

-- Policy: Owner and admin can update support messages
DROP POLICY IF EXISTS "Owner/Admin can update support messages" ON support_messages;
CREATE POLICY "Owner/Admin can update support messages" ON support_messages
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

-- Policy: Owner and admin can delete support messages
DROP POLICY IF EXISTS "Owner/Admin can delete support messages" ON support_messages;
CREATE POLICY "Owner/Admin can delete support messages" ON support_messages
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('owner', 'admin')
    )
  );
