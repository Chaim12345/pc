import { z } from 'zod'

export const boardSchema = z.object({
  name: z.string().min(1, 'Board name is required').max(200, 'Board name is too long'),
  description: z.string().max(1000, 'Description is too long').optional(),
  organizationId: z.string().min(1, 'Organization ID is required'),
})

export type BoardInput = z.infer<typeof boardSchema>

