'use client';

import { useMutation } from '@apollo/client';
import {
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  FileCode,
  RotateCcw,
} from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { REVIEW_TASK } from '../../graphql';

interface FileDiff {
  file: string;
  reason: string;
  additions: number;
  deletions: number;
  patch: string;
}

interface FileChange {
  file: string;
  description: string;
}

interface CriticConcern {
  severity: 'blocking' | 'warning' | 'info';
  description: string;
  file?: string;
  suggestion?: string;
}

interface DiffReviewData {
  diff?: FileDiff[];
  changes?: FileChange[];
  reviewNotes?: string;
  testsPassed?: boolean;
  testOutput?: string;
  resolution?: {
    summary?: string;
    branch?: string;
  };
  previewUrl?: string;
  filterChecks?: Record<
    string,
    | {
        name: string;
        passed: boolean;
        durationMs: number;
        output?: string;
      }
    | undefined
  >;
  criticReview?: {
    approve: boolean;
    score: number;
    scopeAssessment: 'clean' | 'ambiguous' | 'out-of-scope';
    concerns: CriticConcern[];
  };
}

interface DiffReviewPanelProps {
  taskId: string;
  data: DiffReviewData;
  onReviewed?: () => void;
}

function DiffBlock({ patch }: { patch: string }) {
  const lines = patch.split('\n');

  return (
    <pre className="overflow-auto rounded-md bg-muted p-3 font-mono text-xs leading-5">
      {lines.map((line, i) => {
        let className = '';
        if (line.startsWith('+') && !line.startsWith('+++')) {
          className = 'bg-green-500/15 text-green-700 dark:text-green-400';
        } else if (line.startsWith('-') && !line.startsWith('---')) {
          className = 'bg-red-500/15 text-red-700 dark:text-red-400';
        } else if (line.startsWith('@@')) {
          className = 'text-blue-600 dark:text-blue-400';
        }

        return (
          // biome-ignore lint/suspicious/noArrayIndexKey: diff lines are static, index is stable
          <div key={`${i}-${line.slice(0, 20)}`} className={className}>
            {line}
          </div>
        );
      })}
    </pre>
  );
}

export function DiffReviewPanel({
  taskId,
  data,
  onReviewed,
}: DiffReviewPanelProps) {
  const [feedback, setFeedback] = useState('');
  const [reviewTask, { loading }] = useMutation(REVIEW_TASK);
  const [expandedFiles, setExpandedFiles] = useState<Set<string>>(
    new Set(data.diff?.map((d) => d.file) ?? [])
  );

  async function handleReview(action: 'approve' | 'reject') {
    try {
      await reviewTask({
        variables: {
          taskId,
          action,
          feedback: feedback.trim() || undefined,
        },
      });
      toast.success(
        action === 'approve'
          ? 'Approved — creating pull request'
          : 'Rejected — re-implementing with feedback'
      );
      setFeedback('');
      onReviewed?.();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Review failed');
    }
  }

  function toggleFile(file: string) {
    setExpandedFiles((prev) => {
      const next = new Set(prev);
      if (next.has(file)) {
        next.delete(file);
      } else {
        next.add(file);
      }
      return next;
    });
  }

  const totalAdditions =
    data.diff?.reduce((sum, d) => sum + d.additions, 0) ?? 0;
  const totalDeletions =
    data.diff?.reduce((sum, d) => sum + d.deletions, 0) ?? 0;

  return (
    <div className="space-y-4">
      {/* Summary header */}
      {data.resolution?.summary && (
        <Card>
          <CardContent className="py-4">
            <p className="text-sm">{data.resolution.summary}</p>
            {data.resolution.branch && (
              <p className="mt-1 font-mono text-xs text-muted-foreground">
                {data.resolution.branch}
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Preview URL — shown when FILTER's boot-verify produced one */}
      {data.previewUrl && (
        <Card className="border-primary/40 bg-primary/5">
          <CardContent className="py-3 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Preview available</p>
              <p className="text-xs text-muted-foreground mt-0.5 font-mono">
                {data.previewUrl}
              </p>
            </div>
            <a
              href={data.previewUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm underline underline-offset-4"
            >
              Open preview
            </a>
          </CardContent>
        </Card>
      )}

      {/* Critic review */}
      {data.criticReview && (
        <Card
          className={
            data.criticReview.scopeAssessment === 'out-of-scope'
              ? 'border-red-500/50'
              : data.criticReview.concerns.some(
                    (c) => c.severity === 'blocking'
                  )
                ? 'border-red-500/50'
                : data.criticReview.concerns.some(
                      (c) => c.severity === 'warning'
                    )
                  ? 'border-amber-500/50'
                  : 'border-green-500/40'
          }
        >
          <CardContent className="py-3 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">
                  Critic review
                  <span className="ml-2 text-xs text-muted-foreground">
                    score {data.criticReview.score.toFixed(2)} · scope{' '}
                    {data.criticReview.scopeAssessment}
                  </span>
                </p>
              </div>
              <span
                className={`text-xs rounded px-2 py-0.5 ${
                  data.criticReview.approve
                    ? 'bg-green-500/15 text-green-700 dark:text-green-400'
                    : 'bg-red-500/15 text-red-700 dark:text-red-400'
                }`}
              >
                {data.criticReview.approve ? 'approved' : 'rejected'}
              </span>
            </div>
            {data.criticReview.concerns.length > 0 && (
              <div className="space-y-2">
                {data.criticReview.concerns.map((c, i) => (
                  <div
                    // biome-ignore lint/suspicious/noArrayIndexKey: concerns array is stable for a given review
                    key={`${i}-${c.description.slice(0, 30)}`}
                    className="rounded-md border p-2"
                  >
                    <div className="flex items-start gap-2">
                      <span
                        className={`shrink-0 text-xs rounded px-1.5 py-0.5 ${
                          c.severity === 'blocking'
                            ? 'bg-red-500/15 text-red-700 dark:text-red-400'
                            : c.severity === 'warning'
                              ? 'bg-amber-500/15 text-amber-700 dark:text-amber-400'
                              : 'bg-muted text-muted-foreground'
                        }`}
                      >
                        {c.severity}
                      </span>
                      <div className="flex-1 text-sm">
                        <p>{c.description}</p>
                        {c.file && (
                          <p className="mt-0.5 font-mono text-xs text-muted-foreground">
                            {c.file}
                          </p>
                        )}
                        {c.suggestion && (
                          <p className="mt-1 text-xs text-muted-foreground">
                            💡 {c.suggestion}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Filter check results */}
      {data.filterChecks && Object.keys(data.filterChecks).length > 0 && (
        <Card>
          <CardContent className="py-3">
            <p className="text-xs font-medium text-muted-foreground mb-2">
              Automated checks
            </p>
            <div className="flex flex-wrap gap-2">
              {Object.values(data.filterChecks)
                .filter((c): c is NonNullable<typeof c> => c !== undefined)
                .map((c) => (
                  <span
                    key={c.name}
                    className={`text-xs rounded px-2 py-0.5 ${
                      c.passed
                        ? 'bg-green-500/15 text-green-700 dark:text-green-400'
                        : 'bg-red-500/15 text-red-700 dark:text-red-400'
                    }`}
                  >
                    {c.name}: {c.passed ? 'pass' : 'fail'}
                  </span>
                ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* File diffs */}
      {data.diff && data.diff.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              Files Changed ({data.diff.length})
              <span className="text-sm font-normal">
                <span className="text-green-600">+{totalAdditions}</span>{' '}
                <span className="text-red-600">-{totalDeletions}</span>
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 pt-0">
            {data.diff.map((fileDiff) => {
              const isExpanded = expandedFiles.has(fileDiff.file);
              const change = data.changes?.find(
                (c) => c.file === fileDiff.file
              );

              return (
                <div key={fileDiff.file} className="rounded-md border">
                  <button
                    type="button"
                    className="flex w-full items-center gap-2 p-3 text-left hover:bg-muted/50"
                    onClick={() => toggleFile(fileDiff.file)}
                  >
                    {isExpanded ? (
                      <ChevronDown className="h-4 w-4 shrink-0" />
                    ) : (
                      <ChevronRight className="h-4 w-4 shrink-0" />
                    )}
                    <FileCode className="h-4 w-4 shrink-0 text-muted-foreground" />
                    <span className="min-w-0 truncate font-mono text-sm">
                      {fileDiff.file}
                    </span>
                    <span className="ml-auto shrink-0 text-xs">
                      <span className="text-green-600">
                        +{fileDiff.additions}
                      </span>{' '}
                      <span className="text-red-600">
                        -{fileDiff.deletions}
                      </span>
                    </span>
                  </button>

                  {isExpanded && (
                    <div className="border-t px-3 pb-3">
                      {(fileDiff.reason || change?.description) && (
                        <p className="py-2 text-sm text-muted-foreground">
                          {fileDiff.reason || change?.description}
                        </p>
                      )}
                      <DiffBlock patch={fileDiff.patch} />
                    </div>
                  )}
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      {/* Test results */}
      {data.testsPassed !== undefined && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              Test Results
              <Badge
                variant={data.testsPassed ? 'default' : 'destructive'}
                className={data.testsPassed ? 'bg-green-600' : ''}
              >
                {data.testsPassed ? 'Passed' : 'Failed'}
              </Badge>
            </CardTitle>
          </CardHeader>
          {data.testOutput && (
            <CardContent className="pt-0">
              <pre className="max-h-48 overflow-auto rounded-md bg-muted p-3 font-mono text-xs">
                {data.testOutput}
              </pre>
            </CardContent>
          )}
        </Card>
      )}

      {/* Review notes */}
      {data.reviewNotes && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Review Notes</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <p className="text-sm">{data.reviewNotes}</p>
          </CardContent>
        </Card>
      )}

      {/* Review actions */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Review</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 pt-0">
          <Textarea
            placeholder="Optional feedback — additional instructions for approve, or reason for rejection..."
            rows={3}
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
          />
          <div className="flex gap-2">
            <Button onClick={() => handleReview('approve')} disabled={loading}>
              <CheckCircle2 className="mr-2 h-4 w-4" />
              Approve & Create PR
            </Button>
            <Button
              variant="outline"
              onClick={() => handleReview('reject')}
              disabled={loading || !feedback.trim()}
            >
              <RotateCcw className="mr-2 h-4 w-4" />
              Reject & Re-implement
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
