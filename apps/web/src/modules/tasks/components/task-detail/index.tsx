'use client';

import { useEffect, useRef, useState } from 'react';
import { StatusBadge } from '@/components/common/status-badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { AnalysisResult } from '../analysis-result';

const POLL_TIMEOUT_MS = 5 * 60 * 1000;

interface TaskDetailProps {
  task: {
    id: string;
    type: string;
    status: string;
    repositoryUrl: string;
    result: unknown;
    error: string | null;
    workflowId: string | null;
    project?: { id: string; name: string } | null;
    createdAt: string;
    updatedAt: string;
  };
  startPolling: (ms: number) => void;
  stopPolling: () => void;
  refetch: () => void;
}

interface AnalysisResultData {
  summary: string;
  techStack: string[];
  patterns: string[];
  structure: string;
  recommendations: string[];
}

export function TaskDetail({
  task,
  startPolling,
  stopPolling,
  refetch,
}: TaskDetailProps) {
  const isActive = task.status === 'PENDING' || task.status === 'RUNNING';
  const [pollTimedOut, setPollTimedOut] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    if (isActive && !pollTimedOut) {
      startPolling(2000);
      timerRef.current = setTimeout(() => {
        stopPolling();
        setPollTimedOut(true);
      }, POLL_TIMEOUT_MS);
    } else {
      stopPolling();
    }
    return () => {
      stopPolling();
      clearTimeout(timerRef.current);
    };
  }, [isActive, pollTimedOut, startPolling, stopPolling]);

  const result = task.result as AnalysisResultData | null;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold">Task</h1>
          <p className="mt-1 font-mono text-sm text-muted-foreground">
            {task.id}
          </p>
        </div>
        <StatusBadge status={task.status} />
      </div>

      <Card>
        <CardContent className="pt-6">
          <dl className="space-y-3 text-sm">
            <div className="flex gap-2">
              <dt className="text-muted-foreground">Repository:</dt>
              <dd className="font-mono">{task.repositoryUrl}</dd>
            </div>
            <Separator />
            <div className="flex gap-2">
              <dt className="text-muted-foreground">Type:</dt>
              <dd>{task.type}</dd>
            </div>
            <Separator />
            <div className="flex gap-2">
              <dt className="text-muted-foreground">Created:</dt>
              <dd>{new Date(task.createdAt).toLocaleString()}</dd>
            </div>
            {task.project && (
              <>
                <Separator />
                <div className="flex gap-2">
                  <dt className="text-muted-foreground">Project:</dt>
                  <dd>{task.project.name}</dd>
                </div>
              </>
            )}
            {task.workflowId && (
              <>
                <Separator />
                <div className="flex gap-2">
                  <dt className="text-muted-foreground">Workflow:</dt>
                  <dd className="font-mono">{task.workflowId}</dd>
                </div>
              </>
            )}
          </dl>
        </CardContent>
      </Card>

      {task.error && (
        <Card className="border-destructive/50">
          <CardHeader>
            <CardTitle className="text-destructive-foreground">Error</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="whitespace-pre-wrap text-sm text-destructive-foreground">
              {task.error}
            </pre>
          </CardContent>
        </Card>
      )}

      {result && <AnalysisResult result={result} />}

      {isActive && !pollTimedOut && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-blue-400" />
          Polling for updates...
        </div>
      )}

      {pollTimedOut && isActive && (
        <Card className="border-yellow-700">
          <CardContent className="pt-6">
            <p className="text-sm text-yellow-300">
              Polling timed out. The task may still be running.
            </p>
            <Button
              variant="outline"
              size="sm"
              className="mt-2"
              onClick={() => {
                setPollTimedOut(false);
                refetch();
              }}
            >
              Retry
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
