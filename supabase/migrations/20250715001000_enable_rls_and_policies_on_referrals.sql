-- Enable Row Level Security on referrals table
ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;

-- Allow users to insert referrals where they are the referrer
CREATE POLICY "Allow self insert" ON referrals
FOR INSERT
USING (auth.uid() = referrer_id);

-- Allow users to select referrals where they are the referrer
CREATE POLICY "Allow self select" ON referrals
FOR SELECT
USING (auth.uid() = referrer_id); 