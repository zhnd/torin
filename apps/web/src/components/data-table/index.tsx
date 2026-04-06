'use client';

import { flexRender, type Table as TanstackTable } from '@tanstack/react-table';
import { ArrowUpDown, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { cn } from '@/utils/cn';

declare module '@tanstack/react-table' {
  interface ColumnMeta<TData, TValue> {
    sticky?: 'right';
    headerClassName?: string;
    cellClassName?: string;
  }
}

interface DataTableProps<TData> {
  table: TanstackTable<TData>;
  onRowClick?: (row: TData) => void;
}

export function DataTable<TData>({ table, onRowClick }: DataTableProps<TData>) {
  const pageCount = table.getPageCount();
  const colCount = table.getAllColumns().length;

  return (
    <div className="flex flex-col overflow-hidden rounded-lg border border-border bg-card">
      {/* Scrollable table area */}
      <div className="flex-1 overflow-auto min-h-0">
        <Table className="relative">
          <TableHeader className="sticky top-0 z-10">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow
                key={headerGroup.id}
                className="bg-muted/50 hover:bg-muted/50"
              >
                {headerGroup.headers.map((header) => {
                  const sticky = header.column.columnDef.meta?.sticky;
                  const headerClassName =
                    header.column.columnDef.meta?.headerClassName;
                  return (
                    <TableHead
                      key={header.id}
                      className={cn(
                        'h-9 px-3 text-[11px] font-medium text-muted-foreground',
                        header.column.getCanSort() &&
                          'cursor-pointer select-none hover:text-foreground transition-colors',
                        sticky === 'right' &&
                          'sticky right-0 bg-muted shadow-[-4px_0_8px_-4px_rgba(0,0,0,0.08)]',
                        headerClassName
                      )}
                      style={{ width: header.getSize() }}
                      onClick={header.column.getToggleSortingHandler()}
                    >
                      <div className="flex items-center gap-1">
                        {header.isPlaceholder
                          ? null
                          : flexRender(
                              header.column.columnDef.header,
                              header.getContext()
                            )}
                        {header.column.getCanSort() && (
                          <span className="ml-0.5">
                            {header.column.getIsSorted() === 'asc' ? (
                              <ChevronUp className="h-3 w-3" />
                            ) : header.column.getIsSorted() === 'desc' ? (
                              <ChevronDown className="h-3 w-3" />
                            ) : (
                              <ArrowUpDown className="h-3 w-3 opacity-30" />
                            )}
                          </span>
                        )}
                      </div>
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={colCount}
                  className="h-24 text-center text-sm text-muted-foreground"
                >
                  No results found
                </TableCell>
              </TableRow>
            ) : (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  className={cn('group/row', onRowClick && 'cursor-pointer')}
                  onClick={() => onRowClick?.(row.original)}
                >
                  {row.getVisibleCells().map((cell) => {
                    const sticky = cell.column.columnDef.meta?.sticky;
                    const cellClassName =
                      cell.column.columnDef.meta?.cellClassName;
                    return (
                      <TableCell
                        key={cell.id}
                        className={cn(
                          'px-3 py-2.5',
                          sticky === 'right' &&
                            'sticky right-0 bg-card group-hover/row:bg-muted shadow-[-4px_0_8px_-4px_rgba(0,0,0,0.08)]',
                          cellClassName
                        )}
                      >
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </TableCell>
                    );
                  })}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination — always visible at bottom */}
      {pageCount > 1 && (
        <div className="flex items-center justify-between border-t border-border px-4 py-2">
          <p className="text-xs text-muted-foreground">
            Page {table.getState().pagination.pageIndex + 1} of {pageCount}
          </p>
          <div className="flex gap-1">
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-xs"
              disabled={!table.getCanPreviousPage()}
              onClick={() => table.previousPage()}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-xs"
              disabled={!table.getCanNextPage()}
              onClick={() => table.nextPage()}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
