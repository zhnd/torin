'use client';

import { useMutation } from '@apollo/client';
import { Play, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { EmptyState } from '@/components/common/empty-state';
import { StatusBadge } from '@/components/common/status-badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ANALYZE_REPOSITORY, DELETE_PROJECT } from '../../graphql';
import { ProjectForm } from '../project-form';

interface ProjectDetailProps {
  project: {
    id: string;
    name: string;
    repositoryUrl: string;
    authMethod: string;
    hasCredentials: boolean;
    createdAt: string;
    updatedAt: string;
    tasks: Array<{
      id: string;
      type: string;
      status: string;
      repositoryUrl: string;
      createdAt: string;
    }>;
  };
}

export function ProjectDetail({ project }: ProjectDetailProps) {
  const router = useRouter();
  const [analyzeRepository, { loading: analyzing }] =
    useMutation(ANALYZE_REPOSITORY);
  const [deleteProject, { loading: deleting }] = useMutation(DELETE_PROJECT);

  async function handleAnalyze() {
    try {
      const { data } = await analyzeRepository({
        variables: { projectId: project.id },
      });
      if (data?.analyzeRepository?.id) {
        toast.success('Analysis started');
        router.push(`/tasks/${data.analyzeRepository.id}`);
      }
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : 'Failed to start analysis'
      );
    }
  }

  async function handleDelete() {
    try {
      await deleteProject({ variables: { id: project.id } });
      toast.success('Project deleted');
      router.push('/projects');
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : 'Failed to delete project'
      );
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{project.name}</h1>
          <p className="mt-1 font-mono text-sm text-muted-foreground">
            {project.repositoryUrl}
          </p>
        </div>
        <Button onClick={handleAnalyze} disabled={analyzing}>
          <Play className="mr-2 h-4 w-4" />
          {analyzing ? 'Starting...' : 'Run Analysis'}
        </Button>
      </div>

      <Tabs defaultValue="tasks">
        <TabsList>
          <TabsTrigger value="tasks">Tasks</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="tasks" className="mt-4">
          {project.tasks.length === 0 ? (
            <EmptyState
              title="No tasks yet"
              description="Run an analysis to create the first task"
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {project.tasks.map((task) => (
                  <TableRow key={task.id}>
                    <TableCell>
                      <Link
                        href={`/tasks/${task.id}`}
                        className="text-sm hover:underline"
                      >
                        {task.type}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={task.status} />
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(task.createdAt).toLocaleDateString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </TabsContent>

        <TabsContent value="settings" className="mt-4 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Project Settings</CardTitle>
            </CardHeader>
            <CardContent>
              <ProjectForm
                mode="edit"
                projectId={project.id}
                defaultValues={{
                  name: project.name,
                  repositoryUrl: project.repositoryUrl,
                }}
              />
            </CardContent>
          </Card>

          <Card className="border-destructive/50">
            <CardHeader>
              <CardTitle className="text-destructive-foreground">
                Danger Zone
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="destructive" disabled={deleting}>
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete Project
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Delete project?</DialogTitle>
                    <DialogDescription>
                      This will permanently delete &quot;{project.name}&quot;
                      and all associated tasks. This action cannot be undone.
                    </DialogDescription>
                  </DialogHeader>
                  <DialogFooter>
                    <Button
                      variant="destructive"
                      onClick={handleDelete}
                      disabled={deleting}
                    >
                      {deleting ? 'Deleting...' : 'Delete'}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
