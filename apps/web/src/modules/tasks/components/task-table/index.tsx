'use client';

import {
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  type SortingState,
  useReactTable,
} from '@tanstack/react-table';
import type { ExecutionStatus } from '@torin/domain';
import { Search } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { DataTable } from '@/components/data-table';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { TaskItem } from '../../types';
import { columns } from './columns';

interface TaskTableProps {
  data: TaskItem[];
}

export function TaskTable({ data }: TaskTableProps) {
  const router = useRouter();
  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState<ExecutionStatus | 'all'>(
    'all'
  );

  const filteredData =
    statusFilter === 'all'
      ? data
      : data.filter((t) => t.status === statusFilter);

  const table = useReactTable({
    data: filteredData,
    columns,
    state: { sorting, globalFilter },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    globalFilterFn: (row, _columnId, filterValue: string) => {
      const q = filterValue.toLowerCase();
      const t = row.original;
      return (
        t.title.toLowerCase().includes(q) ||
        t.repo.toLowerCase().includes(q) ||
        t.branch.toLowerCase().includes(q) ||
        t.projectName.toLowerCase().includes(q)
      );
    },
    initialState: {
      pagination: { pageSize: 10 },
    },
  });

  return (
    <div className="flex flex-col gap-4 min-h-0 flex-1">
      {/* Toolbar */}
      <div className="flex items-center gap-2 flex-wrap shrink-0">
        <div className="relative flex-1 min-w-50 max-w-90">
          <Search className="absolute left-2.5 top-2 h-4 w-4 text-muted-foreground/50" />
          <Input
            placeholder="Search tasks, repos, branches..."
            value={globalFilter}
            onChange={(e) => setGlobalFilter(e.target.value)}
            className="pl-9 h-8 text-sm"
          />
        </div>

        <Select
          value={statusFilter}
          onValueChange={(v) => setStatusFilter(v as ExecutionStatus | 'all')}
        >
          <SelectTrigger className="h-8 w-32 text-xs">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all" className="text-xs">
              All status
            </SelectItem>
            <SelectItem value="running" className="text-xs">
              Running
            </SelectItem>
            <SelectItem value="blocked" className="text-xs">
              Blocked
            </SelectItem>
            <SelectItem value="needs_review" className="text-xs">
              Needs Review
            </SelectItem>
            <SelectItem value="failed" className="text-xs">
              Failed
            </SelectItem>
            <SelectItem value="completed" className="text-xs">
              Completed
            </SelectItem>
            <SelectItem value="queued" className="text-xs">
              Queued
            </SelectItem>
          </SelectContent>
        </Select>

        <div className="ml-auto text-xs text-muted-foreground">
          {table.getFilteredRowModel().rows.length} task
          {table.getFilteredRowModel().rows.length !== 1 ? 's' : ''}
        </div>
      </div>

      {/* Table */}
      <DataTable
        table={table}
        onRowClick={(row) => router.push(`/tasks/${row.id}`)}
      />
    </div>
  );
}
