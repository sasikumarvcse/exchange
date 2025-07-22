-- Create notifications table for real-time user notifications
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  message text NOT NULL,
  read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Trigger function to insert notification on package upgrade
CREATE OR REPLACE FUNCTION notify_on_package_upgrade()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.package_id IS DISTINCT FROM OLD.package_id THEN
    INSERT INTO notifications (user_id, type, message)
    VALUES (
      NEW.id,
      'system', -- or 'upgrade', or any appropriate type
      'Your package has been upgraded!'
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Attach the trigger to the profiles table
DROP TRIGGER IF EXISTS trg_notify_on_package_upgrade ON profiles;
CREATE TRIGGER trg_notify_on_package_upgrade
AFTER UPDATE ON profiles
FOR EACH ROW
EXECUTE FUNCTION notify_on_package_upgrade(); 