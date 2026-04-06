import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { authClient } from '@/libs/auth-client';
import { type LoginFormValues, loginSchema } from './libs';

export function useService() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  async function onSubmit(values: LoginFormValues) {
    setError(null);
    setIsLoading(true);
    try {
      const { error: authError } = await authClient.signIn.email(values);
      if (authError) {
        setError(authError.message ?? 'Sign in failed');
        return;
      }
      router.push('/');
      router.refresh();
    } catch {
      setError('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  }

  async function onGoogleSignIn() {
    await authClient.signIn.social({ provider: 'google' });
  }

  return { form, error, isLoading, onSubmit, onGoogleSignIn };
}
