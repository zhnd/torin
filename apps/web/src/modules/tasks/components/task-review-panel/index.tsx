'use client';

import { useMutation } from '@apollo/client';
import {
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  FileCode,
  RotateCcw,
  Search,
  ShieldAlert,
} from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { REVIEW_TASK } from '../../graphql';

interface InvestigationStep {
  file: string;
  finding: string;
}

interface Evidence {
  file: string;
  lines: string;
  code: string;
  explanation: string;
}

interface Analysis {
  rootCause?: string;
  affectedFiles?: string[];
  proposedApproach?: string;
  relevantContext?: string;
  testStrategy?: string;
  investigation?: InvestigationStep[];
  evidence?: Evidence[];
  confidence?: 'high' | 'medium' | 'low';
  riskAssessment?: string;
  alternatives?: string[];
}

interface TaskReviewPanelProps {
  taskId: string;
  analysis: Analysis;
  onReviewed?: () => void;
}

const confidenceConfig = {
  high: {
    label: 'High',
    variant: 'default' as const,
    className: 'bg-green-600',
  },
  medium: {
    label: 'Medium',
    variant: 'secondary' as const,
    className: 'bg-yellow-600 text-white',
  },
  low: { label: 'Low', variant: 'destructive' as const, className: '' },
};

export function TaskReviewPanel({
  taskId,
  analysis,
  onReviewed,
}: TaskReviewPanelProps) {
  const [feedback, setFeedback] = useState('');
  const [reviewTask, { loading }] = useMutation(REVIEW_TASK);
  const [investigationOpen, setInvestigationOpen] = useState(false);

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
          ? 'Approved — implementation starting'
          : 'Rejected — re-analyzing with feedback'
      );
      setFeedback('');
      onReviewed?.();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Review failed');
    }
  }

  const confidence = analysis.confidence
    ? confidenceConfig[analysis.confidence]
    : null;

  return (
    <div className="space-y-4">
      {/* Confidence + Summary header */}
      {confidence && (
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-muted-foreground">
            Confidence
          </span>
          <Badge className={confidence.className}>{confidence.label}</Badge>
        </div>
      )}

      {/* Investigation Trail */}
      {analysis.investigation && analysis.investigation.length > 0 && (
        <Card>
          <CardHeader
            className="cursor-pointer pb-3"
            onClick={() => setInvestigationOpen(!investigationOpen)}
          >
            <CardTitle className="flex items-center gap-2 text-base">
              <Search className="h-4 w-4" />
              Investigation Trail
              <span className="text-sm font-normal text-muted-foreground">
                ({analysis.investigation.length} files examined)
              </span>
              {investigationOpen ? (
                <ChevronDown className="ml-auto h-4 w-4" />
              ) : (
                <ChevronRight className="ml-auto h-4 w-4" />
              )}
            </CardTitle>
          </CardHeader>
          {investigationOpen && (
            <CardContent className="space-y-2 pt-0">
              {analysis.investigation.map((step) => (
                <div
                  key={step.file}
                  className="flex gap-3 rounded-md border p-3"
                >
                  <FileCode className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                  <div className="min-w-0">
                    <p className="truncate font-mono text-sm">{step.file}</p>
                    <p className="mt-0.5 text-sm text-muted-foreground">
                      {step.finding}
                    </p>
                  </div>
                </div>
              ))}
            </CardContent>
          )}
        </Card>
      )}

      {/* Evidence */}
      {analysis.evidence && analysis.evidence.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Evidence</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 pt-0">
            {analysis.evidence.map((e) => (
              <div key={`${e.file}:${e.lines}`}>
                <p className="mb-1 font-mono text-sm text-muted-foreground">
                  {e.file}:{e.lines}
                </p>
                <pre className="overflow-auto rounded-md bg-muted p-3 font-mono text-xs">
                  {e.code}
                </pre>
                <p className="mt-1.5 text-sm">{e.explanation}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Root Cause + Approach */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Analysis</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 pt-0">
          {analysis.rootCause && (
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Root Cause
              </p>
              <p className="mt-1 text-sm">{analysis.rootCause}</p>
            </div>
          )}
          {analysis.affectedFiles && analysis.affectedFiles.length > 0 && (
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Affected Files
              </p>
              <ul className="mt-1 space-y-0.5">
                {analysis.affectedFiles.map((f) => (
                  <li key={f} className="font-mono text-sm">
                    {f}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {analysis.proposedApproach && (
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Proposed Approach
              </p>
              <p className="mt-1 text-sm">{analysis.proposedApproach}</p>
            </div>
          )}
          {analysis.testStrategy && (
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Test Strategy
              </p>
              <p className="mt-1 text-sm">{analysis.testStrategy}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Risk Assessment */}
      {analysis.riskAssessment && (
        <Card className="border-yellow-500/30">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <ShieldAlert className="h-4 w-4 text-yellow-500" />
              Risk Assessment
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <p className="text-sm">{analysis.riskAssessment}</p>
          </CardContent>
        </Card>
      )}

      {/* Alternatives */}
      {analysis.alternatives && analysis.alternatives.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Alternatives Considered</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <ul className="space-y-1">
              {analysis.alternatives.map((alt) => (
                <li key={alt} className="text-sm text-muted-foreground">
                  {alt}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Review Actions */}
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
              Approve
            </Button>
            <Button
              variant="outline"
              onClick={() => handleReview('reject')}
              disabled={loading || !feedback.trim()}
            >
              <RotateCcw className="mr-2 h-4 w-4" />
              Reject & Re-analyze
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
