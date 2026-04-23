'use client';

import { Plus } from 'lucide-react';
import Link from 'next/link';
import { SectionHead } from '@/components/common/section-head';
import { AppShell } from '@/components/layout/app-shell';
import { Button } from '@/components/ui/button';
import { ProjectCard } from './components/project-card';
import { repoLang } from './libs';
import { useService } from './use-service';

export function Projects() {
  const { loading, projects } = useService();

  return (
    <AppShell>
      <div className="mx-auto max-w-330 px-4 py-4 md:px-10 md:py-8">
        <div className="mb-6 flex items-end justify-between">
          <div>
            <h1 className="m-0 text-[22px] font-semibold tracking-[-0.02em]">
              Projects
            </h1>
            <p className="m-0 mt-1 text-[13px] text-foreground-muted">
              {projects.length}{' '}
              {projects.length === 1
                ? 'connected repository'
                : 'connected repositories'}
            </p>
          </div>
          <Button size="sm" asChild>
            <Link href="/projects/new">
              <Plus className="mr-1 h-3.5 w-3.5" />
              Connect repo
            </Link>
          </Button>
        </div>

        {loading && projects.length === 0 ? (
          <div className="py-8 text-center text-[12px] text-foreground-subtle">
            Loading…
          </div>
        ) : projects.length === 0 ? (
          <div className="rounded-lg border border-border bg-surface px-6 py-12 text-center">
            <div className="text-[14px] font-semibold">No projects yet</div>
            <p className="mx-auto mt-1 max-w-90 text-[12.5px] text-foreground-muted">
              Connect a repository to start resolving defects with Torin.
            </p>
            <Button size="sm" asChild className="mt-4">
              <Link href="/projects/new">Create your first project</Link>
            </Button>
          </div>
        ) : (
          <>
            <SectionHead title="All projects" subtitle="Click to open detail" />
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {projects.map((p) => (
                <ProjectCard
                  key={p.id}
                  project={{
                    id: p.id,
                    name: p.name,
                    repositoryUrl: p.repositoryUrl,
                    authMethod: p.authMethod,
                    updatedAt: p.updatedAt,
                    taskCount: 0,
                    openCount: 0,
                    runningCount: 0,
                    awaitingCount: 0,
                    successRate: null,
                    trend: [],
                    lang: repoLang(p.repositoryUrl),
                  }}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </AppShell>
  );
}
