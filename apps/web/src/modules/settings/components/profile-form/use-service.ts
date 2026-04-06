import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { authClient } from '@/libs/auth-client';
import { type ProfileFormValues, profileSchema } from './libs';

export function useService(defaultName: string) {
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: { name: defaultName },
  });

  async function onSubmit(values: ProfileFormValues) {
    setIsLoading(true);
    try {
      await authClient.updateUser({ name: values.name });
      toast.success('Profile updated');
    } catch {
      toast.error('Failed to update profile');
    } finally {
      setIsLoading(false);
    }
  }

  return { form, isLoading, onSubmit };
}
