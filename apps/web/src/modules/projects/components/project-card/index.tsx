import Link from 'next/link';
import { Dot } from '@/components/common/dot';
import { ProjectAvatar } from '@/components/common/project-avatar';
import { Spark } from '@/components/common/spark';
import { relativeTime } from '../../libs';
import type { ProjectCardData } from '../../types';

interface ProjectCardProps {
  project: ProjectCardData;
}

export function ProjectCard({ project }: ProjectCardProps) {
  const running = project.runningCount ?? 0;
  const awaiting = project.awaitingCount ?? 0;
  const active = running + awaiting;
  const trend = project.trend ?? [];
  const updated = relativeTime(project.updatedAt);

  return (
    <Link
      href={`/projects/${project.id}`}
      className="group relative flex flex-col gap-4 rounded-lg border border-border bg-surface p-5 text-left transition-[background,border-color] hover:border-border-strong hover:bg-surface-2"
    >
      {running > 0 && (
        <span className="absolute right-4 top-4 inline-flex items-center gap-1 text-[10.5px] font-medium uppercase tracking-[0.06em] text-foreground-muted">
          <Dot className="sv-running" size={5} pulse /> Live
        </span>
      )}

      <div className="flex items-center gap-3">
        <ProjectAvatar name={project.name} size={32} />
        <div className="min-w-0 flex-1">
          <div className="text-[15px] font-semibold leading-[1.2] tracking-[-0.015em]">
            {project.name}
          </div>
          <div className="mt-1 flex items-center gap-2 font-mono text-[11px] text-foreground-subtle">
            <span className="min-w-0 flex-1 truncate">
              {project.repositoryUrl}
            </span>
            {project.lang && (
              <span className="shrink-0 text-foreground-muted">
                {project.lang}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-end justify-between gap-4">
        <div className="flex gap-5">
          <CardStat label="Tasks" value={project.taskCount ?? 0} />
          <CardStat
            label="Open"
            value={project.openCount ?? 0}
            emphasize={(project.openCount ?? 0) > 0}
          />
          {project.successRate != null && (
            <CardStat label="Success" value={`${project.successRate}%`} mono />
          )}
        </div>
        <Spark values={trend} width={88} height={26} />
      </div>

      <div className="-mt-1 flex items-center gap-2.5 border-t border-border pt-3 text-[11.5px] text-foreground-muted">
        {active > 0 ? (
          <>
            {running > 0 && (
              <span className="inline-flex items-center gap-1.5">
                <Dot className="sv-running" size={5} pulse /> {running} running
              </span>
            )}
            {awaiting > 0 && (
              <span className="inline-flex items-center gap-1.5">
                <Dot className="sv-awaiting" size={5} pulse /> {awaiting}{' '}
                awaiting
              </span>
            )}
          </>
        ) : (
          <span className="text-foreground-subtle">No active tasks</span>
        )}
        <span className="flex-1" />
        <span className="font-mono text-[11px] text-foreground-subtle">
          {updated}
        </span>
      </div>
    </Link>
  );
}

function CardStat({
  label,
  value,
  emphasize,
  mono,
}: {
  label: string;
  value: React.ReactNode;
  emphasize?: boolean;
  mono?: boolean;
}) {
  return (
    <div>
      <div className="text-[10.5px] font-medium uppercase tracking-[0.04em] text-foreground-subtle">
        {label}
      </div>
      <div
        className="mt-0.5 text-[18px] font-semibold leading-none tabular-nums tracking-[-0.015em]"
        style={{
          color: emphasize ? 'var(--accent)' : undefined,
          fontFamily: mono ? 'var(--font-mono)' : undefined,
        }}
      >
        {value}
      </div>
    </div>
  );
}

