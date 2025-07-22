-- Fix the transactions_type_check constraint to allow 'upgrade' as a valid type
ALTER TABLE transactions
DROP CONSTRAINT IF EXISTS transactions_type_check;

ALTER TABLE transactions
ADD CONSTRAINT transactions_type_check
CHECK (type IN ('deposit', 'withdrawal', 'upgrade')); 