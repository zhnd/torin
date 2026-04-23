import { authClient } from '@/libs/auth-client';

export function useService() {
  const { data: session } = authClient.useSession();
  return { user: session?.user ?? null };
}
