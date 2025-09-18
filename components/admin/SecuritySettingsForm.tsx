'use client';

import { useState, useActionState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { updateSecuritySettings, type ActionState } from '@/lib/actions/admin/settings';
import { Save } from 'lucide-react';
import { toast } from 'react-toastify';
import Form from 'next/form';

interface SecuritySettings {
  require_email_verification: boolean;
  max_login_attempts: number;
  lockout_duration_minutes: number;
  session_timeout_hours: number;
  enable_two_factor: boolean;
}

export function SecuritySettingsForm({ initialSettings }: { initialSettings?: SecuritySettings }) {
  const [settings, setSettings] = useState<SecuritySettings>(initialSettings || {
    require_email_verification: true,
    max_login_attempts: 5,
    lockout_duration_minutes: 30,
    session_timeout_hours: 24,
    enable_two_factor: false,
  });
  
  // Use useActionState for form handling
  const [state, formAction, isPending] = useActionState<ActionState | null, FormData>(
    updateSecuritySettings,
    null
  );
  
  // Handle state changes and show notifications
  useEffect(() => {
    if (state?.success) {
      toast.success(state.message || 'Security settings updated successfully!');
    } else if (state?.success === false) {
      toast.error(state.message || 'Failed to update security settings');
    }
  }, [state]);
  
  // Enhanced form action to include current state values
  const handleFormAction = (formData: FormData) => {
    // Set form data with current state values
    formData.set('require_email_verification', settings.require_email_verification.toString());
    formData.set('max_login_attempts', settings.max_login_attempts.toString());
    formData.set('lockout_duration_minutes', settings.lockout_duration_minutes.toString());
    formData.set('session_timeout_hours', settings.session_timeout_hours.toString());
    formData.set('enable_two_factor', settings.enable_two_factor.toString());
    
    formAction(formData);
  };
  
  return (
    <Form action={handleFormAction} className="space-y-6">
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="require_email_verification" className="flex items-center gap-2">
            <span>Require Email Verification</span>
          </Label>
          <div className="flex items-center gap-2">
            <Switch 
              id="require_email_verification"
              name="require_email_verification"
              checked={settings.require_email_verification}
              onCheckedChange={(checked) => {
                setSettings({ ...settings, require_email_verification: checked });
              }}
            />
            <span className="text-sm text-gray-500">
              {settings.require_email_verification ? 'Enabled' : 'Disabled'}
            </span>
          </div>
          <p className="text-sm text-gray-500 mt-1">
            When enabled, users must verify their email address before accessing the platform.
          </p>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="max_login_attempts">Maximum Login Attempts</Label>
          <Input 
            id="max_login_attempts"
            name="max_login_attempts"
            type="number"
            min="1"
            max="10"
            value={settings.max_login_attempts}
            onChange={(e) => setSettings({ 
              ...settings, 
              max_login_attempts: parseInt(e.target.value) || 5
            })}
            required
            aria-invalid={state?.errors?.max_login_attempts ? 'true' : 'false'}
          />
          {state?.errors?.max_login_attempts && (
            <p className="text-sm text-red-600">{state.errors.max_login_attempts}</p>
          )}
          <p className="text-sm text-gray-500">
            Number of failed login attempts before an account is temporarily locked.
          </p>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="lockout_duration_minutes">Lockout Duration (Minutes)</Label>
          <Input 
            id="lockout_duration_minutes"
            name="lockout_duration_minutes"
            type="number"
            min="5"
            max="1440"
            value={settings.lockout_duration_minutes}
            onChange={(e) => setSettings({ 
              ...settings, 
              lockout_duration_minutes: parseInt(e.target.value) || 30
            })}
            required
            aria-invalid={state?.errors?.lockout_duration_minutes ? 'true' : 'false'}
          />
          {state?.errors?.lockout_duration_minutes && (
            <p className="text-sm text-red-600">{state.errors.lockout_duration_minutes}</p>
          )}
          <p className="text-sm text-gray-500">
            How long (in minutes) an account remains locked after exceeding login attempts.
          </p>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="session_timeout_hours">Session Timeout (Hours)</Label>
          <Input 
            id="session_timeout_hours"
            name="session_timeout_hours"
            type="number"
            min="1"
            max="168"
            value={settings.session_timeout_hours}
            onChange={(e) => setSettings({ 
              ...settings, 
              session_timeout_hours: parseInt(e.target.value) || 24
            })}
            required
            aria-invalid={state?.errors?.session_timeout_hours ? 'true' : 'false'}
          />
          {state?.errors?.session_timeout_hours && (
            <p className="text-sm text-red-600">{state.errors.session_timeout_hours}</p>
          )}
          <p className="text-sm text-gray-500">
            How long (in hours) a user session remains active before requiring re-authentication.
          </p>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="enable_two_factor" className="flex items-center gap-2">
            <span>Two-Factor Authentication</span>
          </Label>
          <div className="flex items-center gap-2">
            <Switch 
              id="enable_two_factor"
              name="enable_two_factor"
              checked={settings.enable_two_factor}
              onCheckedChange={(checked) => {
                setSettings({ ...settings, enable_two_factor: checked });
              }}
            />
            <span className="text-sm text-gray-500">
              {settings.enable_two_factor ? 'Enabled' : 'Disabled'}
            </span>
          </div>
          <p className="text-sm text-gray-500 mt-1">
            When enabled, users can set up two-factor authentication for their accounts.
          </p>
        </div>
      </div>
      
      <Button type="submit" disabled={isPending} className="flex gap-2">
        <Save className="h-4 w-4" />
        {isPending ? 'Saving...' : 'Save Changes'}
      </Button>
    </Form>
  );
}