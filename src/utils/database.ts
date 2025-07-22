import { supabase } from '../lib/supabase';
import { AdminConfig, Income, Package, Transaction, User } from '../types';

// Helper function to generate GPK ID
export const generateGPKId = async (): Promise<string> => {
  const { data: users } = await supabase
    .from('profiles')
    .select('gpk_id')
    .order('created_at', { ascending: false })
    .limit(1);

  let nextId = 10001;
  if (users && users.length > 0) {
    const lastId = users[0].gpk_id;
    const lastNumber = parseInt(lastId.replace('GPK', ''));
    nextId = lastNumber + 1;
  }

  return `GPK${nextId}`;
};

// Helper function to generate referral code
export const generateReferralCode = (name: string): string => {
  const randomNum = Math.floor(Math.random() * 1000);
  return `${name.substring(0, 3).toUpperCase()}${randomNum}`;
};

// =====================
// ADMIN USER OPERATIONS
// =====================

export const createAdminUser = async (email: string, password: string): Promise<boolean> => {
  try {
    // Create auth user
    const { error: authError } = await supabase.auth.signUp({
      email,
      password,
    });

    if (authError) throw authError;

    // Create admin user record
    const { error: dbError } = await supabase
      .from('admin_users')
      .insert({
        email,
        is_super_admin: false,
        permissions: ['settings', 'users', 'transactions']
      });

    if (dbError) throw dbError;

    return true;
  } catch (error) {
    console.error('Error creating admin user:', error);
    return false;
  }
};

export const getAdminUser = async (email: string): Promise<any | null> => {
  const { data, error } = await supabase
    .from('admin_users')
    .select('*')
    .eq('email', email)
    .single();

  if (error || !data) return null;
  return data;
};

export const getAllAdminUsers = async (): Promise<any[]> => {
  const { data, error } = await supabase
    .from('admin_users')
    .select('*')
    .order('created_at', { ascending: false });

  if (error || !data) return [];
  return data;
};

export const updateAdminPassword = async (email: string, newPassword: string): Promise<boolean> => {
  try {
    // Update auth password
    const { error: authError } = await supabase.auth.updateUser({
      password: newPassword
    });

    if (authError) throw authError;

    // Update last password change date
    const { error: dbError } = await supabase
      .from('admin_users')
      .update({
        last_password_change: new Date().toISOString()
      })
      .eq('email', email);

    if (dbError) throw dbError;

    return true;
  } catch (error) {
    console.error('Error updating admin password:', error);
    return false;
  }
};

export const updateAdminPermissions = async (email: string, permissions: string[]): Promise<boolean> => {
  const { error } = await supabase
    .from('admin_users')
    .update({ permissions })
    .eq('email', email);

  if (error) {
    console.error('Error updating admin permissions:', error);
    return false;
  }
  return true;
};

// =====================
// ADMIN CONFIG OPERATIONS
// =====================

export const getAdminConfig = async (): Promise<AdminConfig | null> => {
  try {
    const { data, error } = await supabase
      .from('admin_config')
      .select('*')
      .single();

    if (error || !data) {
      // Create default config if none exists
      const defaultConfig = {
        deposit_wallet_address: '',
        direct_referral_percent: 10,
        level_income_percent: [5, 3, 2, 1, 1],
        binary_income_percent: 8,
        global_royalty_percent: 2,
        deposit_fee_percent: 2,
        withdrawal_fee_percent: 5,
        minimum_withdrawal: 50,
        minimum_deposit: 10,
        gpk_to_inr_price: 100
      };
      // Try to insert default config if table exists
      try {
      const { data: newConfig } = await supabase
        .from('admin_config')
        .insert(defaultConfig)
        .select()
        .single();
        if (newConfig) return mapDatabaseConfigToConfig(newConfig);
      } catch {}
      return mapDatabaseConfigToConfig(defaultConfig);
    }
    return mapDatabaseConfigToConfig(data);
  } catch (error) {
    // Removed debug log
    return null;
  }
};

export const updateAdminConfig = async (config: AdminConfig & { id?: string }): Promise<AdminConfig | null> => {
  try {
    console.log('updateAdminConfig received config:', config); // Debug log
    const { data, error } = await supabase
      .from('admin_config')
      .upsert({
        id: config.id, // Ensure the correct row is updated
        deposit_wallet_address: config.depositWalletAddress,
        direct_referral_percent: config.directReferralPercent,
        level_income_percent: config.levelIncomePercent,
        binary_income_percent: config.binaryIncomePercent,
        global_royalty_percent: config.globalRoyaltyPercent,
        deposit_fee_percent: config.depositFeePercent,
        withdrawal_fee_percent: config.withdrawalFeePercent,
        minimum_withdrawal: config.minimumWithdrawal,
        minimum_deposit: config.minimumDeposit,
        gpk_to_inr_price: config.gpkToInrPrice
      })
      .select()
      .single();
    console.log('upsert result:', { data, error }); // Debug log
    if (error) throw error;
    return mapDatabaseConfigToConfig(data);
  } catch (error) {
    console.error('Error updating admin config:', error);
    return null;
  }
};

// =====================
// USER OPERATIONS
// =====================

export const createUser = async (userData: any): Promise<User | null> => {
  const { data, error } = await supabase
    .from('profiles')
    .insert({
      gpk_id: userData.gpk_id,
      name: userData.name,
      email: userData.email,
      phone: userData.phone,
      referral_code: userData.referral_code,
      sponsor_id: userData.sponsor_id || null,
      is_active: userData.is_active,
      wallet_address: userData.wallet_address,
      right_count: 0
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating user:', error);
    return null;
  }

  return mapDatabaseUserToUser(data);
};

export const getUserByEmail = async (email: string): Promise<User | null> => {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('email', email)
    .single();

  if (error || !data) return null;
  return mapDatabaseUserToUser(data);
};

export const getUserById = async (id: string): Promise<User | null> => {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !data) return null;
  return mapDatabaseUserToUser(data);
};

export const getUserByReferralCode = async (referralCode: string): Promise<User | null> => {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('referral_code', referralCode)
    .single();

  if (error || !data) return null;
  return mapDatabaseUserToUser(data);
};

export const getAllUsers = async (): Promise<User[]> => {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching users:', error.message);
    return [];
  }
  return Array.isArray(data) ? data : [];
};

// Helper to fetch an admin user by email (for testing/admin login)
export const getAdminUserByEmail = async (email: string): Promise<User | null> => {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('email', email)
    .eq('is_admin', true)
    .maybeSingle();
  if (error) {
    console.error('Error fetching admin user:', error.message);
    return null;
  }
  return data || null;
};

export const updateUser = async (id: string, updates: any): Promise<User | null> => {
  // Only include fields that are actually being updated and are not undefined or null
  const updatePayload: any = {};
  const allowedFields = [
    'gpk_id', 'name', 'email', 'phone', 'referral_code', 'sponsor_id',
    'wallet_address', 'transaction_password', 'package_id', 'is_active',
    'is_admin', 'right_count', 'total_earnings', 'wallet_balance'
  ];
  Object.keys(updates).forEach((key) => {
    if (updates[key] !== undefined && updates[key] !== null && allowedFields.includes(key)) {
      updatePayload[key] = updates[key];
    }
  });

  const { data, error } = await supabase
    .from('profiles')
    .update(updatePayload)
    .eq('id', id)
    .select()
    .single();

  if (error || !data) {
    console.error('Supabase updateUser error:', error);
    return null;
  }
  return mapDatabaseUserToUser(data);
};

// =====================
// PACKAGE OPERATIONS
// =====================

export const getAllPackages = async (): Promise<Package[]> => {
  const { data, error } = await supabase
    .from('packages')
    .select('*')
    .eq('is_active', true)
    .order('price', { ascending: true });

  if (error || !data) return [];
  return data.map(mapDatabasePackageToPackage);
};

export const getPackageById = async (id: string): Promise<Package | null> => {
  const { data, error } = await supabase
    .from('packages')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !data) return null;
  return mapDatabasePackageToPackage(data);
};

// =====================
// INCOME OPERATIONS
// =====================

export const createIncome = async (incomeData: Omit<Income, 'id'>): Promise<Income | null> => {
  const { data, error } = await supabase
    .from('incomes')
    .insert({
      user_id: incomeData.user_id,
      amount: incomeData.amount,
      date: incomeData.date
    })
    .select()
    .single();
  if (error || !data) {
    return null;
  }
  return data as Income;
};

export const getUserIncomes = async (userId: string): Promise<Income[]> => {
  const { data, error } = await supabase
    .from('incomes')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error || !data) return [];
  return data.map(mapDatabaseIncomeToIncome);
};

export const getAllIncomes = async (): Promise<Income[]> => {
  const { data, error } = await supabase
    .from('incomes')
    .select('*')
    .order('created_at', { ascending: false });

  if (error || !data) return [];
  return data.map(mapDatabaseIncomeToIncome);
};

// =====================
// TRANSACTION OPERATIONS
// =====================

export const createTransaction = async (transactionData: Omit<Transaction, 'id' | 'created_at' | 'updated_at'>): Promise<Transaction | null> => {
  // Ensure type and status are valid
  const allowedTypes = ['deposit', 'withdrawal', 'upgrade'];
  const allowedStatuses = ['pending', 'verified', 'rejected', 'completed'];
  const type = allowedTypes.includes(transactionData.type) ? transactionData.type : 'deposit';
  const status = allowedStatuses.includes(transactionData.status) ? transactionData.status : 'pending';

  const { data, error } = await supabase
    .from('transactions')
    .insert({
      user_id: transactionData.user_id,
      type,
      amount: transactionData.amount,
      tx_hash: transactionData.tx_hash || null,
      wallet_address: transactionData.wallet_address || null,
      status,
      admin_fee: transactionData.admin_fee ?? 0,
      reference_id: transactionData.reference_id || null,
      date: transactionData.date
    })
    .select()
    .single();
  if (error || !data) {
    console.error('Supabase createTransaction error:', error);
    return null;
  }
  return data as Transaction;
};

export const getUserTransactions = async (userId: string): Promise<Transaction[]> => {
  const { data, error } = await supabase
    .from('transactions')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error || !data) return [];
  return data.map(mapDatabaseTransactionToTransaction);
};

export const getAllTransactions = async (): Promise<Transaction[]> => {
  const { data, error } = await supabase
    .from('transactions')
    .select('*')
    .order('created_at', { ascending: false });

  if (error || !data) return [];
  return data.map(mapDatabaseTransactionToTransaction);
};

export const updateTransaction = async (id: string, updates: Partial<Transaction>): Promise<Transaction | null> => {
  const { data, error } = await supabase
    .from('transactions')
    .update({
      status: updates.status,
      tx_hash: updates.tx_hash,
      wallet_address: updates.wallet_address
    })
    .eq('id', id)
    .select()
    .single();

  if (error || !data) return null;
  return mapDatabaseTransactionToTransaction(data);
};

// =====================
// MAPPING FUNCTIONS
// =====================

const mapDatabaseUserToUser = (dbUser: any): User => ({
  id: dbUser.id,
  gpk_id: dbUser.gpk_id,
  name: dbUser.name,
  email: dbUser.email,
  phone: dbUser.phone,
  referral_code: dbUser.referral_code,
  sponsor_id: dbUser.sponsor_id,
  wallet_address: dbUser.wallet_address,
  transaction_password: dbUser.transaction_password,
  package_id: dbUser.package_id,
  is_active: dbUser.is_active,
  is_admin: dbUser.is_admin, // <-- Add this line
  join_date: typeof dbUser.created_at === 'string' ? dbUser.created_at : new Date(dbUser.created_at).toISOString(),
  right_count: dbUser.right_count || 0,
  total_earnings: dbUser.total_earnings || 0,
  wallet_balance: dbUser.wallet_balance || 0,
  created_at: typeof dbUser.created_at === 'string' ? dbUser.created_at : new Date(dbUser.created_at).toISOString(),
  updated_at: typeof dbUser.updated_at === 'string' ? dbUser.updated_at : new Date(dbUser.updated_at).toISOString()
});

const mapDatabasePackageToPackage = (dbPackage: any): Package => ({
  id: dbPackage.id,
  name: dbPackage.name,
  price: dbPackage.price,
  roi: dbPackage.roi,
  benefits: dbPackage.benefits,
  description: dbPackage.description,
  isActive: dbPackage.is_active
});

const mapDatabaseIncomeToIncome = (dbIncome: any): Income => ({
  id: dbIncome.id,
  user_id: dbIncome.user_id,
  amount: dbIncome.amount,
  date: typeof dbIncome.date === 'string' ? dbIncome.date : new Date(dbIncome.date).toISOString()
});

const mapDatabaseTransactionToTransaction = (dbTransaction: any): Transaction => ({
  id: dbTransaction.id,
  user_id: dbTransaction.user_id,
  type: dbTransaction.type,
  amount: dbTransaction.amount,
  tx_hash: dbTransaction.tx_hash,
  wallet_address: dbTransaction.wallet_address,
  status: dbTransaction.status,
  admin_fee: dbTransaction.admin_fee || 0,
  reference_id: dbTransaction.reference_id,
  date: typeof dbTransaction.date === 'string' ? dbTransaction.date : new Date(dbTransaction.date).toISOString(),
  created_at: typeof dbTransaction.created_at === 'string' ? dbTransaction.created_at : new Date(dbTransaction.created_at).toISOString(),
  updated_at: typeof dbTransaction.updated_at === 'string' ? dbTransaction.updated_at : new Date(dbTransaction.updated_at).toISOString(),
  description: dbTransaction.description
});

const mapDatabaseConfigToConfig = (dbConfig: any): AdminConfig & { id?: string } => ({
  depositWalletAddress: dbConfig.deposit_wallet_address,
  directReferralPercent: dbConfig.direct_referral_percent,
  levelIncomePercent: dbConfig.level_income_percent,
  binaryIncomePercent: dbConfig.binary_income_percent,
  globalRoyaltyPercent: dbConfig.global_royalty_percent,
  depositFeePercent: dbConfig.deposit_fee_percent,
  withdrawalFeePercent: dbConfig.withdrawal_fee_percent,
  minimumWithdrawal: dbConfig.minimum_withdrawal,
  minimumDeposit: dbConfig.minimum_deposit,
  gpkToInrPrice: dbConfig.gpk_to_inr_price || 100,
  id: dbConfig.id
});

// =====================
// AUTH HELPER FUNCTIONS
// =====================

export const adminLogin = async (email: string, password: string): Promise<boolean> => {
  try {
    // First check if user is an admin
    const adminUser = await getAdminUser(email);
    if (!adminUser) return false;

    // Then authenticate with Supabase
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) throw error;

    // Update last login
    await supabase
      .from('admin_users')
      .update({ last_login: new Date().toISOString() })
      .eq('email', email);

    return true;
  } catch (error) {
    console.error('Admin login error:', error);
    return false;
  }
};

export const isAdmin = async (email: string): Promise<boolean> => {
  try {
    const adminUser = await getAdminUser(email);
    return !!adminUser;
  } catch (error) {
    console.error('Error checking admin status:', error);
    return false;
  }
};

export const getUserNotifications = async (userId: string) => {
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(10);
  if (error) {
    console.error('Error fetching notifications:', error);
    return [];
  }
  return data;
};