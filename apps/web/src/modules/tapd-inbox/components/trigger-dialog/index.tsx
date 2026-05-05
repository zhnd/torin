'use client';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import type { TapdBugRow, TapdInboxMapping } from '../../types';
import { useService } from './use-service';

interface Props {
  bug: TapdBugRow | null;
  mapping: TapdInboxMapping | null;
  onClose: () => void;
}

export function TriggerDialog({ bug, mapping, onClose }: Props) {
  const open = Boolean(bug);
  const {
    project,
    branches,
    branchesLoading,
    description,
    setDescription,
    baseBranch,
    setBaseBranch,
    submit,
    submitting,
  } = useService({ bug, mapping, onClose });

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Trigger defect fix</DialogTitle>
          <DialogDescription>
            Tapd bug <span className="font-mono">#{bug?.id}</span> ·{' '}
            {project ? (
              <>
                target project{' '}
                <span className="font-mono text-foreground">
                  {project.name}
                </span>
              </>
            ) : (
              <span className="text-[color:var(--danger)]">
                no project mapping found — set one in Settings
              </span>
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="defect-description">Defect description</Label>
            <Textarea
              id="defect-description"
              rows={10}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe what is broken and how to reproduce it"
              className="font-mono text-[12px]"
            />
            <p className="text-[11.5px] text-foreground-subtle">
              Pre-filled from the Tapd bug. Edit before triggering if you want
              the agent to focus on a specific aspect.
            </p>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="base-branch">Base branch</Label>
            <Select
              value={baseBranch}
              onValueChange={setBaseBranch}
              disabled={branchesLoading || branches.length === 0}
            >
              <SelectTrigger id="base-branch" className="w-full sm:w-90">
                <SelectValue
                  placeholder={
                    branchesLoading
                      ? 'Loading branches…'
                      : branches.length === 0
                        ? 'No branches available'
                        : 'Pick a branch'
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {branches.map((b) => (
                  <SelectItem key={b} value={b}>
                    {b}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-[11.5px] text-foreground-subtle">
              The fix branch will be cut from this base. Defaults to the repo's
              default branch.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button
            onClick={submit}
            disabled={submitting || !project || !description.trim()}
          >
            {submitting ? 'Triggering…' : 'Trigger fix'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
