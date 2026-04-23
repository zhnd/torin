'use client';

import Link from 'next/link';
import { AppShell } from '@/components/layout/app-shell';
import { ProjectForm } from '@/components/project-form';

export function ProjectNew() {
  return (
    <AppShell>
      <div className="mx-auto max-w-190 px-4 py-4 md:px-10 md:py-8">
        <div className="mb-3.5 flex items-center gap-2 text-[13px]">
          <Link
            href="/projects"
            className="text-foreground-muted no-underline hover:text-foreground"
          >
            Projects
          </Link>
          <span className="text-foreground-subtle">/</span>
          <span className="text-foreground">Connect repository</span>
        </div>

        <div className="mb-6">
          <h1 className="m-0 text-[22px] font-semibold tracking-[-0.02em]">
            Connect repository
          </h1>
          <p className="m-0 mt-1 text-[13px] text-foreground-muted">
            Point Torin at a GitHub repo so it can analyze, patch, and open pull
            requests.
          </p>
        </div>

        <ProjectForm mode="create" />
      </div>
    </AppShell>
  );
}
