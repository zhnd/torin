'use client';

import Link from 'next/link';
import { StatusBadge } from '@/components/common/status-badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface Task {
  id: string;
  status: string;
  repositoryUrl: string;
  project?: { id: string; name: string } | null;
  createdAt: string;
}

interface RecentTasksProps {
  tasks: Task[];
}

export function RecentTasks({ tasks }: RecentTasksProps) {
  if (tasks.length === 0) return null;

  const recent = tasks.slice(0, 5);

  return (
    <div>
      <h2 className="mb-4 text-lg font-semibold">Recent Tasks</h2>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Project</TableHead>
            <TableHead>Repository</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Created</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {recent.map((task) => (
            <TableRow key={task.id}>
              <TableCell>
                {task.project ? (
                  <Link
                    href={`/projects/${task.project.id}`}
                    className="text-sm hover:underline"
                  >
                    {task.project.name}
                  </Link>
                ) : (
                  <span className="text-sm text-muted-foreground">—</span>
                )}
              </TableCell>
              <TableCell className="max-w-[200px] truncate font-mono text-xs">
                {task.repositoryUrl}
              </TableCell>
              <TableCell>
                <Link href={`/tasks/${task.id}`}>
                  <StatusBadge status={task.status} />
                </Link>
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {new Date(task.createdAt).toLocaleDateString()}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
