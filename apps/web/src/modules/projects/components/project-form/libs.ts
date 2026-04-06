import { z } from 'zod';

export const projectSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  repositoryUrl: z.string().url('Must be a valid URL'),
  credentials: z.string().optional(),
});

export type ProjectFormValues = z.infer<typeof projectSchema>;
