'use client';

import { useQuery } from '@apollo/client';
import { Plus } from 'lucide-react';
import Link from 'next/link';
import { EmptyState } from '@/components/common/empty-state';
import { AppShell } from '@/components/layout/app-shell';
import { Button } from '@/components/ui/button';
import { ProjectCard } from './components/project-card';
import { GET_PROJECTS } from './graphql';

export function ProjectsPage() {
  const { data, loading } = useQuery(GET_PROJECTS);
  const projects = data?.projects ?? [];

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Projects</h1>
          <Button asChild>
            <Link href="/projects/new">
              <Plus className="mr-2 h-4 w-4" />
              New Project
            </Link>
          </Button>
        </div>

        {loading ? (
          <div className="text-sm text-muted-foreground">Loading...</div>
        ) : projects.length === 0 ? (
          <EmptyState
            title="No projects yet"
            description="Create a project to start analyzing repositories"
            action={
              <Button asChild>
                <Link href="/projects/new">Create your first project</Link>
              </Button>
            }
          />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {projects.map(
              (project: {
                id: string;
                name: string;
                repositoryUrl: string;
                authMethod: string;
                updatedAt: string;
              }) => (
                <ProjectCard key={project.id} project={project} />
              )
            )}
          </div>
        )}
      </div>
    </AppShell>
  );
}
