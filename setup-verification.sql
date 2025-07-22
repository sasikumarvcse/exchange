-- GrowwPark MLM System Setup Verification Script
-- Run this script in your Supabase SQL editor to verify the setup

-- 1. Check if all tables exist
DO $$
DECLARE
    tables_to_check text[] := ARRAY['profiles', 'packages', 'user_packages', 'incomes', 'referrals', 'level_qualifications', 'transactions', 'admin_config', 'global_royalty_distributions', 'global_royalty_payments'];
    table_name text;
    table_exists boolean;
BEGIN
    RAISE NOTICE 'Checking table existence...';
    
    FOREACH table_name IN ARRAY tables_to_check LOOP
        SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = table_name
        ) INTO table_exists;
        
        IF table_exists THEN
            RAISE NOTICE '✓ Table % exists', table_name;
        ELSE
            RAISE NOTICE '✗ Table % MISSING', table_name;
        END IF;
    END LOOP;
END $$;

-- 2. Check if functions exist
DO $$
DECLARE
    functions_to_check text[] := ARRAY['handle_package_purchase', 'get_user_level_qualification', 'distribute_level_income', 'generate_referral_code', 'generate_gpk_id'];
    function_name text;
    function_exists boolean;
BEGIN
    RAISE NOTICE 'Checking function existence...';
    
    FOREACH function_name IN ARRAY functions_to_check LOOP
        SELECT EXISTS (
            SELECT FROM information_schema.routines 
            WHERE routine_schema = 'public' 
            AND routine_name = function_name
        ) INTO function_exists;
        
        IF function_exists THEN
            RAISE NOTICE '✓ Function % exists', function_name;
        ELSE
            RAISE NOTICE '✗ Function % MISSING', function_name;
        END IF;
    END LOOP;
END $$;

-- 3. Check if packages are properly inserted
SELECT 
    CASE 
        WHEN COUNT(*) = 5 THEN '✓ All 5 packages exist'
        ELSE '✗ Missing packages: ' || (5 - COUNT(*)::text) || ' packages missing'
    END as package_status
FROM packages;

-- 4. Verify package data
SELECT 
    id, 
    name, 
    price, 
    order_index, 
    global_royalty_eligible, 
    global_royalty_share_percent
FROM packages 
ORDER BY order_index;

-- 5. Check admin config
SELECT 
    CASE 
        WHEN COUNT(*) > 0 THEN '✓ Admin config exists'
        ELSE '✗ Admin config MISSING'
    END as admin_config_status
FROM admin_config;

-- 6. Verify admin config values
SELECT 
    direct_referral_percent,
    level_income_percents,
    global_royalty_percent,
    global_royalty_cycle_days
FROM admin_config 
LIMIT 1;

-- 7. Test function: Generate referral code
SELECT generate_referral_code() as sample_referral_code;

-- 8. Test function: Generate GPK ID
SELECT generate_gpk_id() as sample_gpk_id;

-- 9. Check RLS policies
SELECT 
    schemaname, 
    tablename, 
    policyname, 
    permissive, 
    roles, 
    cmd, 
    qual
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- 10. Check indexes
SELECT 
    indexname, 
    tablename, 
    indexdef
FROM pg_indexes 
WHERE schemaname = 'public' 
    AND indexname LIKE 'idx_%'
ORDER BY tablename, indexname;

-- 11. Verify triggers
SELECT 
    trigger_name, 
    event_manipulation, 
    event_object_table, 
    action_timing, 
    action_statement
FROM information_schema.triggers 
WHERE trigger_schema = 'public'
ORDER BY event_object_table, trigger_name;

-- 12. Test package purchase simulation (only if you have test users)
-- Uncomment and modify the user IDs below to test with real data
/*
-- Create a test scenario
INSERT INTO auth.users (id, email) VALUES 
    ('test-user-1', 'test1@example.com'),
    ('test-user-2', 'test2@example.com')
ON CONFLICT DO NOTHING;

-- Create test profiles
INSERT INTO profiles (id, gpk_id, name, email, referral_code, sponsor_id) VALUES 
    ('test-user-1', 'GPK1234567', 'Test User 1', 'test1@example.com', 'GPK123456', NULL),
    ('test-user-2', 'GPK2345678', 'Test User 2', 'test2@example.com', 'GPK234567', 'test-user-1')
ON CONFLICT DO NOTHING;

-- Create referral relationship
INSERT INTO referrals (referrer_id, referred_id) VALUES 
    ('test-user-1', 'test-user-2')
ON CONFLICT DO NOTHING;

-- Test package purchase
SELECT handle_package_purchase('test-user-2', 'starter', 2500);

-- Check results
SELECT 'Direct Income Test' as test_type, user_id, amount, type, description 
FROM incomes 
WHERE from_user_id = 'test-user-2' AND type = 'direct';

SELECT 'User Balance Test' as test_type, gpk_id, total_earnings, wallet_balance 
FROM profiles 
WHERE id IN ('test-user-1', 'test-user-2');
*/

-- 13. Final summary
SELECT 
    'Setup Verification Complete' as status,
    'Check the messages above for any missing components' as note;

RAISE NOTICE '==================================================';
RAISE NOTICE 'GrowwPark MLM System Setup Verification Complete';
RAISE NOTICE '==================================================';
RAISE NOTICE 'Next steps:';
RAISE NOTICE '1. Set up your .env file with Supabase credentials';
RAISE NOTICE '2. Run: npm install && npm run dev';
RAISE NOTICE '3. Test user registration and package purchases';
RAISE NOTICE '4. Monitor income distribution in the incomes table';
RAISE NOTICE '==================================================';