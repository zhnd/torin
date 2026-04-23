'use client';

import { MetaRow } from '@/components/common/meta-row';
import { SectionHead } from '@/components/common/section-head';
import { AppShell } from '@/components/layout/app-shell';
import { PasswordForm } from './components/password-form';
import { ProfileForm } from './components/profile-form';
import { useService } from './use-service';

export function Settings() {
  const { user } = useService();

  return (
    <AppShell>
      <div className="mx-auto max-w-195 px-4 py-4 md:px-10 md:py-8">
        <h1 className="m-0 text-[22px] font-semibold tracking-[-0.02em]">
          Settings
        </h1>
        <p className="m-0 mb-6 mt-1 text-[13px] text-foreground-muted">
          Account and integrations.
        </p>

        <SectionHead title="Account" subtitle="Who you are on Torin" />
        <div className="mb-7 rounded-md border border-border bg-surface px-5 py-1">
          {user ? (
            <>
              <MetaRow label="Name" value={user.name ?? '—'} />
              <MetaRow label="Email" value={user.email ?? '—'} mono />
              <MetaRow label="User ID" value={user.id ?? '—'} mono last />
            </>
          ) : (
            <div className="py-3 text-[12px] text-foreground-subtle">
              Loading…
            </div>
          )}
        </div>

        <SectionHead title="Profile" subtitle="Update your display name" />
        <div className="mb-7 rounded-md border border-border bg-surface p-5">
          <ProfileForm defaultName={user?.name ?? ''} />
        </div>

        <SectionHead title="Password" subtitle="Change how you sign in" />
        <div className="rounded-md border border-border bg-surface p-5">
          <PasswordForm />
        </div>
      </div>
    </AppShell>
  );
}
