import {
  DEFAULT_STAGES,
  type StageStatus,
  StageTrack,
} from '@/components/common/stage-track';
import { Tally } from '@/components/common/tally';
import type {
  StageDataMap,
  StageKey,
  StageStatusMap,
  TaskDetail,
} from '../../../types';
import { StageBody } from '../../stage-body';

interface ResolveDefectViewProps {
  detail: TaskDetail;
  stages: StageStatusMap;
  stageData: StageDataMap;
  selectedStage: StageKey;
  setSelectedStage: (key: StageKey) => void;
  timings: Partial<Record<string, string>>;
  submitReview: (lane: string, feedback: string) => void;
  reviewing: boolean;
  hitlWaited: string | null;
}

/**
 * Multi-stage defect-resolution overview: pipeline rail + StageBody.
 * Extracted from task-detail/index.tsx so per-task-type views can replace
 * the overview content without forking the whole shell.
 */
export function ResolveDefectView({
  detail,
  stages,
  stageData,
  selectedStage,
  setSelectedStage,
  timings,
  submitReview,
  reviewing,
  hitlWaited,
}: ResolveDefectViewProps) {
  return (
    <div className="grid min-h-0 flex-1 grid-cols-1 overflow-hidden lg:grid-cols-[244px_1fr]">
      <div className="max-h-64 overflow-y-auto border-b border-border-faint bg-surface-cream/30 p-3 lg:max-h-none lg:border-r lg:border-b-0">
        <div className="flex items-center gap-1.5 px-2.5 pb-3 pt-1 text-[10px] font-semibold uppercase tracking-[0.08em] text-foreground-subtle">
          <span className="inline-block h-1 w-1 rounded-full bg-foreground-faint" />
          Pipeline
        </div>
        <StageTrack
          stages={stages as Partial<Record<string, StageStatus>>}
          currentStage={selectedStage}
          onSelect={(k) => setSelectedStage(k as StageKey)}
          list={DEFAULT_STAGES}
          timings={timings}
        />
        <Tally className="mt-4" />
      </div>

      <div className="overflow-y-auto px-4 py-5 sm:px-6 lg:px-9 lg:py-7">
        <div className="mx-auto max-w-220 pb-12">
          <StageBody
            stage={selectedStage}
            status={stages[selectedStage]}
            stageData={stageData}
            detail={detail}
            onReview={submitReview}
            reviewing={reviewing}
            hitlWaited={hitlWaited}
          />
        </div>
      </div>
    </div>
  );
}
