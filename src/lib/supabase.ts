import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Database types for the MLM system
export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
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
        };
        Insert: {
          id: string;
          gpk_id?: string;
          name: string;
          email: string;
          phone?: string | null;
          referral_code?: string;
          sponsor_id?: string | null;
          wallet_address?: string | null;
          transaction_password?: string | null;
          current_package?: string;
          is_active?: boolean;
          is_admin?: boolean;
          join_date?: string;
          total_earnings?: number;
          wallet_balance?: number;
          team_size?: number;
          direct_referrals?: number;
        };
        Update: {
          id?: string;
          gpk_id?: string;
          name?: string;
          email?: string;
          phone?: string | null;
          referral_code?: string;
          sponsor_id?: string | null;
          wallet_address?: string | null;
          transaction_password?: string | null;
          current_package?: string;
          is_active?: boolean;
          is_admin?: boolean;
          join_date?: string;
          total_earnings?: number;
          wallet_balance?: number;
          team_size?: number;
          direct_referrals?: number;
        };
      };
      packages: {
        Row: {
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
        };
        Insert: {
          id: string;
          name: string;
          price: number;
          order_index: number;
          global_royalty_eligible?: boolean;
          global_royalty_share_percent?: number;
          description?: string | null;
          benefits?: string[];
          is_active?: boolean;
        };
        Update: {
          id?: string;
          name?: string;
          price?: number;
          order_index?: number;
          global_royalty_eligible?: boolean;
          global_royalty_share_percent?: number;
          description?: string | null;
          benefits?: string[];
          is_active?: boolean;
        };
      };
      user_packages: {
        Row: {
          id: string;
          user_id: string;
          package_id: string;
          purchase_date: string;
          amount_paid: number;
          is_active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          package_id: string;
          purchase_date?: string;
          amount_paid: number;
          is_active?: boolean;
        };
        Update: {
          id?: string;
          user_id?: string;
          package_id?: string;
          purchase_date?: string;
          amount_paid?: number;
          is_active?: boolean;
        };
      };
      incomes: {
        Row: {
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
        };
        Insert: {
          id?: string;
          user_id: string;
          from_user_id?: string | null;
          amount: number;
          type: 'direct' | 'level' | 'global_royalty';
          level?: number | null;
          package_id?: string | null;
          description?: string | null;
          date?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          from_user_id?: string | null;
          amount?: number;
          type?: 'direct' | 'level' | 'global_royalty';
          level?: number | null;
          package_id?: string | null;
          description?: string | null;
          date?: string;
        };
      };
      referrals: {
        Row: {
          referrer_id: string;
          referred_id: string;
          referral_date: string;
        };
        Insert: {
          referrer_id: string;
          referred_id: string;
          referral_date?: string;
        };
        Update: {
          referrer_id?: string;
          referred_id?: string;
          referral_date?: string;
        };
      };
      level_qualifications: {
        Row: {
          id: string;
          user_id: string;
          level: number;
          qualified_at: string;
          team_size_at_qualification: number;
        };
        Insert: {
          id?: string;
          user_id: string;
          level: number;
          qualified_at?: string;
          team_size_at_qualification?: number;
        };
        Update: {
          id?: string;
          user_id?: string;
          level?: number;
          qualified_at?: string;
          team_size_at_qualification?: number;
        };
      };
      transactions: {
        Row: {
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
        };
        Insert: {
          id?: string;
          user_id: string;
          type: 'deposit' | 'withdrawal' | 'package_purchase' | 'income_credit';
          amount: number;
          tx_hash?: string | null;
          wallet_address?: string | null;
          status?: 'pending' | 'verified' | 'rejected' | 'completed';
          admin_fee?: number;
          reference_id?: string | null;
          package_id?: string | null;
          description?: string | null;
          date?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          type?: 'deposit' | 'withdrawal' | 'package_purchase' | 'income_credit';
          amount?: number;
          tx_hash?: string | null;
          wallet_address?: string | null;
          status?: 'pending' | 'verified' | 'rejected' | 'completed';
          admin_fee?: number;
          reference_id?: string | null;
          package_id?: string | null;
          description?: string | null;
          date?: string;
        };
      };
      admin_config: {
        Row: {
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
        };
        Insert: {
          id?: number;
          direct_referral_percent?: number;
          level_income_percents?: number[];
          global_royalty_percent?: number;
          global_royalty_cycle_days?: number;
          deposit_wallet_address?: string | null;
          minimum_withdrawal?: number;
          minimum_deposit?: number;
          withdrawal_fee_percent?: number;
          deposit_fee_percent?: number;
        };
        Update: {
          id?: number;
          direct_referral_percent?: number;
          level_income_percents?: number[];
          global_royalty_percent?: number;
          global_royalty_cycle_days?: number;
          deposit_wallet_address?: string | null;
          minimum_withdrawal?: number;
          minimum_deposit?: number;
          withdrawal_fee_percent?: number;
          deposit_fee_percent?: number;
        };
      };
      global_royalty_distributions: {
        Row: {
          id: string;
          cycle_start_date: string;
          cycle_end_date: string;
          total_pool_amount: number;
          total_eligible_users: number;
          distributed_amount: number;
          status: 'pending' | 'distributed' | 'completed';
          created_at: string;
        };
        Insert: {
          id?: string;
          cycle_start_date: string;
          cycle_end_date: string;
          total_pool_amount: number;
          total_eligible_users?: number;
          distributed_amount?: number;
          status?: 'pending' | 'distributed' | 'completed';
        };
        Update: {
          id?: string;
          cycle_start_date?: string;
          cycle_end_date?: string;
          total_pool_amount?: number;
          total_eligible_users?: number;
          distributed_amount?: number;
          status?: 'pending' | 'distributed' | 'completed';
        };
      };
      global_royalty_payments: {
        Row: {
          id: string;
          distribution_id: string;
          user_id: string;
          package_id: string;
          share_percent: number;
          amount: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          distribution_id: string;
          user_id: string;
          package_id: string;
          share_percent: number;
          amount: number;
        };
        Update: {
          id?: string;
          distribution_id?: string;
          user_id?: string;
          package_id?: string;
          share_percent?: number;
          amount?: number;
        };
      };
    };
    Functions: {
      handle_package_purchase: {
        Args: {
          user_id: string;
          package_id: string;
          amount_paid: number;
        };
        Returns: void;
      };
      get_user_level_qualification: {
        Args: {
          user_id: string;
        };
        Returns: number;
      };
      generate_referral_code: {
        Args: {};
        Returns: string;
      };
      generate_gpk_id: {
        Args: {};
        Returns: string;
      };
    };
  };
}

// MLM Service functions
export class MLMService {
  static async getPackages() {
    const { data, error } = await supabase
      .from('packages')
      .select('*')
      .eq('is_active', true)
      .order('order_index');
    
    if (error) throw error;
    return data;
  }

  static async getUserProfile(userId: string) {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    
    if (error) throw error;
    return data;
  }

  static async getUserIncomes(userId: string) {
    const { data, error } = await supabase
      .from('incomes')
      .select(`
        *,
        from_user:profiles!incomes_from_user_id_fkey(name, gpk_id),
        package:packages(name)
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data;
  }

  static async getUserReferrals(userId: string) {
    const { data, error } = await supabase
      .from('referrals')
      .select(`
        *,
        referred_user:profiles!referrals_referred_id_fkey(
          id, name, gpk_id, current_package, join_date, is_active
        )
      `)
      .eq('referrer_id', userId)
      .order('referral_date', { ascending: false });
    
    if (error) throw error;
    return data;
  }

  static async getUserPackages(userId: string) {
    const { data, error } = await supabase
      .from('user_packages')
      .select(`
        *,
        package:packages(*)
      `)
      .eq('user_id', userId)
      .eq('is_active', true)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data;
  }

  static async purchasePackage(userId: string, packageId: string, amountPaid: number) {
    const { error } = await supabase.rpc('handle_package_purchase', {
      user_id: userId,
      package_id: packageId,
      amount_paid: amountPaid
    });
    
    if (error) throw error;
  }

  static async createProfile(authUser: any, sponsorReferralCode?: string) {
    // Generate unique IDs
    const { data: gpkId } = await supabase.rpc('generate_gpk_id');
    const { data: referralCode } = await supabase.rpc('generate_referral_code');
    
    let sponsorId = null;
    
    // Find sponsor by referral code
    if (sponsorReferralCode) {
      const { data: sponsor } = await supabase
        .from('profiles')
        .select('id')
        .eq('referral_code', sponsorReferralCode)
        .single();
      
      if (sponsor) {
        sponsorId = sponsor.id;
      }
    }

    // Create profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: authUser.id,
        gpk_id: gpkId,
        name: authUser.user_metadata?.full_name || authUser.email.split('@')[0],
        email: authUser.email,
        referral_code: referralCode,
        sponsor_id: sponsorId,
      })
      .select()
      .single();

    if (profileError) throw profileError;

    // Create referral relationship if there's a sponsor
    if (sponsorId) {
      const { error: referralError } = await supabase
        .from('referrals')
        .insert({
          referrer_id: sponsorId,
          referred_id: authUser.id
        });
      
      if (referralError) throw referralError;
    }

    return profile;
  }

  static async getAdminConfig() {
    const { data, error } = await supabase
      .from('admin_config')
      .select('*')
      .limit(1)
      .single();
    
    if (error) throw error;
    return data;
  }

  static async getUserLevelQualification(userId: string) {
    const { data, error } = await supabase.rpc('get_user_level_qualification', {
      user_id: userId
    });
    
    if (error) throw error;
    return data;
  }

  static async getTeamStructure(userId: string, levels: number = 3) {
    // Recursive query to get team structure
    const { data, error } = await supabase
      .from('profiles')
      .select(`
        id, name, gpk_id, current_package, join_date, total_earnings,
        direct_referrals, team_size, is_active
      `)
      .eq('sponsor_id', userId);
    
    if (error) throw error;
    
    // For each direct referral, get their team if levels > 1
    if (levels > 1 && data.length > 0) {
      const teamData = await Promise.all(
        data.map(async (user) => {
          const subTeam = await this.getTeamStructure(user.id, levels - 1);
          return { ...user, team: subTeam };
        })
      );
      return teamData;
    }
    
    return data;
  }

  static async getIncomesSummary(userId: string) {
    const { data, error } = await supabase
      .from('incomes')
      .select('type, amount')
      .eq('user_id', userId);
    
    if (error) throw error;
    
    const summary = {
      total: 0,
      direct: 0,
      level: 0,
      global_royalty: 0,
      count: data.length
    };
    
    data.forEach(income => {
      summary.total += income.amount;
      summary[income.type] += income.amount;
    });
    
    return summary;
  }

  static async getTransactions(userId: string) {
    const { data, error } = await supabase
      .from('transactions')
      .select(`
        *,
        package:packages(name)
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data;
  }

  static async canUpgradeToPackage(userId: string, targetPackageId: string) {
    // Get user's current packages
    const userPackages = await this.getUserPackages(userId);
    const allPackages = await this.getPackages();
    
    // Find target package
    const targetPackage = allPackages.find(p => p.id === targetPackageId);
    if (!targetPackage) return { canUpgrade: false, reason: 'Package not found' };
    
    // Check if user already has this package
    const hasPackage = userPackages.some(up => up.package_id === targetPackageId);
    if (hasPackage) return { canUpgrade: false, reason: 'Already purchased' };
    
    // For step-by-step upgrade logic
    const packageOrder = ['starter', 'silver', 'gold', 'platinum', 'diamond'];
    const targetIndex = packageOrder.indexOf(targetPackageId);
    
    if (targetIndex === 0) {
      // Starter package - always can purchase
      return { canUpgrade: true };
    }
    
    // Check if user has the previous package
    const previousPackageId = packageOrder[targetIndex - 1];
    const hasPreviousPackage = userPackages.some(up => up.package_id === previousPackageId);
    
    if (!hasPreviousPackage) {
      return { 
        canUpgrade: false, 
        reason: `Must purchase ${previousPackageId} package first` 
      };
    }
    
    return { canUpgrade: true };
  }
}