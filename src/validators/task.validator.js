import { z } from "zod"

export const createTaskSchema = z.object({
  title: z.string().min(1),
  completed: z.boolean().optional(),
  priority: z.enum(["low", "medium", "high"]).optional(),
  dueDate: z.string().datetime().optional().nullable(),
  recurring: z.string().optional().nullable(),
  reminderAt: z.string().datetime().optional().nullable(),
  noteId: z.number().int().optional().nullable(),
  parentId: z.number().int().optional().nullable(),
  assignedToId: z.number().int().optional().nullable()
})

export const updateTaskSchema = createTaskSchema.partial()
