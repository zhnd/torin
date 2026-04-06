import { CheckCircle2, FolderGit2, ListTodo, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface StatsCardsProps {
  projectCount: number;
  totalTasks: number;
  runningTasks: number;
  completedTasks: number;
}

export function StatsCards({
  projectCount,
  totalTasks,
  runningTasks,
  completedTasks,
}: StatsCardsProps) {
  const stats = [
    { label: 'Projects', value: projectCount, icon: FolderGit2 },
    { label: 'Total Tasks', value: totalTasks, icon: ListTodo },
    { label: 'Running', value: runningTasks, icon: Loader2 },
    { label: 'Completed', value: completedTasks, icon: CheckCircle2 },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat) => (
        <Card key={stat.label}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {stat.label}
            </CardTitle>
            <stat.icon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stat.value}</div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
