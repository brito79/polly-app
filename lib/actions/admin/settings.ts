'use server';

import { createSupabaseServerClient } from '@/lib/supabase-server';
import { requireAdmin } from '@/lib/auth';
import { revalidatePath } from 'next/cache';

/**
 * Updates application settings in the database
 * 
 * @param key The settings key (e.g., 'email_validation', 'general', 'security')
 * @param value The settings value (as an object)
 */
export async function updateAppSettings(key: string, value: Record<string, unknown>) {
  try {
    // First, verify that the user is an admin
    await requireAdmin();
    
    const supabase = await createSupabaseServerClient();
    
    // Upsert the setting
    const { error } = await supabase
      .from('app_settings')
      .upsert({ key, value }, { onConflict: 'key' });
    
    if (error) {
      throw new Error(`Failed to update setting: ${error.message}`);
    }
    
    // Revalidate admin settings page
    revalidatePath('/admin/settings');
    
    return { success: true };
  } catch (error: unknown) {
    console.error('Error updating app settings:', error);
    if (error instanceof Error) {
      throw new Error(`Failed to update settings: ${error.message}`);
    } else {
      throw new Error('An unknown error occurred while updating settings');
    }
  }
}
/**
 * Retrieves all application settings
 */
export async function getAppSettings() {
  try {
    // First, verify that the user is an admin
    await requireAdmin();
    
    const supabase = await createSupabaseServerClient();
    
    const { data, error } = await supabase
      .from('app_settings')
      .select('key, value');
    
    if (error) {
      throw new Error(`Failed to get settings: ${error.message}`);
    }
    
    // Transform the settings into a more usable format
    const settings: Record<string, unknown> = {};
    
    data.forEach((setting: { key: string; value: unknown }) => {
      settings[setting.key] = setting.value;
    });
    
    return settings;
  } catch (error: unknown) {
    console.error('Error getting app settings:', error);
    if (error instanceof Error) {
      throw new Error(`Failed to get settings: ${error.message}`);
    } else {
      throw new Error('An unknown error occurred while getting settings');
    }
  }
}

// FormData-compatible Server Actions for Next.js Form component with useActionState

// Define the state type for useActionState
export type ActionState = {
  success: boolean;
  message?: string;
  errors?: Record<string, string>;
};

/**
 * Updates general application settings via FormData
 */
export async function updateGeneralSettings(
  prevState: ActionState | null, 
  formData: FormData
): Promise<ActionState> {
  try {
    await requireAdmin();
    
    // Validate form data
    const app_name = formData.get('app_name') as string;
    const max_polls_per_user = formData.get('max_polls_per_user') as string;
    const allow_anonymous_voting = formData.get('allow_anonymous_voting') as string;
    const default_poll_expiry_days = formData.get('default_poll_expiry_days') as string;
    
    const errors: Record<string, string> = {};
    
    if (!app_name || app_name.trim().length < 1) {
      errors.app_name = 'Application name is required';
    }
    
    if (!max_polls_per_user || isNaN(parseInt(max_polls_per_user))) {
      errors.max_polls_per_user = 'Valid number required';
    }
    
    if (!default_poll_expiry_days || isNaN(parseInt(default_poll_expiry_days))) {
      errors.default_poll_expiry_days = 'Valid number required';
    }
    
    if (Object.keys(errors).length > 0) {
      return {
        success: false,
        message: 'Please fix the validation errors',
        errors
      };
    }
    
    const generalSettings = {
      app_name: app_name.trim(),
      max_polls_per_user: parseInt(max_polls_per_user),
      allow_anonymous_voting: allow_anonymous_voting === 'true',
      default_poll_expiry_days: parseInt(default_poll_expiry_days),
    };
    
    await updateAppSettings('general', generalSettings);
    revalidatePath('/admin/settings');
    
    return { 
      success: true,
      message: 'General settings updated successfully!'
    };
  } catch (error: unknown) {
    console.error('Error updating general settings:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Failed to update general settings'
    };
  }
}

/**
 * Updates email validation settings via FormData
 */
export async function updateEmailSettings(
  prevState: ActionState | null,
  formData: FormData
): Promise<ActionState> {
  try {
    await requireAdmin();
    
    // Extract and validate form data
    const allowedDomainsString = formData.get('allowed_domains') as string;
    const block_disposable = formData.get('block_disposable') as string;
    const custom_regex = formData.get('custom_regex') as string;
    
    const errors: Record<string, string> = {};
    
    // Validate custom regex if provided
    if (custom_regex && custom_regex.trim()) {
      try {
        new RegExp(custom_regex);
      } catch {
        errors.custom_regex = 'Invalid regular expression format';
      }
    }
    
    if (Object.keys(errors).length > 0) {
      return {
        success: false,
        message: 'Please fix the validation errors',
        errors
      };
    }
    
    const allowedDomains = allowedDomainsString ? allowedDomainsString.split(',').map(d => d.trim()).filter(d => d) : [];
    
    const emailSettings = {
      allowed_domains: allowedDomains,
      block_disposable: block_disposable === 'true',
      custom_regex: custom_regex?.trim() || '',
    };
    
    await updateAppSettings('email_validation', emailSettings);
    revalidatePath('/admin/settings');
    
    return { 
      success: true,
      message: 'Email validation settings updated successfully!'
    };
  } catch (error: unknown) {
    console.error('Error updating email settings:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Failed to update email settings'
    };
  }
}

/**
 * Updates security settings via FormData
 */
export async function updateSecuritySettings(
  prevState: ActionState | null,
  formData: FormData
): Promise<ActionState> {
  try {
    await requireAdmin();
    
    // Extract and validate form data
    const require_email_verification = formData.get('require_email_verification') as string;
    const max_login_attempts = formData.get('max_login_attempts') as string;
    const lockout_duration_minutes = formData.get('lockout_duration_minutes') as string;
    const session_timeout_hours = formData.get('session_timeout_hours') as string;
    const enable_two_factor = formData.get('enable_two_factor') as string;
    
    const errors: Record<string, string> = {};
    
    // Validate numeric fields
    if (!max_login_attempts || isNaN(parseInt(max_login_attempts)) || parseInt(max_login_attempts) < 1) {
      errors.max_login_attempts = 'Valid number greater than 0 required';
    }
    
    if (!lockout_duration_minutes || isNaN(parseInt(lockout_duration_minutes)) || parseInt(lockout_duration_minutes) < 1) {
      errors.lockout_duration_minutes = 'Valid number greater than 0 required';
    }
    
    if (!session_timeout_hours || isNaN(parseInt(session_timeout_hours)) || parseInt(session_timeout_hours) < 1) {
      errors.session_timeout_hours = 'Valid number greater than 0 required';
    }
    
    if (Object.keys(errors).length > 0) {
      return {
        success: false,
        message: 'Please fix the validation errors',
        errors
      };
    }
    
    const securitySettings = {
      require_email_verification: require_email_verification === 'true',
      max_login_attempts: parseInt(max_login_attempts),
      lockout_duration_minutes: parseInt(lockout_duration_minutes),
      session_timeout_hours: parseInt(session_timeout_hours),
      enable_two_factor: enable_two_factor === 'true',
    };
    
    await updateAppSettings('security', securitySettings);
    revalidatePath('/admin/settings');
    
    return { 
      success: true,
      message: 'Security settings updated successfully!'
    };
  } catch (error: unknown) {
    console.error('Error updating security settings:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Failed to update security settings'
    };
  }
}