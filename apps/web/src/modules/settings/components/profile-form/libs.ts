import { z } from 'zod';

export const profileSchema = z.object({
  name: z.string().min(1, 'Name is required'),
});

export type ProfileFormValues = z.infer<typeof profileSchema>;
