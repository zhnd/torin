'use client';

import { Bug, Play, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { MetaRow } from '@/components/common/meta-row';
import { ProjectAvatar } from '@/components/common/project-avatar';
import { SectionHead } from '@/components/common/section-head';
import { StatusChip } from '@/components/common/status-chip';
import { AppShell } from '@/components/layout/app-shell';
import { ProjectForm } from '@/components/project-form';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/utils/cn';
import { DETAIL_TABS } from './constants';
import { authLabel, relativeTime } from './libs';
import { useService } from './use-service';

interface ProjectDetailProps {
  projectId: string;
}

export function ProjectDetail({ projectId }: ProjectDetailProps) {
  const {
    loading,
    error,
    project,
    tab,
    setTab,
    resolveDefectOpen,
    setResolveDefectOpen,
    defectDescription,
    setDefectDescription,
    resolving,
    analyzing,
    deleting,
    recentTasks,
    sortedTasks,
    submitDefect,
    runAnalysis,
    removeProject,
  } = useService({ projectId });

  return (
    <AppShell>
      <div className="mx-auto max-w-330 px-4 py-4 md:px-10 md:py-8">
        {loading ? (
          <div className="py-10 text-center text-[12px] text-foreground-subtle">
            Loading…
          </div>
        ) : error ? (
          <div className="rounded-md border border-[color:var(--danger)]/30 bg-surface px-4 py-3 text-[13px] text-[color:var(--danger)]">
            {error.message}
          </div>
        ) : !project ? (
          <div className="py-10 text-center text-[12.5px] text-foreground-muted">
            Project not found
          </div>
        ) : (
          <div>
            <div className="mb-3.5 flex items-center gap-2 text-[13px]">
              <Link
                href="/projects"
                className="text-foreground-muted no-underline hover:text-foreground"
              >
                Projects
              </Link>
              <span className="text-foreground-subtle">/</span>
              <span className="text-foreground">{project.name}</span>
            </div>

            <div className="mb-6 flex items-center gap-5 rounded-md border border-border bg-surface px-6 py-5">
              <ProjectAvatar name={project.name} size={56} />
              <div className="min-w-0 flex-1">
                <h1 className="m-0 text-[24px] font-semibold tracking-[-0.025em]">
                  {project.name}
                </h1>
                <div className="mt-1 flex flex-wrap gap-3.5 font-mono text-[12px] text-foreground-subtle">
                  <span>
                    {project.repositoryUrl.replace(/^https?:\/\//, '')}
                  </span>
                  <span>↻ updated {relativeTime(project.updatedAt)}</span>
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={runAnalysis}
                  disabled={analyzing}
                >
                  <Play className="mr-1 h-3.5 w-3.5" />
                  {analyzing ? 'Starting…' : 'Run analysis'}
                </Button>
                <Dialog
                  open={resolveDefectOpen}
                  onOpenChange={setResolveDefectOpen}
                >
                  <DialogTrigger asChild>
                    <Button size="sm">
                      <Bug className="mr-1 h-3.5 w-3.5" />
                      New defect
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Resolve a defect</DialogTitle>
                      <DialogDescription>
                        Describe the defect — the agent will analyze, fix, and
                        open a PR.
                      </DialogDescription>
                    </DialogHeader>
                    <Textarea
                      placeholder="What's happening, what should happen, steps to reproduce…"
                      rows={6}
                      value={defectDescription}
                      onChange={(e) => setDefectDescription(e.target.value)}
                    />
                    <DialogFooter>
                      <Button
                        onClick={submitDefect}
                        disabled={resolving || !defectDescription.trim()}
                      >
                        {resolving ? 'Starting…' : 'Start resolution'}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </div>

            <div className="mb-5 flex border-b border-border">
              {DETAIL_TABS.map(([key, label]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setTab(key)}
                  className={cn(
                    '-mb-px cursor-pointer border-none bg-transparent px-3.5 py-2 text-[12.5px] transition-colors',
                    tab === key
                      ? 'border-b-[1.5px] border-foreground font-semibold text-foreground'
                      : 'border-b-[1.5px] border-transparent font-medium text-foreground-muted hover:text-foreground'
                  )}
                >
                  {label}
                </button>
              ))}
            </div>

            {tab === 'overview' && (
              <div className="grid grid-cols-1 gap-5 lg:grid-cols-[2fr_1fr]">
                <div>
                  <SectionHead
                    title="Recent tasks"
                    action={
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setTab('tasks')}
                      >
                        View all
                      </Button>
                    }
                  />
                  {recentTasks.length === 0 ? (
                    <div className="rounded-md border border-border bg-surface px-4 py-8 text-center text-[12.5px] text-foreground-muted">
                      No tasks yet. Create a defect or run an analysis.
                    </div>
                  ) : (
                    <div className="overflow-hidden rounded-md border border-border bg-surface">
                      <table className="w-full border-collapse">
                        <tbody className="[&_tr:last-child_td]:border-b-0">
                          {recentTasks.map((t) => (
                            <tr
                              key={t.id}
                              className="cursor-pointer transition-colors hover:bg-surface-2"
                            >
                              <td className="w-32.5 border-b border-border px-3 py-2.5">
                                <StatusChip status={t.status} />
                              </td>
                              <td className="border-b border-border px-3 py-2.5">
                                <Link
                                  href={`/tasks/${t.id}`}
                                  className="text-foreground no-underline"
                                >
                                  {t.type.toLowerCase().replace(/_/g, ' ')}
                                </Link>
                              </td>
                              <td className="border-b border-border px-3 py-2.5 text-right font-mono text-[11px] text-foreground-subtle">
                                {relativeTime(t.createdAt)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                <aside>
                  <SectionHead title="Project metadata" />
                  <div className="rounded-md border border-border bg-surface px-4 py-1">
                    <MetaRow
                      label="Repository"
                      value={project.repositoryUrl.replace(/^https?:\/\//, '')}
                      mono
                    />
                    <MetaRow
                      label="Auth"
                      value={authLabel(project.authMethod)}
                    />
                    {project.previewCommand && (
                      <MetaRow
                        label="Preview"
                        value={`${project.previewCommand}${
                          project.previewPort ? ` :${project.previewPort}` : ''
                        }`}
                        mono
                      />
                    )}
                    <MetaRow
                      label="Created"
                      value={new Date(project.createdAt).toLocaleDateString()}
                      last
                    />
                  </div>
                </aside>
              </div>
            )}

            {tab === 'tasks' &&
              (sortedTasks.length === 0 ? (
                <div className="rounded-md border border-border bg-surface px-4 py-10 text-center text-[12.5px] text-foreground-muted">
                  No tasks yet. Run an analysis to create the first task.
                </div>
              ) : (
                <div className="overflow-hidden rounded-md border border-border bg-surface">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr>
                        {['Status', 'Task', 'Created'].map((h) => (
                          <th
                            key={h}
                            className="whitespace-nowrap border-b border-border px-3 py-2 text-left text-[11px] font-medium text-foreground-subtle"
                          >
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="[&_tr:last-child_td]:border-b-0">
                      {sortedTasks.map((t) => (
                        <tr
                          key={t.id}
                          className="cursor-pointer transition-colors hover:bg-surface-2"
                        >
                          <td className="w-32.5 border-b border-border px-3 py-2.5">
                            <StatusChip status={t.status} />
                          </td>
                          <td className="border-b border-border px-3 py-2.5">
                            <Link
                              href={`/tasks/${t.id}`}
                              className="text-foreground no-underline"
                            >
                              {t.type.toLowerCase().replace(/_/g, ' ')}
                            </Link>
                            <div className="mt-0.5 font-mono text-[11px] text-foreground-subtle">
                              {t.id}
                            </div>
                          </td>
                          <td className="border-b border-border px-3 py-2.5 text-right font-mono text-[11px] text-foreground-subtle">
                            {new Date(t.createdAt).toLocaleDateString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ))}

            {tab === 'settings' && (
              <div className="max-w-160 space-y-6">
                <div>
                  <SectionHead
                    title="Project configuration"
                    subtitle="Edit repository, credentials, preview"
                  />
                  <div className="rounded-md border border-border bg-surface p-5">
                    <ProjectForm
                      mode="edit"
                      projectId={project.id}
                      defaultValues={{
                        name: project.name,
                        repositoryUrl: project.repositoryUrl,
                        authProvider:
                          project.authProvider === 'CNB' ? 'CNB' : 'GITHUB',
                        previewCommand: project.previewCommand ?? '',
                        previewPort:
                          project.previewPort != null
                            ? String(project.previewPort)
                            : '',
                        previewReadyPattern: project.previewReadyPattern ?? '',
                      }}
                    />
                  </div>
                </div>

                <div>
                  <SectionHead
                    title="Danger zone"
                    subtitle="Irreversible actions"
                  />
                  <div className="rounded-md border border-border bg-surface p-5">
                    <p className="m-0 mb-3 text-[12px] text-foreground-muted">
                      Deletes the project and all associated tasks. This cannot
                      be undone.
                    </p>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button
                          variant="destructive"
                          size="sm"
                          disabled={deleting}
                        >
                          <Trash2 className="mr-1 h-3.5 w-3.5" />
                          Delete project
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Delete project?</DialogTitle>
                          <DialogDescription>
                            This will permanently delete &quot;{project.name}
                            &quot; and all associated tasks. This action cannot
                            be undone.
                          </DialogDescription>
                        </DialogHeader>
                        <DialogFooter>
                          <Button
                            variant="destructive"
                            onClick={removeProject}
                            disabled={deleting}
                          >
                            {deleting ? 'Deleting…' : 'Delete'}
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </AppShell>
  );
}
