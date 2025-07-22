-- Migration: Add deposit_wallet_address to admin_config
alter table admin_config add column if not exists deposit_wallet_address text; 