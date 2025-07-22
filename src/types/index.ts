export interface User {
  id: string;
  gpk_id: string;
  name: string;
  email: string;
  phone: string;
  referral_code: string;
  sponsor_id: string | null;
  wallet_address: string | null;
  transaction_password: string | null;
  package_id: string | null;
  is_active: boolean;
  is_admin: boolean;
  join_date: string;
  right_count: number;
  total_earnings: number;
  wallet_balance: number;
  created_at: string;
  updated_at: string;
}

export interface Package {
  id: string;
  name: string;
  price: number;
  roi: number;
  benefits: string[];
  description: string;
  isActive: boolean;
}

export interface Income {
  id: string;
  user_id: string;
  amount: number;
  date: string;
  // Add other fields as needed
}

export interface Transaction {
  id: string;
  user_id: string;
  type: 'deposit' | 'withdrawal' | 'income' | 'upgrade';
  amount: number;
  tx_hash: string | null;
  wallet_address: string | null;
  status: 'pending' | 'verified' | 'rejected' | 'completed';
  admin_fee: number;
  reference_id: string | null;
  date: string;
  created_at: string;
  updated_at: string;
  description?: string;
}

export interface AdminConfig {
  depositWalletAddress: string;
  directReferralPercent: number;
  levelIncomePercent: number[];
  binaryIncomePercent: number;
  globalRoyaltyPercent: number;
  depositFeePercent: number;
  withdrawalFeePercent: number;
  minimumWithdrawal: number;
  minimumDeposit: number;
  gpkToInrPrice: number; // GPK to INR conversion rate
}

export interface BinaryNode {
  user: User;
  level: number;
}

export interface DashboardStats {
  totalUsers: number;
  activeUsers: number;
  totalDeposits: number;
  totalWithdrawals: number;
  pendingVerifications: number;
  totalEarnings: number;
}