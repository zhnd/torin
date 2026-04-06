'use client';

import { use } from 'react';
import { TaskDetailPage } from '@/modules/tasks/task-detail-page';

export default function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return <TaskDetailPage taskId={id} />;
}
