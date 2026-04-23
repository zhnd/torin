import { useMutation } from '@apollo/client';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { CREATE_PROJECT, UPDATE_PROJECT } from '@/modules/projects/graphql';
import { type ProjectFormValues, projectSchema } from './libs';

interface UseServiceOptions {
  mode: 'create' | 'edit';
  projectId?: string;
  defaultValues?: Partial<ProjectFormValues>;
}

export function useService({
  mode,
  projectId,
  defaultValues,
}: UseServiceOptions) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  const form = useForm<ProjectFormValues>({
    resolver: zodResolver(projectSchema),
    defaultValues: {
      name: defaultValues?.name ?? '',
      repositoryUrl: defaultValues?.repositoryUrl ?? '',
      previewCommand: defaultValues?.previewCommand ?? '',
      previewPort: defaultValues?.previewPort ?? '',
      previewReadyPattern: defaultValues?.previewReadyPattern ?? '',
    },
  });

  const [createProject, { loading: creating }] = useMutation(CREATE_PROJECT);
  const [updateProject, { loading: updating }] = useMutation(UPDATE_PROJECT);
  const isLoading = creating || updating;

  async function onSubmit(values: ProjectFormValues) {
    setError(null);
    try {
      const credentials = values.credentials || undefined;
      const previewCommand = values.previewCommand?.trim() || undefined;
      const previewReadyPattern =
        values.previewReadyPattern?.trim() || undefined;
      const previewPort = values.previewPort
        ? Number(values.previewPort)
        : undefined;
      const payload = {
        name: values.name,
        repositoryUrl: values.repositoryUrl,
        credentials,
        previewCommand,
        previewPort,
        previewReadyPattern,
      };
      if (mode === 'create') {
        const { data } = await createProject({ variables: payload });
        if (data?.createProject?.id) {
          toast.success('Project created');
          router.push(`/projects/${data.createProject.id}`);
        }
      } else if (projectId) {
        await updateProject({
          variables: { id: projectId, ...payload },
        });
        toast.success('Project updated');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Operation failed';
      setError(message);
    }
  }

  return { form, error, isLoading, onSubmit };
}
