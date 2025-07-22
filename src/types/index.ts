// MLM System Types
export interface User {
  id: string;
  gpk_id: string;
  name: string;
  email: string;
  phone: string | null;
  referral_code: string;
  sponsor_id: string | null;
  wallet_address: string | null;
  transaction_password: string | null;
  current_package: string;
  is_active: boolean;
  is_admin: boolean;
  join_date: string;
  total_earnings: number;
  wallet_balance: number;
  team_size: number;
  direct_referrals: number;
  created_at: string;
  updated_at: string;
}

export interface Package {
  id: string;
  name: string;
  price: number;
  order_index: number;
  global_royalty_eligible: boolean;
  global_royalty_share_percent: number;
  description: string | null;
  benefits: string[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface UserPackage {
  id: string;
  user_id: string;
  package_id: string;
  purchase_date: string;
  amount_paid: number;
  is_active: boolean;
  created_at: string;
  package?: Package;
}

export interface Income {
  id: string;
  user_id: string;
  from_user_id: string | null;
  amount: number;
  type: 'direct' | 'level' | 'global_royalty';
  level: number | null;
  package_id: string | null;
  description: string | null;
  date: string;
  created_at: string;
  from_user?: {
    name: string;
    gpk_id: string;
  };
  package?: {
    name: string;
  };
}

export interface Referral {
  referrer_id: string;
  referred_id: string;
  referral_date: string;
  referred_user?: {
    id: string;
    name: string;
    gpk_id: string;
    current_package: string;
    join_date: string;
    is_active: boolean;
  };
}

export interface Transaction {
  id: string;
  user_id: string;
  type: 'deposit' | 'withdrawal' | 'package_purchase' | 'income_credit';
  amount: number;
  tx_hash: string | null;
  wallet_address: string | null;
  status: 'pending' | 'verified' | 'rejected' | 'completed';
  admin_fee: number;
  reference_id: string | null;
  package_id: string | null;
  description: string | null;
  date: string;
  created_at: string;
  updated_at: string;
  package?: {
    name: string;
  };
}

export interface AdminConfig {
  id: number;
  direct_referral_percent: number;
  level_income_percents: number[];
  global_royalty_percent: number;
  global_royalty_cycle_days: number;
  deposit_wallet_address: string | null;
  minimum_withdrawal: number;
  minimum_deposit: number;
  withdrawal_fee_percent: number;
  deposit_fee_percent: number;
  created_at: string;
  updated_at: string;
}

export interface LevelQualification {
  id: string;
  user_id: string;
  level: number;
  qualified_at: string;
  team_size_at_qualification: number;
}

export interface GlobalRoyaltyDistribution {
  id: string;
  cycle_start_date: string;
  cycle_end_date: string;
  total_pool_amount: number;
  total_eligible_users: number;
  distributed_amount: number;
  status: 'pending' | 'distributed' | 'completed';
  created_at: string;
}

export interface GlobalRoyaltyPayment {
  id: string;
  distribution_id: string;
  user_id: string;
  package_id: string;
  share_percent: number;
  amount: number;
  created_at: string;
}

// Dashboard and UI Types
export interface DashboardStats {
  totalUsers: number;
  activeUsers: number;
  totalDeposits: number;
  totalWithdrawals: number;
  pendingVerifications: number;
  totalEarnings: number;
  directReferrals: number;
  teamSize: number;
  currentPackage: string;
  qualifiedLevel: number;
}

export interface IncomesSummary {
  total: number;
  direct: number;
  level: number;
  global_royalty: number;
  count: number;
}

export interface TeamMember {
  id: string;
  name: string;
  gpk_id: string;
  current_package: string;
  join_date: string;
  total_earnings: number;
  direct_referrals: number;
  team_size: number;
  is_active: boolean;
  team?: TeamMember[];
}

export interface PackageUpgradeCheck {
  canUpgrade: boolean;
  reason?: string;
}

// MLM Plan Constants
export const PACKAGE_ORDER = ['starter', 'silver', 'gold', 'platinum', 'diamond'] as const;

export const PACKAGE_PRICES = {
  starter: 2500,
  silver: 9500,
  gold: 25000,
  platinum: 95000,
  diamond: 250000
} as const;

export const LEVEL_REQUIREMENTS = [
  { level: 1, teamSize: 5, income: 1 },
  { level: 2, teamSize: 25, income: 1 },
  { level: 3, teamSize: 125, income: 1 },
  { level: 4, teamSize: 625, income: 1 },
  { level: 5, teamSize: 3125, income: 1 },
  { level: 6, teamSize: 15625, income: 1 },
  { level: 7, teamSize: 78125, income: 1 },
  { level: 8, teamSize: 390625, income: 2 },
  { level: 9, teamSize: 1953125, income: 3 },
  { level: 10, teamSize: 9765625, income: 3 }
] as const;

export type PackageId = typeof PACKAGE_ORDER[number];
export type IncomeType = 'direct' | 'level' | 'global_royalty';
export type TransactionType = 'deposit' | 'withdrawal' | 'package_purchase' | 'income_credit';
export type TransactionStatus = 'pending' | 'verified' | 'rejected' | 'completed';