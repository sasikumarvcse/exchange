CREATE TABLE referrals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id uuid NOT NULL,
  referred_id uuid NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc', now()),
  CONSTRAINT fk_referrer FOREIGN KEY (referrer_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_referred FOREIGN KEY (referred_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Trigger function to credit wallet on verified deposit
CREATE OR REPLACE FUNCTION credit_wallet_on_verified_deposit()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.type = 'deposit' AND NEW.status = 'verified' AND OLD.status <> 'verified' THEN
    UPDATE profiles
    SET wallet_balance = wallet_balance + NEW.amount
    WHERE id = NEW.user_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_credit_wallet_on_verified_deposit ON transactions;
CREATE TRIGGER trg_credit_wallet_on_verified_deposit
AFTER UPDATE ON transactions
FOR EACH ROW
WHEN (OLD.status IS DISTINCT FROM NEW.status)
EXECUTE FUNCTION credit_wallet_on_verified_deposit(); 