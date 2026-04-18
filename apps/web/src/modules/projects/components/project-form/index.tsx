'use client';

import { FormErrorAlert } from '@/components/common/form-error-alert';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import type { ProjectFormValues } from './libs';
import { useService } from './use-service';

interface ProjectFormProps {
  mode: 'create' | 'edit';
  projectId?: string;
  defaultValues?: Partial<ProjectFormValues>;
}

export function ProjectForm({
  mode,
  projectId,
  defaultValues,
}: ProjectFormProps) {
  const { form, error, isLoading, onSubmit } = useService({
    mode,
    projectId,
    defaultValues,
  });

  return (
    <div className="space-y-6">
      <FormErrorAlert message={error} />

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Project name</FormLabel>
                <FormControl>
                  <Input placeholder="My project" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="repositoryUrl"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Repository URL</FormLabel>
                <FormControl>
                  <Input
                    placeholder="https://github.com/user/repo"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="credentials"
            render={({ field }) => (
              <FormItem>
                <FormLabel>GitHub Token (optional)</FormLabel>
                <FormControl>
                  <Input
                    type="password"
                    placeholder="ghp_xxxxxxxxxxxx"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="rounded-md border bg-muted/30 p-4 space-y-4">
            <div>
              <h3 className="text-sm font-medium">
                Preview configuration (optional)
              </h3>
              <p className="text-xs text-muted-foreground mt-1">
                When set, defect-resolution tasks will start the dev server
                during FILTER and expose a preview URL for visual review. Leave
                blank for non-web projects.
              </p>
            </div>

            <FormField
              control={form.control}
              name="previewCommand"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Dev server command</FormLabel>
                  <FormControl>
                    <Input placeholder="pnpm dev" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="previewPort"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Port</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="3000"
                      {...field}
                      value={field.value ?? ''}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="previewReadyPattern"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Ready log pattern (optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="ready in" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <Button type="submit" disabled={isLoading}>
            {isLoading
              ? mode === 'create'
                ? 'Creating...'
                : 'Saving...'
              : mode === 'create'
                ? 'Create Project'
                : 'Save Changes'}
          </Button>
        </form>
      </Form>
    </div>
  );
}
