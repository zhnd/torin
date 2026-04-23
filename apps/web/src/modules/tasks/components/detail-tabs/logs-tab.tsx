import type { LogLevel } from '@torin/domain';
import { Search } from 'lucide-react';
import { useState } from 'react';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/utils/cn';
import type { LogEntry } from '../../types';

const LEVEL_COLORS: Record<LogLevel, string> = {
  DEBUG: 'text-muted-foreground',
  INFO: 'text-blue-600',
  WARN: 'text-amber-600',
  ERROR: 'text-red-600',
};

interface LogsTabProps {
  logs: LogEntry[];
}

export function LogsTab({ logs }: LogsTabProps) {
  const [search, setSearch] = useState('');
  const [levelFilter, setLevelFilter] = useState<LogLevel | 'ALL'>('ALL');

  const filtered = logs.filter((log) => {
    if (levelFilter !== 'ALL' && log.level !== levelFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        log.message.toLowerCase().includes(q) ||
        log.source.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search logs..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-8 text-xs font-mono"
          />
        </div>
        <Select
          value={levelFilter}
          onValueChange={(v) => setLevelFilter(v as LogLevel | 'ALL')}
        >
          <SelectTrigger className="h-8 w-28 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL" className="text-xs">
              All levels
            </SelectItem>
            <SelectItem value="DEBUG" className="text-xs">
              DEBUG
            </SelectItem>
            <SelectItem value="INFO" className="text-xs">
              INFO
            </SelectItem>
            <SelectItem value="WARN" className="text-xs">
              WARN
            </SelectItem>
            <SelectItem value="ERROR" className="text-xs">
              ERROR
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-lg border border-border bg-muted/30 overflow-hidden">
        <div className="max-h-125 overflow-y-auto">
          <table className="w-full text-xs font-mono">
            <tbody>
              {filtered.map((log) => (
                <tr
                  key={`${log.timestamp}-${log.source}-${log.message.slice(0, 30)}`}
                  className="border-b border-border/50 last:border-b-0 hover:bg-accent/50"
                >
                  <td className="whitespace-nowrap px-3 py-1.5 text-muted-foreground">
                    {log.timestamp}
                  </td>
                  <td className="whitespace-nowrap px-2 py-1.5">
                    <span
                      className={cn('font-semibold', LEVEL_COLORS[log.level])}
                    >
                      {log.level.padEnd(5)}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-2 py-1.5 text-muted-foreground">
                    [{log.source}]
                  </td>
                  <td className="px-2 py-1.5">{log.message}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
