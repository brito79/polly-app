'use client';

import { useState, useActionState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { updateEmailSettings, type ActionState } from '@/lib/actions/admin/settings';
import { Plus, Save, X } from 'lucide-react';
import { toast } from 'react-toastify';
import Form from 'next/form';


interface EmailSettings {
  allowed_domains: string[];
  block_disposable: boolean;
  custom_regex?: string;
}

export function EmailSettingsForm({ initialSettings }: { initialSettings?: EmailSettings }) {
  const [settings, setSettings] = useState<EmailSettings>(initialSettings || {
    allowed_domains: [],
    block_disposable: true,
    custom_regex: '',
  });
  
  const [newDomain, setNewDomain] = useState('');
  
  // Use useActionState for form handling
  const [state, formAction, isPending] = useActionState<ActionState | null, FormData>(
    updateEmailSettings,
    null
  );
  
  // Handle state changes and show notifications
  useEffect(() => {
    if (state?.success) {
      toast.success(state.message || 'Email settings updated successfully!');
    } else if (state?.success === false) {
      toast.error(state.message || 'Failed to update email settings');
    }
  }, [state]);
  
  // Enhanced form action to include current state values
  const handleFormAction = (formData: FormData) => {
    // Add domains to FormData as comma-separated string
    formData.set('allowed_domains', settings.allowed_domains.join(','));
    formData.set('block_disposable', settings.block_disposable.toString());
    formData.set('custom_regex', settings.custom_regex || '');
    
    formAction(formData);
  };
  
  const addDomain = () => {
    if (!newDomain) return;
    
    // Normalize domain to lowercase
    const normalizedDomain = newDomain.toLowerCase().trim();
    
    // Check if domain already exists
    if (settings.allowed_domains.includes(normalizedDomain)) {
      toast.error(`"${normalizedDomain}" is already in the allowed domains list.`);
      return;
    }
    
    // Basic validation (simple check for valid domain format)
    const domainPattern = /^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z0-9][a-z0-9-]{0,61}[a-z0-9]$/;
    if (!domainPattern.test(normalizedDomain)) {
      toast.error('Please enter a valid domain (e.g. example.com)');
      return;
    }
    
    setSettings({
      ...settings,
      allowed_domains: [...settings.allowed_domains, normalizedDomain],
    });
    
    setNewDomain('');
  };  
  const removeDomain = (domain: string) => {
    setSettings({
      ...settings,
      allowed_domains: settings.allowed_domains.filter(d => d !== domain),
    });
  };
  
  return (
    <Form action={handleFormAction} className="space-y-6">
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="block_disposable" className="flex items-center gap-2">
            <span>Block Disposable Email Addresses</span>
          </Label>
          <div className="flex items-center gap-2">
            <Switch 
              id="block_disposable"
              name="block_disposable"
              checked={settings.block_disposable}
              onCheckedChange={(checked) => {
                setSettings({ ...settings, block_disposable: checked });
              }}
            />
            <span className="text-sm text-gray-500">
              {settings.block_disposable ? 'Enabled' : 'Disabled'}
            </span>
          </div>
          <p className="text-sm text-gray-500 mt-1">
            When enabled, users cannot register with temporary or disposable email providers.
          </p>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="custom_regex">Custom Validation Regex</Label>
          <Input 
            id="custom_regex"
            name="custom_regex"
            placeholder="^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$"
            value={settings.custom_regex || ''}
            onChange={(e) => setSettings({ ...settings, custom_regex: e.target.value })}
            aria-invalid={state?.errors?.custom_regex ? 'true' : 'false'}
          />
          {state?.errors?.custom_regex && (
            <p className="text-sm text-red-600">{state.errors.custom_regex}</p>
          )}
          <p className="text-sm text-gray-500">
            Optional: Advanced regex pattern for email validation. Leave empty to use default validation.
          </p>
        </div>
        
        <div className="space-y-2">
          <Label>Allowed Email Domains</Label>
          <div className="flex flex-wrap gap-2 mb-3">
            {settings.allowed_domains.length === 0 ? (
              <p className="text-sm text-gray-500 italic">No domains added. All domains will be allowed.</p>
            ) : (
              settings.allowed_domains.map(domain => (
                <Badge key={domain} variant="secondary" className="flex items-center gap-1 py-1 px-2">
                  {domain}
                  <button 
                    type="button" 
                    onClick={() => removeDomain(domain)}
                    className="text-gray-500 hover:text-red-500 ml-1"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))
            )}
          </div>
          <div className="flex gap-2">
            <Input
              placeholder="example.com"
              value={newDomain}
              onChange={(e) => setNewDomain(e.target.value)}
              className="flex-1"
            />
            <Button 
              type="button" 
              variant="outline" 
              onClick={addDomain}
              size="icon"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          <p className="text-sm text-gray-500">
            Add specific domains that are allowed to register. If empty, all domains will be allowed.
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