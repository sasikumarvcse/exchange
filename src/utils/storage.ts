// src/utils/storage.ts
import { supabase } from '../lib/supabase';
import { User, Income } from '../types';

export const storage = {
  // ✅ Get all users
  getUsers: async (): Promise<User[]> => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching users:', error.message);
        return [];
      }

      return Array.isArray(data) ? data : [];
    } catch (error) {
      console.error('Unexpected error fetching users:', error);
      return [];
    }
  },

  // ✅ Get a single user by ID
  getUser: async (id: string): Promise<User | null> => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        console.error('Error fetching user by ID:', error.message);
        return null;
      }

      return data || null;
    } catch (error) {
      console.error('Unexpected error fetching user:', error);
      return null;
    }
  },

  // ✅ Update a user
  updateUser: async (user: Partial<User>): Promise<User | null> => {
    if (!user.id) {
      console.error('Missing user ID for update.');
      return null;
    }

    try {
      const { data, error } = await supabase
        .from('users')
        .update(user)
        .eq('id', user.id)
        .select()
        .single();

      if (error) {
        console.error('Error updating user:', error.message);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Unexpected error updating user:', error);
      return null;
    }
  },

  // Add getIncomes: async () => { ... } to fetch incomes from Supabase
  getIncomes: async (): Promise<Income[]> => {
    try {
      const { data, error } = await supabase
        .from('incomes')
        .select('*')
        .order('date', { ascending: false });
      if (error) {
        console.error('Error fetching incomes:', error.message);
        return [];
      }
      return Array.isArray(data) ? data : [];
    } catch (error) {
      console.error('Unexpected error fetching incomes:', error);
      return [];
    }
  },
};
