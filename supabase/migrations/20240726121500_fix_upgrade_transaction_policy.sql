-- Drop the existing policy if it exists
DROP POLICY IF EXISTS "Users can insert their own transactions" ON transactions;

-- Create the correct policy
CREATE POLICY "Users can insert their own transactions"
ON transactions
FOR INSERT
WITH CHECK (auth.uid() = user_id AND type IN ('deposit', 'withdrawal', 'upgrade'));

-- Drop and re-add the check constraint for type
ALTER TABLE transactions
DROP CONSTRAINT IF EXISTS transactions_type_check;

ALTER TABLE transactions
ADD CONSTRAINT transactions_type_check
CHECK (type IN ('deposit', 'withdrawal', 'upgrade')); 