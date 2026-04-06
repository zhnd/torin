import { AuthLayout } from '@/components/layout/auth-layout';
import { RegisterForm } from './components/register-form';

export function RegisterPage() {
  return (
    <AuthLayout>
      <RegisterForm />
    </AuthLayout>
  );
}
