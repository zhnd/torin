'use client';

import { useQuery } from '@apollo/client';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { AppShell } from '@/components/layout/app-shell';
import { ProjectDetail } from './components/project-detail';
import { GET_PROJECT } from './graphql';

interface ProjectDetailPageProps {
  projectId: string;
}

export function ProjectDetailPage({ projectId }: ProjectDetailPageProps) {
  const { data, loading, error } = useQuery(GET_PROJECT, {
    variables: { id: projectId },
  });

  return (
    <AppShell>
      <div className="space-y-6">
        <Link
          href="/projects"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to projects
        </Link>

        {loading ? (
          <div className="text-sm text-muted-foreground">Loading...</div>
        ) : error ? (
          <div className="text-sm text-destructive-foreground">
            Error: {error.message}
          </div>
        ) : !data?.project ? (
          <div className="text-sm text-muted-foreground">Project not found</div>
        ) : (
          <ProjectDetail project={data.project} />
        )}
      </div>
    </AppShell>
  );
}
