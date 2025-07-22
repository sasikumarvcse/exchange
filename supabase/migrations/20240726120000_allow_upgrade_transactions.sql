-- Allow 'upgrade' as a valid transaction type to log package purchases.

-- First, remove the old restrictive check constraint if it exists.
ALTER TABLE public.transactions
DROP CONSTRAINT IF EXISTS transactions_type_check;

-- Then, add a new check constraint that includes 'upgrade'.
ALTER TABLE public.transactions
ADD CONSTRAINT transactions_type_check
CHECK (type IN ('deposit', 'withdrawal', 'upgrade')); 