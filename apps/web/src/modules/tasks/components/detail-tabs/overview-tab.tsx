import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  ExternalLink,
  FileText,
  Package,
  Shield,
  ShieldCheck,
  XCircle,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/utils/cn';
import type { TaskDetail } from '../../types';

interface OverviewTabProps {
  detail: TaskDetail;
}

export function OverviewTab({ detail }: OverviewTabProps) {
  const { task, summary, approvals } = detail;

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {/* Execution Summary */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-sm font-medium">
            <Clock className="h-4 w-4 text-muted-foreground" />
            Execution Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-6">
            <div>
              <p className="text-[11px] text-muted-foreground">Duration</p>
              <p className="text-xl font-bold tracking-tight tabular-nums">
                {task.duration}
              </p>
            </div>
            <div>
              <p className="text-[11px] text-muted-foreground">Tokens</p>
              <p className="text-base font-bold tracking-tight tabular-nums font-mono">
                {(summary.totalTokens / 1000).toFixed(1)}k
              </p>
            </div>
            <div>
              <p className="text-[11px] text-muted-foreground">Cost</p>
              <p className="text-xl font-bold tracking-tight tabular-nums font-mono">
                {summary.totalCost}
              </p>
            </div>
            <div>
              <p className="text-[11px] text-muted-foreground">Model</p>
              <p className="mt-0.5 text-base font-mono font-medium">
                {task.model.replace('claude-', '').split('-202')[0]}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Health / Risk */}
      <Card
        className={cn(
          summary.pathDeviation || summary.errorCount > 0
            ? 'bg-amber-50/40'
            : ''
        )}
      >
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-sm font-medium">
            <Shield className="h-4 w-4 text-muted-foreground" />
            Health &amp; Risk
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-bold tracking-tight">
              {summary.confidence}
            </span>
            <span className="text-lg text-muted-foreground font-medium">
              /100
            </span>
            <span className="ml-1 text-xs text-muted-foreground">
              confidence
            </span>
          </div>
          <div className="flex gap-6">
            <div>
              <p className="text-[11px] text-muted-foreground">Deviation</p>
              <p className="mt-0.5 text-sm font-medium">
                {summary.pathDeviation ? (
                  <span className="flex items-center gap-1 text-amber-600">
                    <AlertTriangle className="h-3.5 w-3.5" />
                    Yes
                  </span>
                ) : (
                  <span className="text-emerald-600">None</span>
                )}
              </p>
            </div>
            <div>
              <p className="text-[11px] text-muted-foreground">Errors</p>
              <p className="mt-0.5 text-base font-bold tabular-nums">
                {summary.errorCount}
              </p>
            </div>
            <div>
              <p className="text-[11px] text-muted-foreground">Retries</p>
              <p className="mt-0.5 text-base font-bold tabular-nums">
                {summary.retryCount}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Inputs / Context */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-sm font-medium">
            <FileText className="h-4 w-4 text-muted-foreground" />
            Inputs &amp; Context
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <p className="text-[11px] text-muted-foreground">Description</p>
            <p className="mt-0.5 text-sm leading-relaxed">
              {summary.description}
            </p>
          </div>
          {summary.issue && (
            <div>
              <p className="text-[11px] text-muted-foreground">Related Issue</p>
              <p className="mt-0.5 text-sm font-mono font-semibold">
                {summary.issue}
              </p>
            </div>
          )}
          {summary.contextFiles.length > 0 && (
            <div>
              <p className="text-[11px] text-muted-foreground">Context Files</p>
              <div className="mt-1 space-y-0.5">
                {summary.contextFiles.map((f) => (
                  <p
                    key={f}
                    className="text-[11px] font-mono text-muted-foreground"
                  >
                    {f}
                  </p>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Outputs / Artifacts */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-sm font-medium">
            <Package className="h-4 w-4 text-muted-foreground" />
            Outputs &amp; Artifacts
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {summary.outputs.length > 0 && (
            <div>
              <p className="text-[11px] text-muted-foreground">
                Generated Files
              </p>
              <div className="mt-1 space-y-0.5">
                {summary.outputs.map((f) => (
                  <p
                    key={f}
                    className="text-[11px] font-mono text-muted-foreground"
                  >
                    {f}
                  </p>
                ))}
              </div>
            </div>
          )}
          {summary.prUrl && (
            <div>
              <p className="text-[11px] text-muted-foreground">Pull Request</p>
              <p className="mt-0.5 text-sm">
                <span className="inline-flex items-center gap-1.5 font-medium hover:underline cursor-pointer">
                  <ExternalLink className="h-3 w-3" />
                  {summary.prUrl}
                </span>
              </p>
            </div>
          )}
          <div>
            <p className="text-[11px] text-muted-foreground">Tests</p>
            <div className="mt-1 flex gap-4">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                <span className="text-xl font-bold tabular-nums">
                  {summary.testsPassed}
                </span>
                <span className="text-[11px] text-muted-foreground">
                  passed
                </span>
              </span>
              {summary.testsFailed > 0 && (
                <span className="flex items-center gap-1.5">
                  <XCircle className="h-4 w-4 text-red-500" />
                  <span className="text-xl font-bold tabular-nums">
                    {summary.testsFailed}
                  </span>
                  <span className="text-[11px] text-muted-foreground">
                    failed
                  </span>
                </span>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Approvals / HITL */}
      {approvals.length > 0 && (
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-medium">
              <ShieldCheck className="h-4 w-4 text-muted-foreground" />
              Approvals &amp; Human-in-the-Loop
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {approvals.map((a) => (
                <div
                  key={a.id}
                  className={cn(
                    'flex items-start justify-between rounded-lg border p-4',
                    a.status === 'pending'
                      ? 'border-amber-200 bg-amber-50/40'
                      : 'border-border'
                  )}
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <Badge
                        variant="outline"
                        className={
                          a.status === 'pending'
                            ? 'bg-amber-50 text-amber-700 border-amber-200'
                            : a.status === 'approved'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : 'bg-red-50 text-red-700 border-red-200'
                        }
                      >
                        {a.status}
                      </Badge>
                      <span className="text-sm font-semibold">{a.type}</span>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {a.description}
                    </p>
                  </div>
                  <span className="shrink-0 text-[11px] font-mono text-muted-foreground">
                    {new Date(a.timestamp).toLocaleTimeString()}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
