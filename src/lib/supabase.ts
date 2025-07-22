import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Database types
export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          gpk_id: string;
          name: string;
          email: string;
          phone: string;
          referral_code: string;
          sponsor_id: string | null;
          right_count: number;
          total_earnings: number;
          wallet_balance: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          gpk_id: string;
          name: string;
          email: string;
          phone: string;
          referral_code: string;
          sponsor_id?: string | null;
          right_count?: number;
          total_earnings?: number;
          wallet_balance?: number;
        };
        Update: {
          id?: string;
          gpk_id?: string;
          name?: string;
          email?: string;
          phone?: string;
          referral_code?: string;
          sponsor_id?: string | null;
          right_count?: number;
          total_earnings?: number;
          wallet_balance?: number;
        };
      };
      packages: {
        Row: {
          id: string;
          name: string;
          price: number;
          roi: number;
          benefits: string[];
          description: string;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          name: string;
          price: number;
          roi: number;
          benefits: string[];
          description: string;
          is_active?: boolean;
        };
        Update: {
          id?: string;
          name?: string;
          price?: number;
          roi?: number;
          benefits?: string[];
          description?: string;
          is_active?: boolean;
        };
      };
      incomes: {
        Row: {
          id: string;
          user_id: string;
          type: 'direct' | 'level' | 'binary' | 'royalty';
          amount: number;
          from_user_id: string | null;
          level: number | null;
          package_id: string | null;
          description: string;
          date: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          type: 'direct' | 'level' | 'binary' | 'royalty';
          amount: number;
          from_user_id?: string | null;
          level?: number | null;
          package_id?: string | null;
          description: string;
          date?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          type?: 'direct' | 'level' | 'binary' | 'royalty';
          amount?: number;
          from_user_id?: string | null;
          level?: number | null;
          package_id?: string | null;
          description?: string;
          date?: string;
        };
      };
      transactions: {
        Row: {
          id: string;
          user_id: string;
          type: 'deposit' | 'withdrawal' | 'upgrade';
          amount: number;
          tx_hash: string | null;
          wallet_address: string | null;
          status: 'pending' | 'verified' | 'rejected' | 'completed';
          admin_fee: number;
          reference_id: string | null;
          date: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          type: 'deposit' | 'withdrawal' | 'upgrade';
          amount: number;
          tx_hash?: string | null;
          wallet_address?: string | null;
          status?: 'pending' | 'verified' | 'rejected' | 'completed';
          admin_fee?: number;
          reference_id?: string | null;
          date?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          type?: 'deposit' | 'withdrawal' | 'upgrade';
          amount?: number;
          tx_hash?: string | null;
          wallet_address?: string | null;
          status?: 'pending' | 'verified' | 'rejected' | 'completed';
          admin_fee?: number;
          reference_id?: string | null;
          date?: string;
        };
      };
      admin_config: {
        Row: {
          id: string;
          deposit_wallet_address: string;
          direct_referral_percent: number;
          level_income_percent: number[];
          binary_income_percent: number;
          global_royalty_percent: number;
          deposit_fee_percent: number;
          withdrawal_fee_percent: number;
          minimum_withdrawal: number;
          minimum_deposit: number;
          updated_at: string;
        };
        Insert: {
          id?: string;
          deposit_wallet_address?: string;
          direct_referral_percent?: number;
          level_income_percent?: number[];
          binary_income_percent?: number;
          global_royalty_percent?: number;
          deposit_fee_percent?: number;
          withdrawal_fee_percent?: number;
          minimum_withdrawal?: number;
          minimum_deposit?: number;
        };
        Update: {
          id?: string;
          deposit_wallet_address?: string;
          direct_referral_percent?: number;
          level_income_percent?: number[];
          binary_income_percent?: number;
          global_royalty_percent?: number;
          deposit_fee_percent?: number;
          withdrawal_fee_percent?: number;
          minimum_withdrawal?: number;
          minimum_deposit?: number;
        };
      };
    };
  };
}