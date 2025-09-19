/* eslint-disable @typescript-eslint/no-explicit-any */
'use server';


import { createSupabaseServerClient } from '@/lib/supabase-server';
import { requireAdmin } from '@/lib/auth';
import { revalidatePath } from 'next/cache';

/**
 * Updates a user's role
 * @param userId - The user ID to update
 * @param role - The new role to assign (admin or user)
 * @returns Success or error message
 */
export async function updateUserRole(userId: string, role: 'admin' | 'user') {
  try {
    // Ensure the current user is admin
    await requireAdmin();
    
    const supabase = await createSupabaseServerClient();
    
    // Update the user's role
    const { error } = await supabase
      .from('profiles')
      .update({ role })
      .eq('user_id', userId);
    
    if (error) {
      console.error('Error updating user role:', error);
      return { success: false, error: error.message };
    }
    
    // Revalidate the users page to reflect changes
    revalidatePath('/admin/users');
    
    return { success: true };
  } catch (error: any) {
    console.error('Error in updateUserRole:', error);
    return { 
      success: false, 
      error: error.message || 'An error occurred updating the user role' 
    };
  }
}

/**
 * Deletes a user account
 * @param userId - The user ID to delete
 * @returns Success or error message
 */
export async function deleteUser(userId: string) {
  try {
    // Ensure the current user is admin
    await requireAdmin();
    
    const supabase = await createSupabaseServerClient();
    
    // In a real app, you might want to:
    // 1. Delete user data from other tables first (polls, votes, etc.)
    // 2. Archive user data instead of permanent deletion
    // 3. Handle auth table deletion separately
    
    // Delete the user profile
    const { error } = await supabase
      .from('profiles')
      .delete()
      .eq('user_id', userId);
    
    if (error) {
      console.error('Error deleting user:', error);
      return { success: false, error: error.message };
    }
    
    // Revalidate the users page to reflect changes
    revalidatePath('/admin/users');
    
    return { success: true };
  } catch (error: any) {
    console.error('Error in deleteUser:', error);
    return { 
      success: false, 
      error: error.message || 'An error occurred deleting the user account' 
    };
  }
}