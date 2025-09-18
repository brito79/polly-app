'use client';

import { useState, useActionState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { updateGeneralSettings, type ActionState } from '@/lib/actions/admin/settings';
import { Save } from 'lucide-react';
import { toast } from 'react-toastify';
import Form from 'next/form';

interface GeneralSettings {
  app_name: string;
  max_polls_per_user: number;
  allow_anonymous_voting: boolean;
  default_poll_expiry_days: number;
}

export function GeneralSettingsForm({ initialSettings }: { initialSettings?: GeneralSettings }) {
  const [settings, setSettings] = useState<GeneralSettings>(initialSettings || {
    app_name: 'Polling App',
    max_polls_per_user: 50,
    allow_anonymous_voting: true,
    default_poll_expiry_days: 30,
  });
  
  // Use useActionState for form handling
  const [state, formAction, isPending] = useActionState<ActionState | null, FormData>(
    updateGeneralSettings,
    null
  );
  
  // Handle state changes and show notifications
  useEffect(() => {
    if (state?.success) {
      toast.success(state.message || 'General settings updated successfully!');
    } else if (state?.success === false) {
      toast.error(state.message || 'Failed to update general settings');
    }
  }, [state]);
  
  // Enhanced form action to include current state values
  const handleFormAction = (formData: FormData) => {
    // Set form data with current state values to ensure latest state is sent
    formData.set('app_name', settings.app_name);
    formData.set('max_polls_per_user', settings.max_polls_per_user.toString());
    formData.set('allow_anonymous_voting', settings.allow_anonymous_voting.toString());
    formData.set('default_poll_expiry_days', settings.default_poll_expiry_days.toString());
    
    formAction(formData);
  };
  
  return (
    <Form action={handleFormAction} className="space-y-6">
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="app_name">Application Name</Label>
          <Input 
            id="app_name"
            name="app_name"
            value={settings.app_name}
            onChange={(e) => setSettings({ ...settings, app_name: e.target.value })}
            placeholder="Polling App"
            required
            aria-invalid={state?.errors?.app_name ? 'true' : 'false'}
          />
          {state?.errors?.app_name && (
            <p className="text-sm text-red-600">{state.errors.app_name}</p>
          )}
          <p className="text-sm text-gray-500">
            The name of your application as it appears to users.
          </p>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="max_polls_per_user">Maximum Polls Per User</Label>
          <Input 
            id="max_polls_per_user"
            name="max_polls_per_user"
            type="number"
            min="1"
            max="1000"
            value={settings.max_polls_per_user}
            onChange={(e) => setSettings({ 
              ...settings, 
              max_polls_per_user: parseInt(e.target.value) || 50 
            })}
            required
            aria-invalid={state?.errors?.max_polls_per_user ? 'true' : 'false'}
          />
          {state?.errors?.max_polls_per_user && (
            <p className="text-sm text-red-600">{state.errors.max_polls_per_user}</p>
          )}
          <p className="text-sm text-gray-500">
            Maximum number of polls a single user can create.
          </p>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="default_poll_expiry_days">Default Poll Expiry (Days)</Label>
          <Input 
            id="default_poll_expiry_days"
            name="default_poll_expiry_days"
            type="number"
            min="1"
            max="365"
            value={settings.default_poll_expiry_days}
            onChange={(e) => setSettings({ 
              ...settings, 
              default_poll_expiry_days: parseInt(e.target.value) || 30 
            })}
            required
            aria-invalid={state?.errors?.default_poll_expiry_days ? 'true' : 'false'}
          />
          {state?.errors?.default_poll_expiry_days && (
            <p className="text-sm text-red-600">{state.errors.default_poll_expiry_days}</p>
          )}
          <p className="text-sm text-gray-500">
            Default number of days until a poll expires after creation.
          </p>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="allow_anonymous_voting" className="flex items-center gap-2">
            <span>Allow Anonymous Voting</span>
          </Label>
          <div className="flex items-center gap-2">
            <Switch 
              id="allow_anonymous_voting"
              name="allow_anonymous_voting"
              checked={settings.allow_anonymous_voting}
              onCheckedChange={(checked) => {
                setSettings({ ...settings, allow_anonymous_voting: checked });
              }}
            />
            <span className="text-sm text-gray-500">
              {settings.allow_anonymous_voting ? 'Enabled' : 'Disabled'}
            </span>
          </div>
          <p className="text-sm text-gray-500 mt-1">
            When enabled, users can vote without signing in. IP addresses are used to prevent duplicate votes.
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