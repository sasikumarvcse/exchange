-- Notifications table for user alerts
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  type text NOT NULL, -- e.g., 'deposit', 'withdrawal', 'system'
  message text NOT NULL,
  is_read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "User can read own notifications" ON notifications
  FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "User can insert own notifications" ON notifications
  FOR INSERT WITH CHECK (user_id = auth.uid()); 