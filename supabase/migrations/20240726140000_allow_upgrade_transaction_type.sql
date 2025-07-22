-- Migration: Allow 'upgrade' as a valid transaction type in transactions table
ALTER TABLE transactions
  DROP CONSTRAINT IF EXISTS transactions_type_check;

ALTER TABLE transactions
  ADD CONSTRAINT transactions_type_check
    CHECK (type IN ('deposit', 'withdrawal', 'upgrade')); 