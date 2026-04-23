'use client';

import { use } from 'react';
import { ProjectDetail } from '@/modules/project-detail';

export default function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return <ProjectDetail projectId={id} />;
}
