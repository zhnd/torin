import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { authClient } from '@/libs/auth-client';
import { type RegisterFormValues, registerSchema } from './libs';

export function useService() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: { name: '', email: '', password: '', confirmPassword: '' },
  });

  async function onSubmit(values: RegisterFormValues) {
    setError(null);
    setIsLoading(true);
    try {
      const { error: authError } = await authClient.signUp.email({
        name: values.name,
        email: values.email,
        password: values.password,
      });
      if (authError) {
        setError(authError.message ?? 'Sign up failed');
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

  return { form, error, isLoading, onSubmit };
}
