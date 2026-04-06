import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { authClient } from '@/libs/auth-client';
import { type PasswordFormValues, passwordSchema } from './libs';

export function useService() {
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
  });

  async function onSubmit(values: PasswordFormValues) {
    setError(null);
    setIsLoading(true);
    try {
      const { error: authError } = await authClient.changePassword({
        currentPassword: values.currentPassword,
        newPassword: values.newPassword,
      });
      if (authError) {
        setError(authError.message ?? 'Failed to change password');
        return;
      }
      toast.success('Password changed');
      form.reset();
    } catch {
      setError('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  }

  return { form, error, isLoading, onSubmit };
}
