import { z } from 'zod'

export const commentSchema = z.object({
  text: z.string().min(1, 'Comment text is required').max(5000, 'Comment is too long'),
  itemId: z.string().min(1, 'Item ID is required'),
  parentId: z.string().optional(),
  mentions: z.array(z.string()).optional(),
})

export type CommentInput = z.infer<typeof commentSchema>

