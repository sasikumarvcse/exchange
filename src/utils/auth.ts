import { supabase } from '../lib/supabase';
import { User } from '../types';

/**
 * Signs up a new user with email, password, and additional user data
 */
export const signUp = async (email: string, password: string, userData: Partial<User>): Promise<User> => {
  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: userData,
      },
    });

    if (error || !data.user) {
      throw error || new Error('Signup failed');
    }

    // Create user record in the database
    const { data: createdUser, error: dbError } = await supabase
      .from('profiles')
      .insert({
        email,
        ...userData,
        auth_id: data.user.id,
      })
      .select('*')
      .single();

    if (dbError || !createdUser) {
      // Rollback: delete the auth user if database creation fails
      await supabase.auth.admin.deleteUser(data.user.id);
      throw dbError || new Error('User creation failed');
    }

    const user = mapSupabaseUserToUser(createdUser);
    setCurrentUser(user);
    return user;
  } catch (error) {
    console.error('Signup error:', error);
    throw error;
  }
};

/**
 * Signs in a user with email and password
 */
export const signIn = async (email: string, password: string): Promise<User> => {
  try {
    // 1. Authenticate with Supabase
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError || !authData.user) {
      throw authError || new Error('Authentication failed');
    }

    // 2. Fetch full user data from database
    const { data: userData, error: userError } = await supabase
      .from('profiles')
      .select('*')
      .eq('email', email)
      .single();

    if (userError || !userData) {
      await supabase.auth.signOut();
      throw userError || new Error('User data not found');
    }

    const user = mapSupabaseUserToUser(userData);
    setCurrentUser(user);
    return user;
  } catch (error) {
    console.error('Login error:', error);
    throw error;
  }
};

/**
 * Signs out the current user
 */
export const signOut = async (): Promise<void> => {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    localStorage.removeItem('currentUser');
  } catch (error) {
    console.error('Logout error:', error);
    throw error;
  }
};

/**
 * Checks if a user is authenticated
 */
export const isAuthenticated = async (): Promise<boolean> => {
  try {
    const { data, error } = await supabase.auth.getSession();
    if (error) throw error;
    return !!data.session;
  } catch (error) {
    console.error('Session check error:', error);
    return false;
  }
};

/**
 * Verifies the current session and returns the user if valid
 */
export const verifySession = async (): Promise<User | null> => {
  try {
    // First check localStorage for admin user
    const currentUser = getCurrentUser();
    if (currentUser?.email === 'admin@growwpark.com') {
      return currentUser;
    }

    // Normal user flow
    const { data: { user: authUser }, error } = await supabase.auth.getUser();
    
    if (error || !authUser) {
      localStorage.removeItem('currentUser');
      return null;
    }

    // If we already have the current user and it matches, return it
    if (currentUser?.email === authUser.email) {
      return currentUser;
    }

    // Fetch fresh user data from database
    const { data: userData, error: userError } = await supabase
      .from('profiles')
      .select('*')
      .eq('email', authUser.email)
      .single();

    if (userError || !userData) {
      localStorage.removeItem('currentUser');
      return null;
    }

    const user = mapSupabaseUserToUser(userData);
    setCurrentUser(user);
    return user;
  } catch (error) {
    console.error('Session verification error:', error);
    return null;
  }
};

/**
 * Gets the current user from localStorage
 */
export const getCurrentUser = (): User | null => {
  const userStr = localStorage.getItem('currentUser');
  if (!userStr) return null;

  try {
    const user = JSON.parse(userStr);
    // Validate basic user structure
    if (user && typeof user === 'object' && user.email) {
      return user;
    }
    return null;
  } catch (error) {
    console.error('Error parsing user data:', error);
    return null;
  }
};

/**
 * Sets the current user in localStorage
 */
export const setCurrentUser = (user: User): void => {
  localStorage.setItem('currentUser', JSON.stringify(user));
};

/**
 * Logs out the current user
 */
export const logout = async (): Promise<void> => {
  try {
    localStorage.removeItem('currentUser');
    await signOut();
  } catch (error) {
    console.error('Logout error:', error);
    throw error;
  }
};

/**
 * Checks if the current user is an admin
 */
export const isAdmin = async (): Promise<boolean> => {
  const user = getCurrentUser();
  if (!user) {
    console.log('No current user found');
    return false;
  }
  
  console.log('Checking admin status for user:', user.email);
  
  // Check email first (for backward compatibility)
  if (user.email === 'admin@growwpark.com') {
    console.log('User is admin by email check');
    return true;
  }
  
  // Also check the is_admin field in the database
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('is_admin, is_active')
      .eq('id', user.id)
      .single();
    
    if (error) {
      console.error('Error checking admin status:', error);
      return false;
    }
    
    if (!data) {
      console.log('User not found in profiles table');
      return false;
    }
    
    console.log('User admin status from database:', { is_admin: data.is_admin, is_active: data.is_active });
    return data.is_admin === true && data.is_active === true;
  } catch (error) {
    console.error('Error checking admin status:', error);
    return false;
  }
};

/**
 * Debug function to check current user details and admin status
 */
export const debugUserStatus = async (): Promise<void> => {
  const user = getCurrentUser();
  console.log('=== User Status Debug ===');
  console.log('Current user from localStorage:', user);
  
  if (!user) {
    console.log('No user found in localStorage');
    return;
  }
  
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();
    
    if (error) {
      console.error('Error fetching user profile:', error);
      return;
    }
    
    console.log('User profile from database:', data);
    console.log('Admin check result:', await isAdmin());
  } catch (error) {
    console.error('Error in debug function:', error);
  }
};

/**
 * Helper function to map Supabase user data to our User type
 */
const mapSupabaseUserToUser = (userData: any): User => {
  return {
    id: userData.id,
    gpk_id: userData.gpk_id,
    name: userData.name,
    email: userData.email,
    phone: userData.phone,
    referral_code: userData.referral_code,
    sponsor_id: userData.sponsor_id,
    wallet_address: userData.wallet_address,
    transaction_password: userData.transaction_password,
    package_id: userData.package_id,
    is_active: userData.is_active,
    join_date: userData.join_date,
    right_count: userData.right_count,
    total_earnings: userData.total_earnings,
    wallet_balance: userData.wallet_balance,
    created_at: userData.created_at,
    updated_at: userData.updated_at,
    // Add any additional fields from your User type
  };
};