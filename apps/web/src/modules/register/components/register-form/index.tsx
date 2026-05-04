'use client';

import Link from 'next/link';
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
import { useService } from './use-service';

export function RegisterForm() {
  const { form, error, isLoading, onSubmit } = useService();

  return (
    <div>
      <h2 className="m-0 text-[22px] font-semibold tracking-normal">
        Create an account
      </h2>
      <p className="m-0 mt-1.5 mb-7 text-[13px] text-foreground-muted">
        Start resolving defects in minutes.
      </p>

      <FormErrorAlert message={error} />

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3.5">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-[11.5px] font-medium text-foreground-muted">
                  Full name
                </FormLabel>
                <FormControl>
                  <Input
                    placeholder="Mira Kapoor"
                    autoComplete="name"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-[11.5px] font-medium text-foreground-muted">
                  Work email
                </FormLabel>
                <FormControl>
                  <Input
                    type="email"
                    placeholder="[email protected]"
                    autoComplete="email"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <div className="flex items-baseline justify-between">
                  <FormLabel className="text-[11.5px] font-medium text-foreground-muted">
                    Password
                  </FormLabel>
                  <span className="text-[11px] text-foreground-subtle">
                    Min. 8 characters
                  </span>
                </div>
                <FormControl>
                  <Input
                    type="password"
                    placeholder="••••••••"
                    autoComplete="new-password"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="confirmPassword"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-[11.5px] font-medium text-foreground-muted">
                  Confirm password
                </FormLabel>
                <FormControl>
                  <Input
                    type="password"
                    placeholder="••••••••"
                    autoComplete="new-password"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? 'One moment…' : 'Create account →'}
          </Button>
        </form>
      </Form>

      <p className="mt-5 text-center text-[12.5px] text-foreground-muted">
        Already have an account?{' '}
        <Link
          href="/login"
          className="font-medium text-foreground no-underline"
        >
          Sign in
        </Link>
      </p>
    </div>
  );
}
