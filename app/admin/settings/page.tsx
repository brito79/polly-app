import { createSupabaseServerClient } from '@/lib/supabase-server';
import { requireAdmin } from '@/lib/auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Settings, Mail, Shield, Cog } from 'lucide-react';

export const dynamic = 'force-dynamic';

interface Settings {
  [key: string]: unknown;
  email_validation?: {
    allowed_domains: string[];
    block_disposable: boolean;
    custom_regex?: string;
  };
  general?: {
    app_name: string;
    max_polls_per_user: number;
    allow_anonymous_voting: boolean;
    default_poll_expiry_days: number;
  };
  security?: {
    min_password_length: number;
    require_password_complexity: boolean;
    max_login_attempts: number;
    enable_two_factor: boolean;
  };
}

interface SettingRow {
  key: string;
  value: unknown;
}

export default async function AdminSettingsPage() {
  // This will redirect if not admin
  await requireAdmin();
  
  // Get app settings
  const supabase = await createSupabaseServerClient();
  
  const { data: settingsData } = await supabase
    .from('app_settings')
    .select('key, value');
  
  // Transform the settings data to a more usable format
  const settings: Settings = {};
  
  settingsData?.forEach((setting: SettingRow) => {
    settings[setting.key] = setting.value;
  });
  
  // If there's no email_validation setting yet, create a default
  if (!settings.email_validation) {
    settings.email_validation = {
      allowed_domains: [],
      block_disposable: true,
    };
  }
  
  // If there's no general settings yet, create defaults
  if (!settings.general) {
    settings.general = {
      app_name: 'Polling App',
      max_polls_per_user: 50,
      allow_anonymous_voting: true,
      default_poll_expiry_days: 30,
    };
  }
  
  // If there's no security settings yet, create defaults
  if (!settings.security) {
    settings.security = {
      min_password_length: 8,
      require_password_complexity: true,
      max_login_attempts: 5,
      enable_two_factor: false,
    };
  }
  
  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Application Settings</h1>
      </div>
      
      <p className="text-gray-500 mb-6">
        Configure application settings, email validation rules, and security policies.
      </p>
      
      <div className="grid gap-6">
        {/* General Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Cog className="h-5 w-5" />
              General Settings
            </CardTitle>
            <CardDescription>
              Configure basic application settings and defaults.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="font-medium">Application Name</p>
                <p className="text-gray-500">{settings.general?.app_name}</p>
              </div>
              <div>
                <p className="font-medium">Max Polls Per User</p>
                <p className="text-gray-500">{settings.general?.max_polls_per_user}</p>
              </div>
              <div>
                <p className="font-medium">Anonymous Voting</p>
                <p className="text-gray-500">{settings.general?.allow_anonymous_voting ? 'Enabled' : 'Disabled'}</p>
              </div>
              <div>
                <p className="font-medium">Default Poll Expiry</p>
                <p className="text-gray-500">{settings.general?.default_poll_expiry_days} days</p>
              </div>
            </div>
            <Button variant="outline" className="mt-4">
              <Settings className="h-4 w-4 mr-2" />
              Edit General Settings
            </Button>
          </CardContent>
        </Card>

        {/* Email Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Email Validation Rules
            </CardTitle>
            <CardDescription>
              Configure which email addresses are allowed for registration.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="font-medium">Block Disposable Emails</p>
                <p className="text-gray-500">{settings.email_validation?.block_disposable ? 'Enabled' : 'Disabled'}</p>
              </div>
              <div>
                <p className="font-medium">Allowed Domains</p>
                <p className="text-gray-500">
                  {settings.email_validation?.allowed_domains.length || 0} domains
                </p>
              </div>
            </div>
            <Button variant="outline" className="mt-4">
              <Mail className="h-4 w-4 mr-2" />
              Edit Email Rules
            </Button>
          </CardContent>
        </Card>

        {/* Security Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Security Settings
            </CardTitle>
            <CardDescription>
              Configure security policies and password requirements.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="font-medium">Min Password Length</p>
                <p className="text-gray-500">{settings.security?.min_password_length} characters</p>
              </div>
              <div>
                <p className="font-medium">Password Complexity</p>
                <p className="text-gray-500">{settings.security?.require_password_complexity ? 'Required' : 'Optional'}</p>
              </div>
              <div>
                <p className="font-medium">Max Login Attempts</p>
                <p className="text-gray-500">{settings.security?.max_login_attempts}</p>
              </div>
              <div>
                <p className="font-medium">Two-Factor Auth</p>
                <p className="text-gray-500">{settings.security?.enable_two_factor ? 'Enabled' : 'Disabled'}</p>
              </div>
            </div>
            <Button variant="outline" className="mt-4">
              <Shield className="h-4 w-4 mr-2" />
              Edit Security Settings
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}