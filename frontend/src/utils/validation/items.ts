import { z } from 'zod'

export const itemSchema = z.object({
  name: z.string().min(1, 'Item name is required').max(500, 'Item name is too long'),
  boardId: z.string().min(1, 'Board ID is required'),
  groupId: z.string().min(1, 'Group ID is required'),
  position: z.number().int().min(0).optional(),
  parentId: z.string().optional(),
  columnValues: z.array(z.object({
    columnId: z.string(),
    value: z.any(),
  })).optional(),
})

export type ItemInput = z.infer<typeof itemSchema>

