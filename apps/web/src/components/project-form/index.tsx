'use client';

import { FormErrorAlert } from '@/components/common/form-error-alert';
import { SectionHead } from '@/components/common/section-head';
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

const labelClass =
  'text-[11.5px] font-medium uppercase tracking-[0.04em] text-foreground-subtle';

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

  const submitLabel = isLoading
    ? mode === 'create'
      ? 'Connecting…'
      : 'Saving…'
    : mode === 'create'
      ? 'Connect repository'
      : 'Save changes';

  return (
    <div>
      <FormErrorAlert message={error} />

      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="flex flex-col gap-7"
        >
          {/* Basics */}
          <section>
            <SectionHead
              title="Repository"
              subtitle="What Torin will analyze and patch"
            />
            <div className="rounded-md border border-border bg-surface p-5">
              <div className="flex flex-col gap-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className={labelClass}>Project name</FormLabel>
                      <FormControl>
                        <Input placeholder="acme-billing" {...field} />
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
                      <FormLabel className={labelClass}>
                        Repository URL
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="https://github.com/acme/billing-service"
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
                      <FormLabel className={labelClass}>
                        GitHub token
                        <span className="ml-1 font-normal normal-case tracking-normal text-foreground-subtle">
                          — optional
                        </span>
                      </FormLabel>
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
              </div>
            </div>
          </section>

          {/* Preview */}
          <section>
            <SectionHead
              title="Preview"
              subtitle="Boot-verify dev server during FILTER · leave blank for non-web projects"
            />
            <div className="rounded-md border border-border bg-surface p-5">
              <div className="flex flex-col gap-4">
                <FormField
                  control={form.control}
                  name="previewCommand"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className={labelClass}>
                        Dev server command
                      </FormLabel>
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
                      <FormLabel className={labelClass}>Port</FormLabel>
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
                      <FormLabel className={labelClass}>
                        Ready log pattern
                        <span className="ml-1 font-normal normal-case tracking-normal text-foreground-subtle">
                          — optional
                        </span>
                      </FormLabel>
                      <FormControl>
                        <Input placeholder="ready in" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>
          </section>

          <div className="flex justify-end">
            <Button type="submit" disabled={isLoading}>
              {submitLabel}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
