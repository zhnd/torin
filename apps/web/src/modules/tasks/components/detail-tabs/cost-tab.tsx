import { Coins } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { CostBreakdown } from '../../types';

interface CostTabProps {
  breakdown: CostBreakdown[];
}

export function CostTab({ breakdown }: CostTabProps) {
  const totalInput = breakdown.reduce((s, b) => s + b.inputTokens, 0);
  const totalOutput = breakdown.reduce((s, b) => s + b.outputTokens, 0);
  const totalCost = breakdown.reduce((s, b) => s + b.cost, 0);
  const maxCost = Math.max(...breakdown.map((b) => b.cost));

  return (
    <div className="space-y-4">
      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-4">
            <p className="text-xs text-muted-foreground">Total Cost</p>
            <p className="text-2xl font-bold font-mono">
              ${totalCost.toFixed(2)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-xs text-muted-foreground">Input Tokens</p>
            <p className="text-2xl font-bold font-mono">
              {totalInput.toLocaleString()}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-xs text-muted-foreground">Output Tokens</p>
            <p className="text-2xl font-bold font-mono">
              {totalOutput.toLocaleString()}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Cost by stage */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm font-medium">
            <Coins className="h-4 w-4 text-muted-foreground" />
            Cost by Stage
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs">Stage</TableHead>
                <TableHead className="text-xs">Model</TableHead>
                <TableHead className="text-xs text-right">Input</TableHead>
                <TableHead className="text-xs text-right">Output</TableHead>
                <TableHead className="text-xs text-right">Cost</TableHead>
                <TableHead className="text-xs text-right">Duration</TableHead>
                <TableHead className="text-xs w-32" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {breakdown.map((row) => (
                <TableRow key={row.stage}>
                  <TableCell className="text-xs font-medium capitalize">
                    {row.stage}
                  </TableCell>
                  <TableCell className="text-xs font-mono text-muted-foreground">
                    {row.model.replace('claude-', '').split('-202')[0]}
                  </TableCell>
                  <TableCell className="text-xs font-mono text-right">
                    {row.inputTokens.toLocaleString()}
                  </TableCell>
                  <TableCell className="text-xs font-mono text-right">
                    {row.outputTokens.toLocaleString()}
                  </TableCell>
                  <TableCell className="text-xs font-mono text-right">
                    ${row.cost.toFixed(2)}
                  </TableCell>
                  <TableCell className="text-xs font-mono text-right text-muted-foreground">
                    {row.duration}
                  </TableCell>
                  <TableCell>
                    <div className="h-2 w-full rounded-full bg-muted">
                      <div
                        className="h-2 rounded-full bg-foreground/60"
                        style={{
                          width: `${(row.cost / maxCost) * 100}%`,
                        }}
                      />
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              <TableRow className="font-medium">
                <TableCell className="text-xs">Total</TableCell>
                <TableCell />
                <TableCell className="text-xs font-mono text-right">
                  {totalInput.toLocaleString()}
                </TableCell>
                <TableCell className="text-xs font-mono text-right">
                  {totalOutput.toLocaleString()}
                </TableCell>
                <TableCell className="text-xs font-mono text-right">
                  ${totalCost.toFixed(2)}
                </TableCell>
                <TableCell />
                <TableCell />
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
