'use client';

import { use } from 'react';
import { TaskDetail } from '@/modules/task-detail';

export default function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return <TaskDetail taskId={id} />;
}
