-- Migration: Insert default row into admin_config if none exists
insert into admin_config (
  deposit_wallet_address,
  direct_referral_percent,
  level_income_percent,
  binary_income_percent,
  global_royalty_percent,
  deposit_fee_percent,
  withdrawal_fee_percent,
  minimum_withdrawal,
  minimum_deposit
)
select
  '0x742d35Cc6634C0532925a3b8D4Ea83E2b16A6C4a',
  10,
  '[5, 3, 2, 1, 1]','8','2','2','5','50','10'
where not exists (select 1 from admin_config); 