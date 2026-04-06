'use client';

import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { AppShell } from '@/components/layout/app-shell';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ProjectForm } from './components/project-form';

export function ProjectNewPage() {
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

        <Card className="max-w-lg">
          <CardHeader>
            <CardTitle>New Project</CardTitle>
          </CardHeader>
          <CardContent>
            <ProjectForm mode="create" />
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
