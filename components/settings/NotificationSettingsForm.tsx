'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import toast from 'react-hot-toast';
import { updateNotificationSettings } from '@/lib/actions/settings';

interface NotificationSettingsFormProps {
  userId: string;
  initialValues: {
    emailNotificationsEnabled: boolean;
    notificationFrequency: string;
  };
}

interface NotificationFormValues {
  emailNotificationsEnabled: boolean;
  notificationFrequency: string;
}

export default function NotificationSettingsForm({ userId, initialValues }: NotificationSettingsFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { handleSubmit, setValue, watch } = useForm<NotificationFormValues>({
    defaultValues: initialValues
  });

  const emailNotificationsEnabled = watch('emailNotificationsEnabled');

  const onSubmit = async (data: NotificationFormValues) => {
    try {
      setIsSubmitting(true);
      
      const result = await updateNotificationSettings({
        userId,
        emailNotificationsEnabled: data.emailNotificationsEnabled,
        notificationFrequency: data.notificationFrequency
      });
      
      if (result.success) {
        toast.success("Your notification preferences have been saved", {
          icon: '✅',
          duration: 3000,
        });
      } else {
        throw new Error(result.error || 'Failed to update settings');
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to update settings', {
        duration: 5000,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <Label htmlFor="email-notifications" className="text-base">
            Email Notifications
          </Label>
          <p className="text-sm text-muted-foreground">
            Receive email notifications for polls you&apos;re interested in
          </p>
        </div>
        <Switch
          id="email-notifications"
          checked={emailNotificationsEnabled}
          onCheckedChange={value => setValue('emailNotificationsEnabled', value)}
        />
      </div>

      {emailNotificationsEnabled && (
        <div className="space-y-4 border-t pt-4 mt-4">
          <div>
            <Label className="text-base mb-2 block">Notification Frequency</Label>
            <RadioGroup
              defaultValue={initialValues.notificationFrequency}
              onValueChange={value => setValue('notificationFrequency', value)}
              className="space-y-2"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="immediate" id="immediate" />
                <Label htmlFor="immediate" className="cursor-pointer">
                  Immediate — Send notifications as soon as they&apos;re available
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="daily" id="daily" />
                <Label htmlFor="daily" className="cursor-pointer">
                  Daily Digest — Combine notifications into a single daily email
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="weekly" id="weekly" />
                <Label htmlFor="weekly" className="cursor-pointer">
                  Weekly Summary — Receive a weekly roundup of poll activity
                </Label>
              </div>
            </RadioGroup>
          </div>
        </div>
      )}

      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Saving..." : "Save Settings"}
      </Button>
    </form>
  );
}