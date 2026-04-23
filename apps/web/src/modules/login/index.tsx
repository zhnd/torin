import { AuthLayout } from '@/components/layout/auth-layout';
import { LoginForm } from './components/login-form';

export function Login() {
  return (
    <AuthLayout>
      <LoginForm />
    </AuthLayout>
  );
}
