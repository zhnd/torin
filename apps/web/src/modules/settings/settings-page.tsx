'use client';

import { AppShell } from '@/components/layout/app-shell';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { authClient } from '@/libs/auth-client';
import { PasswordForm } from './components/password-form';
import { ProfileForm } from './components/profile-form';

export function SettingsPage() {
  const { data: session } = authClient.useSession();
  const user = session?.user;

  return (
    <AppShell>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Settings</h1>

        <Card>
          <CardHeader>
            <CardTitle>Profile</CardTitle>
          </CardHeader>
          <CardContent>
            {user ? (
              <div className="space-y-4">
                <div className="text-sm text-muted-foreground">
                  Email: {user.email}
                </div>
                <Separator />
                <ProfileForm defaultName={user.name ?? ''} />
              </div>
            ) : (
              <div className="text-sm text-muted-foreground">Loading...</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Change Password</CardTitle>
          </CardHeader>
          <CardContent>
            <PasswordForm />
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
