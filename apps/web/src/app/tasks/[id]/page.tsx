'use client';

import { useQuery } from '@apollo/client';
import Link from 'next/link';
import { use, useEffect, useRef, useState } from 'react';
import { GET_TASK } from '@/lib/graphql/operations';

const POLL_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes

interface AnalysisResult {
  summary: string;
  techStack: string[];
  patterns: string[];
  structure: string;
  recommendations: string[];
}

const STATUS_STYLES: Record<string, string> = {
  PENDING: 'bg-yellow-900/50 text-yellow-300 border-yellow-700',
  RUNNING: 'bg-blue-900/50 text-blue-300 border-blue-700',
  COMPLETED: 'bg-green-900/50 text-green-300 border-green-700',
  FAILED: 'bg-red-900/50 text-red-300 border-red-700',
};

export default function TaskPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { data, loading, error, refetch, startPolling, stopPolling } = useQuery(
    GET_TASK,
    { variables: { id } }
  );

  const task = data?.task;
  const isActive = task?.status === 'PENDING' || task?.status === 'RUNNING';
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

  if (loading && !task) {
    return <p className="text-zinc-400">Loading...</p>;
  }

  if (error) {
    return <p className="text-red-400">Error: {error.message}</p>;
  }

  if (!task) {
    return <p className="text-zinc-400">Task not found.</p>;
  }

  const result = task.result as AnalysisResult | null;

  return (
    <div>
      <Link
        href="/"
        className="mb-6 inline-block text-sm text-zinc-400 hover:text-zinc-200"
      >
        &larr; Back
      </Link>

      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold">Task</h1>
          <p className="mt-1 text-sm text-zinc-500 font-mono">{task.id}</p>
        </div>
        <span
          className={`rounded-full border px-3 py-1 text-xs font-medium ${STATUS_STYLES[task.status] ?? 'bg-zinc-800 text-zinc-300 border-zinc-700'}`}
        >
          {task.status}
        </span>
      </div>

      <div className="mb-6 rounded-lg border border-zinc-800 bg-zinc-900 p-4">
        <dl className="space-y-2 text-sm">
          <div className="flex gap-2">
            <dt className="text-zinc-500">Repository:</dt>
            <dd className="font-mono text-zinc-300">{task.repositoryUrl}</dd>
          </div>
          <div className="flex gap-2">
            <dt className="text-zinc-500">Type:</dt>
            <dd className="text-zinc-300">{task.type}</dd>
          </div>
          <div className="flex gap-2">
            <dt className="text-zinc-500">Created:</dt>
            <dd className="text-zinc-300">
              {new Date(task.createdAt).toLocaleString()}
            </dd>
          </div>
          {task.workflowId && (
            <div className="flex gap-2">
              <dt className="text-zinc-500">Workflow:</dt>
              <dd className="font-mono text-zinc-300">{task.workflowId}</dd>
            </div>
          )}
        </dl>
      </div>

      {task.error && (
        <div className="mb-6 rounded-lg border border-red-900 bg-red-950/50 p-4">
          <h2 className="mb-2 font-semibold text-red-300">Error</h2>
          <pre className="text-sm text-red-200 whitespace-pre-wrap">
            {task.error}
          </pre>
        </div>
      )}

      {result && <AnalysisResultView result={result} />}

      {isActive && !pollTimedOut && (
        <div className="mt-4 flex items-center gap-2 text-sm text-zinc-400">
          <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-blue-400" />
          Polling for updates...
        </div>
      )}

      {pollTimedOut && isActive && (
        <div className="mt-4 rounded-lg border border-yellow-900 bg-yellow-950/50 p-4">
          <p className="text-sm text-yellow-300">
            Polling timed out. The task may have failed silently.
          </p>
          <button
            type="button"
            onClick={() => {
              setPollTimedOut(false);
              refetch();
            }}
            className="mt-2 text-sm text-yellow-400 underline hover:text-yellow-200"
          >
            Retry
          </button>
        </div>
      )}
    </div>
  );
}

function AnalysisResultView({ result }: { result: AnalysisResult }) {
  return (
    <div className="space-y-6">
      <Section title="Summary">
        <p className="text-zinc-300">{result.summary}</p>
      </Section>

      <Section title="Tech Stack">
        <div className="flex flex-wrap gap-2">
          {result.techStack.map((tech) => (
            <span
              key={tech}
              className="rounded-md border border-zinc-700 bg-zinc-800 px-2.5 py-1 text-xs text-zinc-300"
            >
              {tech}
            </span>
          ))}
        </div>
      </Section>

      <Section title="Structure">
        <pre className="text-sm text-zinc-300 whitespace-pre-wrap">
          {result.structure}
        </pre>
      </Section>

      <Section title="Patterns">
        <ul className="list-disc space-y-1 pl-5 text-zinc-300">
          {result.patterns.map((p) => (
            <li key={p}>{p}</li>
          ))}
        </ul>
      </Section>

      <Section title="Recommendations">
        <ul className="list-disc space-y-1 pl-5 text-zinc-300">
          {result.recommendations.map((r) => (
            <li key={r}>{r}</li>
          ))}
        </ul>
      </Section>
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-4">
      <h2 className="mb-3 text-lg font-semibold">{title}</h2>
      {children}
    </div>
  );
}
