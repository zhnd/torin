import { AuthLayout } from '@/components/layout/auth-layout';
import { RegisterForm } from './components/register-form';

export function Register() {
  return (
    <AuthLayout>
      <RegisterForm />
    </AuthLayout>
  );
}
