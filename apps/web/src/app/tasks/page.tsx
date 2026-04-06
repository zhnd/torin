import { AppShell } from '@/components/layout/app-shell';
import { TasksPage } from '@/modules/tasks/tasks-page';

export default function Page() {
  return (
    <AppShell>
      <TasksPage />
    </AppShell>
  );
}
