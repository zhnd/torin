import { z } from 'zod';

export const projectSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  repositoryUrl: z.string().url('Must be a valid URL'),
});

export type ProjectFormValues = z.infer<typeof projectSchema>;
