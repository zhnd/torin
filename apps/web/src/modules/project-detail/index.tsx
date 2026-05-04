'use client';

import { Bug, Play, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { MetaRow } from '@/components/common/meta-row';
import { PanelCard } from '@/components/common/panel-card';
import { ProjectAvatar } from '@/components/common/project-avatar';
import { StatusChip } from '@/components/common/status-chip';
import { Tally } from '@/components/common/tally';
import { AppShell } from '@/components/layout/app-shell';
import { PageHeader } from '@/components/layout/page-header';
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
      <PageHeader
        segments={[
          { label: 'Projects', href: '/projects' },
          { label: project?.name ?? 'Loading…' },
        ]}
      />

      <div className="px-7 py-7 lg:px-9 lg:py-8">
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
            <div className="mb-6 flex items-center gap-4">
              <ProjectAvatar name={project.name} size={48} />
              <div className="min-w-0 flex-1">
                <div className="mb-1 flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.1em] text-foreground-subtle">
                  <span className="inline-flex h-1.5 w-1.5 rounded-full bg-foreground-faint" />
                  project · {project.id.slice(-6)}
                </div>
                <h1 className="m-0 text-[24px] font-semibold leading-[1.1] tracking-normal text-foreground">
                  {project.name}
                </h1>
                <div className="mt-1.5 flex flex-wrap gap-2.5 font-mono text-[10.5px] text-foreground-subtle">
                  <span>
                    {project.repositoryUrl.replace(/^https?:\/\//, '')}
                  </span>
                  <span aria-hidden="true">·</span>
                  <span>updated {relativeTime(project.updatedAt)}</span>
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

            <Tally className="mb-5" />

            <div className="mb-5 flex border-b border-border-faint">
              {DETAIL_TABS.map(([key, label]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setTab(key)}
                  className={cn(
                    '-mb-px relative cursor-pointer border-none bg-transparent px-3.5 py-2.5 text-[12.5px] transition-colors',
                    tab === key
                      ? 'font-semibold text-foreground'
                      : 'font-medium text-foreground-muted hover:text-foreground'
                  )}
                >
                  {label}
                  {tab === key && (
                    <span className="absolute inset-x-2 bottom-0 h-[2px] rounded-full bg-accent" />
                  )}
                </button>
              ))}
            </div>

            {tab === 'overview' && (
              <div className="grid grid-cols-1 gap-3 lg:grid-cols-[2fr_1fr]">
                <PanelCard
                  title="Recent tasks"
                  action={
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setTab('tasks')}
                      className="h-7 text-[11.5px]"
                    >
                      View all
                    </Button>
                  }
                  noPad
                >
                  {recentTasks.length === 0 ? (
                    <div className="px-4 py-8 text-center text-[12.5px] text-foreground-muted">
                      No tasks yet. Create a defect or run an analysis.
                    </div>
                  ) : (
                    <ol className="divide-y divide-border-faint">
                      {recentTasks.map((t) => (
                        <li key={t.id}>
                          <Link
                            href={`/tasks/${t.id}`}
                            className="flex items-center gap-3 px-4 py-3 no-underline hover:bg-surface-2"
                          >
                            <StatusChip status={t.status} />
                            <span className="flex-1 text-[12.5px] font-medium text-foreground">
                              {t.type.toLowerCase().replace(/_/g, ' ')}
                            </span>
                            <span className="font-mono text-[11px] text-foreground-subtle">
                              {relativeTime(t.createdAt)}
                            </span>
                          </Link>
                        </li>
                      ))}
                    </ol>
                  )}
                </PanelCard>

                <PanelCard title="Project metadata" noPad>
                  <div className="px-4 py-1">
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
                </PanelCard>
              </div>
            )}

            {tab === 'tasks' && (
              <PanelCard
                title="All tasks"
                caption={`${sortedTasks.length} total`}
                noPad
              >
                {sortedTasks.length === 0 ? (
                  <div className="px-4 py-10 text-center text-[12.5px] text-foreground-muted">
                    No tasks yet. Run an analysis to create the first task.
                  </div>
                ) : (
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="border-b border-border-faint bg-surface-cream/40">
                        {['Status', 'Task', 'Created'].map((h) => (
                          <th
                            key={h}
                            className="whitespace-nowrap px-4 py-2.5 text-left text-[10px] font-semibold uppercase tracking-[0.06em] text-foreground-subtle"
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
                          <td className="w-32.5 border-b border-border-faint px-4 py-2.5">
                            <StatusChip status={t.status} />
                          </td>
                          <td className="border-b border-border-faint px-4 py-2.5">
                            <Link
                              href={`/tasks/${t.id}`}
                              className="text-foreground no-underline"
                            >
                              {t.type.toLowerCase().replace(/_/g, ' ')}
                            </Link>
                            <div className="mt-0.5 font-mono text-[10.5px] text-foreground-subtle">
                              {t.id}
                            </div>
                          </td>
                          <td className="border-b border-border-faint px-4 py-2.5 text-right font-mono text-[11px] text-foreground-subtle">
                            {new Date(t.createdAt).toLocaleDateString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </PanelCard>
            )}

            {tab === 'settings' && (
              <div className="max-w-170 space-y-4">
                <PanelCard
                  title="Project configuration"
                  caption="repository · credentials · preview"
                >
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
                </PanelCard>

                <PanelCard title="Danger zone" caption="irreversible actions">
                  <p className="m-0 mb-3 text-[12px] text-foreground-muted">
                    Deletes the project and all associated tasks. This cannot be
                    undone.
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
                          &quot; and all associated tasks. This action cannot be
                          undone.
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
                </PanelCard>
              </div>
            )}
          </div>
        )}
      </div>
    </AppShell>
  );
}
